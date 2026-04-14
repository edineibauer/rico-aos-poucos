"""Cria JSONs mínimos de FII para tickers novos. O pipeline IA vai
enriquecer ao longo das execuções.

Uso:
    python3 stub_fii.py KFOF11 "Kinea FOF Ações FII"
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from paths import FIIS_DIR, ROOT


def criar(ticker: str, nome: str, segmento: str = "Multi-estratégia") -> Path:
    ticker = ticker.upper()
    dst_json = FIIS_DIR / f"{ticker.lower()}.json"
    if dst_json.exists():
        raise SystemExit(f"{dst_json} já existe")

    stub = {
        "meta": {
            "ticker": ticker,
            "nome": nome,
            "segmento": segmento,
            "badges": [],
            "sentimento": "neutro",
            "dataAnalise": None,
            "totalDocumentos": 0,
        },
        "seo": {
            "title": f"{ticker} — Análise em construção | Rico aos Poucos",
            "description": f"Análise do FII {ticker} ({nome}). Dados sendo consolidados automaticamente a partir de publicações oficiais CVM/B3.",
            "keywords": f"{ticker}, {nome}, FII, análise {ticker}",
            "canonical": f"https://ricoaospoucos.com.br/fiis/{ticker.lower()}/",
            "ogTitle": f"{ticker} — Análise {nome}",
            "ogDescription": f"Análise em construção do FII {ticker}.",
            "twitterTitle": f"{ticker} — {nome}",
            "twitterDescription": f"Análise do FII {ticker}.",
        },
        "indicadores": {},
        "recomendacao": {
            "nota": None,
            "veredicto": "EM ANÁLISE",
            "cor": "slate",
            "resumo": "Análise sendo construída a partir de publicações oficiais CVM/B3.",
        },
        "quickStats": [],
        "pontosAtencao": [],
        "gestora": None,
        "taxas": None,
        "portfolio": None,
        "timeline": None,
        "tese": None,
        "dividendos": None,
        "ativosDetalhados": None,
        "valuation": None,
        "conclusao": None,
        "footer": {
            "disclaimer": "Este material tem caráter exclusivamente informativo e não constitui recomendação de investimento. Dados automatizados a partir de publicações oficiais."
        },
    }

    dst_json.write_text(json.dumps(stub, indent=2, ensure_ascii=False))

    # cria pasta fiis/<ticker>/index.html
    dst_dir = ROOT / "fiis" / ticker.lower()
    dst_dir.mkdir(parents=True, exist_ok=True)
    dst_html = dst_dir / "index.html"
    template_html = (ROOT / "fiis" / "blmg11" / "index.html").read_text(encoding="utf-8")
    template_html = (
        template_html
        .replace("BLMG11", ticker)
        .replace("blmg11", ticker.lower())
        .replace("BlueMacaw", nome.split()[0])
    )
    dst_html.write_text(template_html, encoding="utf-8")

    return dst_json


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("uso: python3 stub_fii.py TICKER 'Nome Completo' [segmento]")
        sys.exit(1)
    seg = sys.argv[3] if len(sys.argv) > 3 else "Multi-estratégia"
    p = criar(sys.argv[1], sys.argv[2], seg)
    print(f"[ok] {p}")
