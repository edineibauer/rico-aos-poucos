#!/usr/bin/env python3
"""
Spike 1 — Consulta ao Fundos.NET (CVM/B3) por publicações recentes de FIIs.

Valida que o endpoint público retorna JSON consumível pra detectar novidades.

Uso:
    python3 01_buscar_publicacoes.py [dias]   # default 3
    python3 01_buscar_publicacoes.py 1        # só hoje

Parâmetros-chave descobertos:
    - d (draw), s (start), l (length)   — ATENÇÃO: nomes curtos, não `draw`
    - tipoFundo=1  → FIIs
    - dataInicial/dataFinal em dd/mm/yyyy

Descobertas:
    - Retorna ~100+ publicações/dia para FIIs.
    - Pesquisa leva ~60s para janelas de 3 dias (lenta; ok pra cron horário).
    - Campos úteis: id, descricaoFundo, nomePregao, categoriaDocumento,
      tipoDocumento, dataReferencia, dataEntrega, versao.
    - Download: GET /publico/exibirDocumento?id=<id> retorna string JSON
      contendo Base64 do PDF.
"""
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

import requests

ENDPOINT = "https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados"
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


MAX_PAGE = 200   # limite fixo do backend
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; RicoAosPoucos/0.1)",
    "X-Requested-With": "XMLHttpRequest",
}


def _pagina(start: int, length: int, data_inicial: str, data_final: str, tipo_fundo: int):
    params = {
        "d": 1,
        "s": start,
        "l": length,
        "tipoFundo": tipo_fundo,
        "dataInicial": data_inicial,
        "dataFinal": data_final,
    }
    resp = requests.get(ENDPOINT, params=params, headers=HEADERS, timeout=120)
    if resp.status_code == 400:
        raise RuntimeError(f"400 backend: {resp.text[:200]}")
    resp.raise_for_status()
    return resp.json()


def buscar(dias: int = 3, tipo_fundo: int = 1):
    hoje = datetime.now().date()
    inicial = hoje - timedelta(days=dias)
    di = inicial.strftime("%d/%m/%Y")
    df = hoje.strftime("%d/%m/%Y")

    first = _pagina(0, MAX_PAGE, di, df, tipo_fundo)
    total = first.get("recordsTotal") or 0
    items = list(first.get("data") or [])
    while len(items) < total:
        pag = _pagina(len(items), MAX_PAGE, di, df, tipo_fundo)
        batch = pag.get("data") or []
        if not batch:
            break
        items.extend(batch)
    return {"recordsTotal": total, "data": items}


def main():
    dias = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    print(f"[spike] buscando publicações de FIIs nos últimos {dias} dia(s)…")

    data = buscar(dias=dias)
    total = data.get("recordsTotal") or 0
    items = data.get("data") or []
    print(f"[spike] recordsTotal={total} | retornados={len(items)}")

    raw_path = OUTPUT_DIR / f"publicacoes_{dias}d.json"
    raw_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"[spike] raw salvo em {raw_path}")

    from collections import Counter
    por_cat = Counter(i.get("categoriaDocumento", "?") for i in items)
    por_tipo = Counter(i.get("tipoDocumento", "?") for i in items)

    print("\n[spike] categorias:")
    for k, n in por_cat.most_common():
        print(f"  {n:>4}  {k}")
    print("\n[spike] tipos (top 15):")
    for k, n in por_tipo.most_common(15):
        print(f"  {n:>4}  {k}")

    print("\n[spike] 5 exemplos:")
    for it in items[:5]:
        print(
            f"  id={it['id']} | {it.get('dataEntrega','?'):16s} | "
            f"{(it.get('nomePregao') or '?'):20s} | {it.get('tipoDocumento','?')}"
        )


if __name__ == "__main__":
    main()
