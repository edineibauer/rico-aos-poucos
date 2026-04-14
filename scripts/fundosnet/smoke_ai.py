"""Smoke test do ai.py — invoca claude -p com um caso mínimo.

Não depende de universo/mapa. Só valida:
  1. Que o CLI aceita --json-schema + --append-system-prompt.
  2. Que o envelope JSON vem parseável.
  3. Que AnaliseResultado sai preenchido.
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

from ai import analisar, AiError


def main() -> int:
    texto = (Path(__file__).parent.parent / "spike-fundosnet/output/doc_1160534.txt").read_text()
    fundo_json_fake = {
        "meta": {"ticker": "TESTE11", "nome": "Fundo Teste", "segmento": "Lajes Corporativas"},
        "indicadores": {"cotacao": 10.0, "dividendoMensal": 0.05},
    }

    t0 = time.time()
    try:
        result = analisar(
            ticker="CVFL11",
            fundo_json=fundo_json_fake,
            documento_texto=texto[:20_000],
            documento_meta={
                "id": 1160534,
                "tipoDocumento": "Relatório Gerencial",
                "categoriaDocumento": "Relatórios",
                "dataReferencia": "31/03/2026",
                "dataEntrega": "13/04/2026 16:20",
                "descricaoFundo": "CATUAÍ VISTA FL FII",
            },
            modelo="sonnet",
            timeout=300,
        )
    except AiError as e:
        print(f"[smoke] AiError: {e}", file=sys.stderr)
        return 1
    dt = time.time() - t0

    print(f"[smoke] ok em {dt:.1f}s")
    print(f"        relevance: {result.relevance}")
    print(f"        confidence: {result.confidence}")
    print(f"        article?: {'SIM' if result.article else 'nao'}")
    print(f"        patch keys: {list(result.patch.keys())[:10]}")
    print(f"        reasoning[:200]: {result.reasoning[:200]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
