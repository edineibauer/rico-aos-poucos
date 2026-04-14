"""Monta data/fundosnet-universo.json a partir dos JSONs existentes de FII.

Saída:
    {
      "ultimaAtualizacao": "YYYY-MM-DD",
      "total": N,
      "fundos": [
        {
          "ticker": "BLMG11",
          "nome": "BlueMacaw Fundo de Investimento Imobiliário",
          "cnpj": "12.345.678/0001-90" | null,
          "segmento": "Multi-estratégia",
          "cobertura": "ativa",                # tem JSON completo
          "arquivoJson": "data/fiis/blmg11.json"
        }
      ]
    }
"""
import json
import re
from datetime import date

from paths import FIIS_DIR, UNIVERSO


def _extrair_cnpj(json_data: dict) -> str | None:
    """Tenta achar CNPJ em qualquer lugar do JSON (formato 00.000.000/0000-00)."""
    padrao = re.compile(r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}")
    texto = json.dumps(json_data, ensure_ascii=False)
    m = padrao.search(texto)
    return m.group(0) if m else None


def main() -> None:
    fundos = []
    for arq in sorted(FIIS_DIR.glob("*.json")):
        if arq.name.startswith("."):
            continue
        try:
            data = json.loads(arq.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[warn] falha em {arq.name}: {e}")
            continue

        meta = data.get("meta", {}) or {}
        ticker = (meta.get("ticker") or arq.stem).upper()
        fundos.append({
            "ticker": ticker,
            "nome": meta.get("nome"),
            "cnpj": _extrair_cnpj(data),
            "segmento": meta.get("segmento"),
            "cobertura": "ativa",
            "arquivoJson": f"data/fiis/{arq.name}",
        })

    universo = {
        "ultimaAtualizacao": date.today().isoformat(),
        "total": len(fundos),
        "com_cnpj": sum(1 for f in fundos if f["cnpj"]),
        "sem_cnpj": sum(1 for f in fundos if not f["cnpj"]),
        "fundos": fundos,
    }
    UNIVERSO.write_text(json.dumps(universo, indent=2, ensure_ascii=False))
    print(f"[ok] {UNIVERSO.relative_to(UNIVERSO.parent.parent)}: {len(fundos)} fundos "
          f"({universo['com_cnpj']} com CNPJ, {universo['sem_cnpj']} sem)")


if __name__ == "__main__":
    main()
