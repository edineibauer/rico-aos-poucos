"""Agrupa imagens candidatas de um ticker por pHash similar.

Entrada:  data/fiis-optimized/{TICKER}/*.meta.json (com imagens_mantidas)
Saída:    data/fiis-optimized/{TICKER}/_clusters.json

Objetivo: reduzir N imagens únicas (geralmente centenas) para K representantes
          de cluster que possam ser classificados manualmente.

Algoritmo:
  1. Coleta todas as imagens_mantidas de todos os docs do ticker.
  2. Para cada imagem, calcula hamming distance do pHash vs clusters existentes.
  3. Se distância <= LIMIAR, junta ao cluster mais próximo; senão cria novo.
  4. Salva clusters com: representante (primeira imagem), membros (todas as imagens),
     ocorrencias (doc_ids em que aparece), estatística (largura, altura).

Uso:
  python3 agrupar_imagens.py HGLG11
  python3 agrupar_imagens.py HGLG11 --limiar 7   # mais permissivo (menos clusters)
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

from paths import DATA

FIIS_OPTIMIZED = DATA / "fiis-optimized"
LIMIAR_HAMMING = 5  # bits de diferença máxima — 0=exato, 16=permissivo


def _hamming(h1: str, h2: str) -> int:
    """Distância de Hamming entre dois phashes hex."""
    if len(h1) != len(h2):
        return 999
    x = int(h1, 16) ^ int(h2, 16)
    return bin(x).count("1")


def agrupar(ticker: str, limiar: int = LIMIAR_HAMMING) -> dict:
    ticker = ticker.upper()
    pasta = FIIS_OPTIMIZED / ticker
    if not pasta.exists():
        raise SystemExit(f"{pasta} não existe — rode otimizar.py antes.")

    # Coleta todas as imagens mantidas com referência ao doc
    todas: list[dict] = []
    for meta_p in sorted(pasta.glob("*.meta.json")):
        try:
            m = json.loads(meta_p.read_text(encoding="utf-8"))
        except Exception:
            continue
        for img in m.get("imagens_mantidas", []):
            todas.append({
                "arquivo": img["arquivo"],
                "pagina": img["pagina"],
                "largura": img["largura"],
                "altura": img["altura"],
                "hash_perceptual": img["hash_perceptual"],
                "doc_id": m["id"],
                "doc_tipo": m.get("tipo"),
                "doc_data": None,  # preenchido se houver em meta
            })

    print(f"[agrupar] {ticker}: {len(todas)} imagens candidatas encontradas")
    if not todas:
        return {"clusters": []}

    clusters: list[dict] = []
    for img in todas:
        h = img["hash_perceptual"]
        melhor_cluster = None
        melhor_dist = 999
        for cl in clusters:
            d = _hamming(h, cl["representante_hash"])
            if d < melhor_dist:
                melhor_dist = d
                melhor_cluster = cl
        if melhor_cluster and melhor_dist <= limiar:
            melhor_cluster["membros"].append(img)
            melhor_cluster["ocorrencias_docs"].add(img["doc_id"])
            melhor_cluster["paginas_exemplos"].add(img["pagina"])
        else:
            clusters.append({
                "id": f"cl_{len(clusters):04d}",
                "representante_hash": h,
                "representante_arquivo": img["arquivo"],
                "representante_doc_id": img["doc_id"],
                "representante_doc_tipo": img["doc_tipo"],
                "representante_largura": img["largura"],
                "representante_altura": img["altura"],
                "membros": [img],
                "ocorrencias_docs": {img["doc_id"]},
                "paginas_exemplos": {img["pagina"]},
            })

    # Normaliza para JSON-safe
    for cl in clusters:
        cl["ocorrencias_docs"] = sorted(cl["ocorrencias_docs"])
        cl["paginas_exemplos"] = sorted(cl["paginas_exemplos"])
        cl["num_ocorrencias"] = len(cl["membros"])
        cl["num_docs_afetados"] = len(cl["ocorrencias_docs"])

    # Ordena: clusters que aparecem em MAIS docs primeiro (mais impacto)
    clusters.sort(key=lambda c: -c["num_docs_afetados"])
    # Reatribui ids em ordem
    for i, cl in enumerate(clusters):
        cl["id"] = f"cl_{i:04d}"

    resumo = {
        "ticker": ticker,
        "limiar_hamming": limiar,
        "total_imagens_candidatas": len(todas),
        "total_clusters": len(clusters),
        "reducao_pct": round(100 * (1 - len(clusters) / max(1, len(todas))), 1),
        "clusters": clusters,
    }

    saida = pasta / "_clusters.json"
    saida.write_text(json.dumps(resumo, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[ok] {len(todas)} imagens → {len(clusters)} clusters (-{resumo['reducao_pct']}%)")
    print(f"[ok] escrito em {saida}")

    # Mostra top 10 clusters por impacto
    print("\nTop 10 clusters (mais docs afetados):")
    for cl in clusters[:10]:
        print(f"  {cl['id']}: {cl['num_ocorrencias']:4d} imgs em {cl['num_docs_afetados']:3d} docs  "
              f"{cl['representante_largura']}x{cl['representante_altura']}  "
              f"{cl['representante_arquivo']}")

    return resumo


def main() -> int:
    ap = argparse.ArgumentParser(description="Agrupa imagens por pHash similar")
    ap.add_argument("ticker")
    ap.add_argument("--limiar", type=int, default=LIMIAR_HAMMING,
                    help=f"Distância de Hamming máxima para agrupar (default {LIMIAR_HAMMING})")
    args = ap.parse_args()
    agrupar(args.ticker, limiar=args.limiar)
    return 0


if __name__ == "__main__":
    sys.exit(main())
