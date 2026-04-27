"""Extrai histórico mensal de Valor Patrimonial (VP/cota), Patrimônio Líquido,
número de cotas e caixa líquido a partir dos Informes Mensais Estruturados
em data/fiis-optimized/{TICKER}/.

Salva data/fiis/{ticker}/historico_vp.csv com colunas:
    data,vp_cota,patrimonio_liquido,n_cotas,caixa_liquido,fonte_doc_id

Os Informes Mensais Estruturados têm formato regular (HTML estruturado da CVM):
    Data de referência: MM/YYYY
    2 | Patrimônio Líquido – R$ | 333.385.384,48
    3 | Número de Cotas Emitidas | 4.674.548,0000
    4 | Valor Patrimonial das Cotas – R$ | 71,319277
    9 | Total mantido para as Necessidades de Liquidez ... | 2.946.571,30

Uso:
    python3 scripts/cotacoes/extrair_vp_historico.py --ticker BLMG11
    python3 scripts/cotacoes/extrair_vp_historico.py --todos
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
FIIS_DIR = DATA / "fiis"
FIIS_OPTIMIZED = DATA / "fiis-optimized"

RE_DATA_REF = re.compile(r"Data de refer[êe]ncia:\s*(\d{2})/(\d{4})", re.IGNORECASE)
RE_PL = re.compile(r"\b2\s*\|\s*Patrim[ôo]nio L[íi]quido[^|]*\|\s*([\d\.,]+)", re.IGNORECASE)
RE_COTAS = re.compile(r"\b3\s*\|\s*N[úu]mero de Cotas Emitidas[^|]*\|\s*([\d\.,]+)", re.IGNORECASE)
RE_VP_COTA = re.compile(r"\b4\s*\|\s*Valor Patrimonial das Cotas[^|]*\|\s*([\d\.,]+)", re.IGNORECASE)
RE_CAIXA = re.compile(r"\b9\s*\|\s*Total mantido para as Necessidades de Liquidez[^|]*\|\s*([\d\.,]+)", re.IGNORECASE)


def _parse_br_number(s: str) -> float | None:
    """Converte número no formato brasileiro (1.234,56) para float."""
    if not s:
        return None
    s = s.strip().replace(" ", "")
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _extrair_um(md_path: Path, doc_id: str) -> dict[str, Any] | None:
    try:
        texto = md_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return None

    m_data = RE_DATA_REF.search(texto)
    m_vp = RE_VP_COTA.search(texto)
    m_pl = RE_PL.search(texto)
    m_cotas = RE_COTAS.search(texto)
    m_caixa = RE_CAIXA.search(texto)

    if not (m_data and m_vp):
        return None

    mes, ano = m_data.group(1), m_data.group(2)
    vp_cota = _parse_br_number(m_vp.group(1))
    if vp_cota is None or vp_cota <= 0:
        return None

    return {
        "data": f"{ano}-{mes}",
        "vp_cota": round(vp_cota, 4),
        "patrimonio_liquido": _parse_br_number(m_pl.group(1)) if m_pl else None,
        "n_cotas": _parse_br_number(m_cotas.group(1)) if m_cotas else None,
        "caixa_liquido": _parse_br_number(m_caixa.group(1)) if m_caixa else None,
        "fonte_doc_id": doc_id,
    }


def extrair(ticker: str) -> dict[str, Any]:
    ticker_up = ticker.upper()
    pasta_optimized = FIIS_OPTIMIZED / ticker_up
    if not pasta_optimized.exists():
        return {"ticker": ticker_up, "ok": False, "erro": f"sem pasta {pasta_optimized}"}

    metas = sorted(pasta_optimized.glob("*.meta.json"))
    if not metas:
        return {"ticker": ticker_up, "ok": False, "erro": "sem .meta.json"}

    print(f"[{ticker_up}] varrendo {len(metas)} documentos…")
    pontos: dict[str, dict[str, Any]] = {}

    for meta_path in metas:
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            continue

        tipo = (meta.get("tipo") or "").strip()
        if tipo != "Informe Mensal Estruturado":
            continue

        doc_id = meta.get("id") or meta_path.stem.replace(".meta", "")
        md_path = meta_path.with_name(f"{doc_id}.md")
        if not md_path.exists():
            continue

        ponto = _extrair_um(md_path, doc_id)
        if not ponto:
            continue

        # Se houver dois Informes para o mesmo mês, manter o de doc_id maior (mais recente)
        existente = pontos.get(ponto["data"])
        if existente and int(existente["fonte_doc_id"]) > int(doc_id):
            continue
        pontos[ponto["data"]] = ponto

    if not pontos:
        return {"ticker": ticker_up, "ok": False, "erro": "nenhum Informe Mensal com VP/cota válido"}

    rows = sorted(pontos.values(), key=lambda r: r["data"])
    pasta = FIIS_DIR / ticker_up.lower()
    pasta.mkdir(parents=True, exist_ok=True)
    csv_path = pasta / "historico_vp.csv"

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["data", "vp_cota", "patrimonio_liquido", "n_cotas", "caixa_liquido", "fonte_doc_id"])
        w.writeheader()
        for r in rows:
            w.writerow(r)

    ult = rows[-1]
    meta_out = {
        "csvPath": f"data/fiis/{ticker_up.lower()}/historico_vp.csv",
        "fonte": "Informes Mensais Estruturados (CVM)",
        "dataInicio": rows[0]["data"],
        "dataFim": ult["data"],
        "ultimoVpCota": ult["vp_cota"],
        "ultimoVpData": ult["data"],
        "ultimoPL": ult["patrimonio_liquido"],
        "ultimoNumCotas": ult["n_cotas"],
        "totalPontos": len(rows),
    }
    meta_path_out = pasta / "historico_vp.meta.json"
    meta_path_out.write_text(json.dumps(meta_out, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"  [{ticker_up}] {len(rows)} pontos: {rows[0]['data']} → {ult['data']} | "
          f"VP atual R$ {ult['vp_cota']:.2f}")
    return {"ticker": ticker_up, "ok": True, "pontos": len(rows), "meta": meta_out}


def _listar_todos() -> list[str]:
    if not FIIS_OPTIMIZED.exists():
        return []
    return sorted(p.name.upper() for p in FIIS_OPTIMIZED.iterdir() if p.is_dir())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ticker", help="Ticker único")
    ap.add_argument("--tickers", help="Lista separada por vírgula")
    ap.add_argument("--todos", action="store_true", help="Todos com data/fiis-optimized/{T}/")
    ap.add_argument("--limit", type=int, default=0)
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

    print(f"[extrair_vp_historico] {len(tickers)} ticker(s)")
    ok = falha = 0
    for t in tickers:
        try:
            res = extrair(t)
            if res["ok"]:
                ok += 1
            else:
                falha += 1
                print(f"  [falha] {t}: {res.get('erro')}")
        except Exception as e:
            falha += 1
            print(f"  [falha] {t}: {e}")

    print(f"\n[extrair_vp_historico] concluído — ok={ok} falha={falha}")
    return 0 if falha == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
