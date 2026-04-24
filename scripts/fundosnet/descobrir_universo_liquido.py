"""Monta data/fundosnet-liquidos.json: FIIs/Fiagros com liquidez ≥ limiar.

Fontes:
  - Fundamentus (www.fundamentus.com.br/fii_resultado.php) para lista + volume médio diário.
  - Status Invest (ficha individual) para CNPJ.

Saída: data/fundosnet-liquidos.json
  {
    "ultimaAtualizacao": "2026-04-22",
    "limiarLiquidezDiaria": 20000,
    "total": N,
    "fundos": [
      {"ticker": "HGLG11", "segmento": "Multicategoria", "cotacao": 157.90,
       "valorMercado": 6695700000, "liquidezDiaria": 14589600,
       "dividendYield": 8.30, "pvp": 0.95, "cnpj": "11.728.688/0001-47"}
    ]
  }

Uso:
  python3 descobrir_universo_liquido.py                     # padrão: 20k
  python3 descobrir_universo_liquido.py --limiar 100000     # só >= 100k
  python3 descobrir_universo_liquido.py --sem-cnpj           # pula scraping de CNPJ
"""
from __future__ import annotations

import argparse
import html as html_mod
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from paths import DATA

ARQUIVO_SAIDA = DATA / "fundosnet-liquidos.json"
LIMIAR_DEFAULT = 20_000

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}


def _sessao() -> requests.Session:
    s = requests.Session()
    retry = Retry(total=3, backoff_factor=1.5, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry, pool_connections=8, pool_maxsize=8)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    s.headers.update(HEADERS)
    return s


SESSAO = _sessao()


# ---------------------------------------------------------------------------
# Fundamentus — lista de FIIs/Fiagros com volume médio diário
# ---------------------------------------------------------------------------

def _num(s: str) -> float:
    s = (s or "").replace("R$", "").replace(".", "").replace(",", ".").replace("%", "").strip()
    try:
        return float(s)
    except Exception:
        return 0.0


def _clean(s: str) -> str:
    return html_mod.unescape(re.sub(r"<[^>]+>", "", s).strip())


def listar_fundamentus() -> list[dict]:
    """Retorna lista de fundos com {ticker, segmento, cotacao, valorMercado, liquidezDiaria, dy, pvp}."""
    r = SESSAO.get("https://www.fundamentus.com.br/fii_resultado.php", timeout=30)
    r.raise_for_status()

    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", r.text, re.DOTALL)
    fundos: list[dict] = []
    for row in rows[1:]:  # skip header
        cells = re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", row, re.DOTALL)
        if len(cells) < 8:
            continue
        cells = [_clean(c) for c in cells]
        ticker = cells[0].upper()
        if not re.match(r"^[A-Z]{4}\d{1,2}$", ticker):
            continue
        fundos.append({
            "ticker": ticker,
            "segmento": cells[1],
            "cotacao": _num(cells[2]),
            "ffoYield": _num(cells[3]),
            "dividendYield": _num(cells[4]),
            "pvp": _num(cells[5]),
            "valorMercado": int(_num(cells[6])),
            "liquidezDiaria": int(_num(cells[7])),
        })
    return fundos


# ---------------------------------------------------------------------------
# Status Invest — CNPJ por ticker (scraping)
# ---------------------------------------------------------------------------

CNPJ_RX = re.compile(r"\b(\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})\b")


def _buscar_cnpj_statusinvest(ticker: str) -> tuple[str | None, str | None]:
    t = ticker.lower()
    try:
        sr = SESSAO.get("https://statusinvest.com.br/home/mainsearchquery",
                        params={"q": ticker},
                        headers={"X-Requested-With": "XMLHttpRequest"},
                        timeout=15)
        url_ficha = None
        tipo = None
        if sr.status_code == 200:
            try:
                for item in sr.json():
                    if item.get("code", "").upper() == ticker.upper():
                        url_ficha = item.get("url")
                        tipo = "fiagro" if "/fiagros/" in (url_ficha or "") else "fii"
                        break
            except Exception:
                pass
        if url_ficha:
            r = SESSAO.get(f"https://statusinvest.com.br{url_ficha}", timeout=15)
            if r.status_code == 200:
                m = CNPJ_RX.search(r.text)
                if m:
                    return m.group(1), tipo
        for prefixo, tp in (("/fundos-imobiliarios/", "fii"), ("/fiagros/", "fiagro")):
            r = SESSAO.get(f"https://statusinvest.com.br{prefixo}{t}", timeout=15)
            if r.status_code == 200:
                m = CNPJ_RX.search(r.text)
                if m:
                    return m.group(1), tp
    except Exception:
        pass
    return None, None


def _buscar_cnpj_fundsexplorer(ticker: str) -> str | None:
    try:
        r = SESSAO.get(f"https://www.fundsexplorer.com.br/funds/{ticker}", timeout=15)
        if r.status_code == 200:
            m = CNPJ_RX.search(r.text)
            if m:
                return m.group(1)
    except Exception:
        pass
    return None


def buscar_cnpj(ticker: str) -> tuple[str | None, str | None]:
    """Retorna (cnpj, tipo). Tenta Status Invest primeiro, depois Funds Explorer."""
    cnpj, tipo = _buscar_cnpj_statusinvest(ticker)
    if cnpj:
        return cnpj, tipo
    cnpj = _buscar_cnpj_fundsexplorer(ticker)
    return cnpj, tipo


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Gera universo de FIIs/Fiagros líquidos")
    ap.add_argument("--limiar", type=int, default=LIMIAR_DEFAULT,
                    help=f"Liquidez diária mínima em R$ (default {LIMIAR_DEFAULT})")
    ap.add_argument("--sem-cnpj", action="store_true",
                    help="Pula scraping de CNPJ (mais rápido)")
    ap.add_argument("--workers", type=int, default=4,
                    help="Workers paralelos para scraping de CNPJ")
    ap.add_argument("--saida", default=str(ARQUIVO_SAIDA))
    args = ap.parse_args()

    print(f"[1/3] Buscando listagem Fundamentus…", flush=True)
    fundos = listar_fundamentus()
    print(f"      total listado: {len(fundos)}")

    fundos = [f for f in fundos if f["liquidezDiaria"] >= args.limiar]
    print(f"      com liquidez ≥ R$ {args.limiar:,}: {len(fundos)}")

    if not args.sem_cnpj:
        print(f"\n[2/3] Buscando CNPJ ({args.workers} workers)…", flush=True)
        achados = 0
        inicio = time.time()
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futuros = {ex.submit(buscar_cnpj, f["ticker"]): f for f in fundos}
            for i, fut in enumerate(as_completed(futuros), start=1):
                f = futuros[fut]
                try:
                    cnpj, tipo = fut.result()
                except Exception:
                    cnpj, tipo = None, None
                if cnpj:
                    f["cnpj"] = cnpj
                    achados += 1
                if tipo:
                    f["tipo"] = tipo
                if i % 20 == 0 or i == len(fundos):
                    dt = time.time() - inicio
                    print(f"      [{i:4d}/{len(fundos)}] cnpj_ok={achados} ({dt:.0f}s)", flush=True)
        print(f"      CNPJs obtidos: {achados}/{len(fundos)}")

    print(f"\n[3/3] Gravando {args.saida}")
    fundos.sort(key=lambda f: f["ticker"])
    saida = {
        "ultimaAtualizacao": date.today().isoformat(),
        "limiarLiquidezDiaria": args.limiar,
        "fonte": "Fundamentus (volume/segmento) + Status Invest (CNPJ)",
        "total": len(fundos),
        "com_cnpj": sum(1 for f in fundos if f.get("cnpj")),
        "fundos": fundos,
    }
    Path(args.saida).write_text(json.dumps(saida, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[ok] {len(fundos)} fundos gravados.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
