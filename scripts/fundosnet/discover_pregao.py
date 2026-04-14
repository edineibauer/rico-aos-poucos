"""Descobre nomePregao para tickers específicos no Fundos.NET.

Usa pistas do descricaoFundo + radical do ticker para casar. Grava em
data/fundosnet-mapa-overlay.json (que complementa o mapa automático).

Uso:
    python3 discover_pregao.py BTAL11 KFOF11 KISU11
    python3 discover_pregao.py --dias 90 BTAL11 KFOF11 KISU11
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from datetime import date, timedelta
from pathlib import Path

from client import TIPO_FII, buscar_publicacoes
from paths import DATA

OVERLAY = DATA / "fundosnet-mapa-overlay.json"


def _ascii(s: str) -> str:
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode("ascii").upper()


# Pistas para tickers conhecidos — ajuda a reconhecer no descricaoFundo.
PISTAS = {
    "BTAL11": ["BTG PACTUAL AGRO", "BTG AGRO LOG"],
    "KFOF11": ["KINEA FOF"],
    "KISU11": ["KINEA SUNO"],
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tickers", nargs="+")
    ap.add_argument("--dias", type=int, default=60)
    args = ap.parse_args()

    hoje = date.today()
    di = (hoje - timedelta(days=args.dias)).strftime("%d/%m/%Y")
    df = hoje.strftime("%d/%m/%Y")
    print(f"[discover] buscando pregões de {di} até {df}…")

    alvos_upper = [t.upper() for t in args.tickers]
    radicais = {re.sub(r"\d+$", "", t.upper()): t.upper() for t in alvos_upper}
    pistas_por_ticker = {t: PISTAS.get(t, [radicais.__class__({k: v for k, v in radicais.items() if v == t})])
                         for t in alvos_upper}

    candidatos: dict[str, dict] = {}
    vistos = 0
    for doc in buscar_publicacoes(di, df, tipo_fundo=TIPO_FII):
        vistos += 1
        if vistos % 500 == 0:
            print(f"  progresso: {vistos} docs", flush=True)

        desc = _ascii(doc.get("descricaoFundo") or "")
        preg = _ascii(doc.get("nomePregao") or "")
        if not preg:
            continue

        for ticker in alvos_upper:
            rad = re.sub(r"\d+$", "", ticker)
            pistas = PISTAS.get(ticker, []) + [rad]
            for p in pistas:
                pa = _ascii(p)
                if pa in desc or pa in preg:
                    key = (ticker, doc.get("nomePregao"))
                    if key not in candidatos:
                        candidatos[key] = {
                            "ticker": ticker,
                            "nomePregao": doc.get("nomePregao"),
                            "descricaoFundo": doc.get("descricaoFundo"),
                            "docs_vistos": 1,
                            "fundoOuClasse": doc.get("fundoOuClasse"),
                        }
                    else:
                        candidatos[key]["docs_vistos"] += 1
                    break

    print(f"[discover] {vistos} docs varridos, {len(candidatos)} candidatos\n")

    # resultado
    mapa_existente = {}
    if OVERLAY.exists():
        mapa_existente = json.loads(OVERLAY.read_text(encoding="utf-8")).get("mapa", {})

    por_ticker: dict[str, list] = {}
    for (ticker, pregao), info in candidatos.items():
        por_ticker.setdefault(ticker, []).append(info)

    for ticker in alvos_upper:
        print(f"=== {ticker} ===")
        ops = por_ticker.get(ticker, [])
        if not ops:
            print(f"  (nenhum pregão encontrado em {args.dias} dias)")
            continue
        ops.sort(key=lambda x: -x["docs_vistos"])
        for o in ops[:5]:
            print(f"  [{o['docs_vistos']:3d} docs] {o['nomePregao']:25s} | "
                  f"{(o['descricaoFundo'] or '')[:80]} | {o['fundoOuClasse']}")
        # adiciona o principal (mais documentos) ao overlay
        principal = ops[0]
        mapa_existente[principal["nomePregao"]] = {
            "ticker": ticker,
            "nomePregao": principal["nomePregao"],
            "descricaoFundo": principal["descricaoFundo"],
            "metodo": "manual_discovery",
        }

    saida = {
        "ultimaAtualizacao": hoje.isoformat(),
        "total": len(mapa_existente),
        "mapa": mapa_existente,
    }
    OVERLAY.write_text(json.dumps(saida, indent=2, ensure_ascii=False))
    print(f"\n[ok] overlay atualizado: {OVERLAY} ({len(mapa_existente)} pregões)")


if __name__ == "__main__":
    main()
