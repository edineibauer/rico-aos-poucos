"""Coleta histórico de cotação (preço de fechamento NÃO ajustado) de FIIs.

Salva em data/fiis/{ticker}/historico_precos.csv com colunas:
    data,fechamento,abertura,maxima,minima,volume

Backends (em ordem de preferência):
  1. Yahoo Finance v8 chart API (HTTP direto, stdlib only) — preferido.
  2. brapi.dev — fallback para FIIs novos com pouca liquidez.

REGRA DURA: usa o preço de fechamento NÃO ajustado por dividendos
(`close`, não `adjclose`). É o preço que de fato foi negociado naquele dia.

Uso:
    python3 -m cotacoes.coletar_historico --ticker BLMG11
    python3 -m cotacoes.coletar_historico --ticker BLMG11 --frequencia diaria
    python3 -m cotacoes.coletar_historico --todos
    python3 -m cotacoes.coletar_historico --tickers BLMG11,FTCA11,KNCR11

Lê tickers de:
    - --ticker / --tickers: explícito
    - --todos: todos com data/fiis-optimized/{TICKER}/ existente
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
FIIS_DIR = DATA / "fiis"
FIIS_OPTIMIZED = DATA / "fiis-optimized"

USER_AGENT = "Mozilla/5.0 (compatible; RicoAosPoucos/1.0; +https://ricoaospoucos.com.br)"


def _http_get(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _coletar_yahoo(ticker: str, frequencia: str = "semanal") -> list[dict[str, Any]] | None:
    """Backend Yahoo Finance v8 (chart). Retorna lista de dicts ou None se falhar."""
    interval = "1wk" if frequencia == "semanal" else "1d"
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}.SA"
        f"?range=10y&interval={interval}&includePrePost=false"
    )
    try:
        raw = _http_get(url)
        data = json.loads(raw)
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, TimeoutError) as e:
        print(f"  [yahoo] falha: {e}", file=sys.stderr)
        return None

    chart = data.get("chart") or {}
    if chart.get("error"):
        print(f"  [yahoo] erro: {chart['error']}", file=sys.stderr)
        return None
    result = (chart.get("result") or [None])[0]
    if not result:
        print("  [yahoo] sem result", file=sys.stderr)
        return None

    timestamps = result.get("timestamp") or []
    quote = (result.get("indicators", {}).get("quote") or [{}])[0]
    closes = quote.get("close") or []
    opens = quote.get("open") or []
    highs = quote.get("high") or []
    lows = quote.get("low") or []
    volumes = quote.get("volume") or []

    rows: list[dict[str, Any]] = []
    for i, ts in enumerate(timestamps):
        if i >= len(closes) or closes[i] is None:
            continue
        dt = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
        rows.append({
            "data": dt,
            "fechamento": round(closes[i], 4) if closes[i] is not None else None,
            "abertura": round(opens[i], 4) if i < len(opens) and opens[i] is not None else None,
            "maxima": round(highs[i], 4) if i < len(highs) and highs[i] is not None else None,
            "minima": round(lows[i], 4) if i < len(lows) and lows[i] is not None else None,
            "volume": int(volumes[i]) if i < len(volumes) and volumes[i] is not None else 0,
        })
    return rows


def _coletar_brapi(ticker: str, frequencia: str = "semanal") -> list[dict[str, Any]] | None:
    """Backend brapi.dev. Cobertura menor mas útil para FIIs novos."""
    interval = "1wk" if frequencia == "semanal" else "1d"
    url = f"https://brapi.dev/api/quote/{ticker}?range=5y&interval={interval}&fundamental=false"
    try:
        raw = _http_get(url)
        data = json.loads(raw)
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, TimeoutError) as e:
        print(f"  [brapi] falha: {e}", file=sys.stderr)
        return None

    results = data.get("results") or []
    if not results:
        return None
    hist = results[0].get("historicalDataPrice") or []
    rows: list[dict[str, Any]] = []
    for h in hist:
        if h.get("close") is None:
            continue
        dt = datetime.fromtimestamp(h["date"], tz=timezone.utc).strftime("%Y-%m-%d")
        rows.append({
            "data": dt,
            "fechamento": round(h["close"], 4),
            "abertura": round(h.get("open") or h["close"], 4),
            "maxima": round(h.get("high") or h["close"], 4),
            "minima": round(h.get("low") or h["close"], 4),
            "volume": int(h.get("volume") or 0),
        })
    return rows


def coletar(ticker: str, frequencia: str = "semanal") -> dict[str, Any]:
    ticker_up = ticker.upper()
    print(f"[{ticker_up}] coletando histórico ({frequencia})…")

    rows = _coletar_yahoo(ticker_up, frequencia)
    fonte = "yahoo"
    if not rows or len(rows) < 5:
        print(f"  [{ticker_up}] yahoo retornou {len(rows or [])} pontos — tentando brapi…")
        rows = _coletar_brapi(ticker_up, frequencia)
        fonte = "brapi"

    if not rows:
        return {"ticker": ticker_up, "ok": False, "erro": "ambos backends falharam"}

    rows.sort(key=lambda r: r["data"])
    pasta = FIIS_DIR / ticker_up.lower()
    pasta.mkdir(parents=True, exist_ok=True)
    csv_path = pasta / "historico_precos.csv"

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["data", "fechamento", "abertura", "maxima", "minima", "volume"])
        w.writeheader()
        for r in rows:
            w.writerow(r)

    fechamentos_validos = [r for r in rows if r["fechamento"] is not None]
    if not fechamentos_validos:
        return {"ticker": ticker_up, "ok": False, "erro": "sem fechamentos válidos"}

    min_row = min(fechamentos_validos, key=lambda r: r["fechamento"])
    max_row = max(fechamentos_validos, key=lambda r: r["fechamento"])
    ult = fechamentos_validos[-1]

    meta = {
        "csvPath": f"data/fiis/{ticker_up.lower()}/historico_precos.csv",
        "frequencia": frequencia,
        "dataInicio": rows[0]["data"],
        "dataFim": rows[-1]["data"],
        "fonte": f"{fonte}:{ticker_up}.SA",
        "naoAjustado": True,
        "ultimoFechamento": ult["fechamento"],
        "ultimoFechamentoData": ult["data"],
        "minHistorico": {"valor": min_row["fechamento"], "data": min_row["data"]},
        "maxHistorico": {"valor": max_row["fechamento"], "data": max_row["data"]},
        "totalPontos": len(rows),
        "coletadoEm": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    meta_path = pasta / "historico_precos.meta.json"
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"  [{ticker_up}] {len(rows)} pontos salvos ({rows[0]['data']} → {rows[-1]['data']}, fonte={fonte})")
    return {"ticker": ticker_up, "ok": True, "pontos": len(rows), "fonte": fonte, "meta": meta}


def _listar_todos() -> list[str]:
    if not FIIS_OPTIMIZED.exists():
        return []
    return sorted(p.name.upper() for p in FIIS_OPTIMIZED.iterdir() if p.is_dir())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ticker", help="Ticker único")
    ap.add_argument("--tickers", help="Lista separada por vírgula")
    ap.add_argument("--todos", action="store_true", help="Todos com data/fiis-optimized/{T}/")
    ap.add_argument("--frequencia", choices=["semanal", "diaria"], default="semanal")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--sleep", type=float, default=1.0, help="Pausa entre tickers (seg)")
    args = ap.parse_args()

    if args.ticker:
        tickers = [args.ticker.upper()]
    elif args.tickers:
        tickers = [t.strip().upper() for t in args.tickers.split(",") if t.strip()]
    elif args.todos:
        tickers = _listar_todos()
        if args.limit > 0:
            tickers = tickers[:args.limit]
    else:
        ap.error("precisa --ticker, --tickers ou --todos")
        return 1

    print(f"[coletar_historico] vai processar {len(tickers)} ticker(s)")
    ok = falha = 0
    for i, t in enumerate(tickers):
        try:
            res = coletar(t, frequencia=args.frequencia)
            if res["ok"]:
                ok += 1
            else:
                falha += 1
                print(f"  [falha] {t}: {res.get('erro')}")
        except Exception as e:
            falha += 1
            print(f"  [falha] {t}: {e}")
        if i < len(tickers) - 1 and args.sleep > 0:
            time.sleep(args.sleep)

    print(f"\n[coletar_historico] concluído — ok={ok} falha={falha}")
    return 0 if falha == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
