"""Aplica refinamento manual de imagens em documentos otimizados.

Fluxo:
  1. Otimizador marca imagens como `candidata_refinamento` no .meta.json.
  2. EU (Opus 4.7 no chat) leio cada imagem candidata e produzo uma entrada em
     data/fiis-optimized/{TICKER}/_refinamento.json com os dados extraídos.
  3. Este script aplica as entradas no .md correspondente: insere os dados em
     Markdown logo depois da referência à imagem no documento.

Formato de _refinamento.json (lista de entradas):
{
  "ticker": "MXRF11",
  "extracoes": [
    {
      "arquivo_imagem": "imagens/811468/p010_x429.png",
      "tipo": "treemap",
      "titulo": "Portfólio de CRIs por Setor",
      "dados_markdown": "| Setor | % |\n|---|---|\n| Imobiliário Residencial | 30,35% |\n...",
      "aplicado_em_docs": []     // preenchido pelo script
    }
  ]
}

Uso:
  python3 aplicar_refinamento.py MXRF11
  python3 aplicar_refinamento.py MXRF11 --dry-run
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from paths import DATA

FIIS_OPTIMIZED = DATA / "fiis-optimized"


def aplicar(ticker: str, dry_run: bool = False) -> int:
    ticker = ticker.upper()
    pasta = FIIS_OPTIMIZED / ticker
    if not pasta.exists():
        print(f"[erro] {pasta} não existe.")
        return 1

    ref_path = pasta / "_refinamento.json"
    if not ref_path.exists():
        print(f"[info] {ref_path} não existe. Nada a aplicar.")
        return 0

    refinamento = json.loads(ref_path.read_text(encoding="utf-8"))
    extracoes = refinamento.get("extracoes", [])

    # Mapa por nome de arquivo → entrada
    # (o mesmo arquivo de imagem pode aparecer em múltiplos docs;
    #  nesse caso, aplicamos a mesma extração em todos os docs que referenciam)
    por_img: dict[str, dict] = {}
    for ext in extracoes:
        img = ext.get("arquivo_imagem")
        if not img:
            continue
        por_img[img] = ext
        ext.setdefault("aplicado_em_docs", [])

    if not por_img:
        print("[info] _refinamento.json sem extrações.")
        return 0

    docs_tocados = 0
    for md_path in sorted(pasta.glob("*.md")):
        meta_path = md_path.with_suffix(".meta.json")
        if not meta_path.exists():
            continue
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            continue

        # Quais imagens deste doc têm refinamento disponível?
        aplicaveis = [
            img for img in meta.get("imagens_mantidas", [])
            if img.get("arquivo") in por_img
        ]
        if not aplicaveis:
            continue

        md_conteudo = md_path.read_text(encoding="utf-8")
        md_novo = md_conteudo
        mudou = False

        for img in aplicaveis:
            arquivo_img = img["arquivo"]
            ext = por_img[arquivo_img]
            # Nome só do arquivo na referência do .md
            nome_arquivo = Path(arquivo_img).name
            # Padrão no .md: ![IMAGEM: ...](imagens/{did}/{nome}) ou ![TIPO: ...](imagens/{nome})
            # Procura a linha que referencia a imagem e insere os dados logo após
            pattern = re.compile(
                r"(!\[[^\]]*\]\(imagens/[^)]*" + re.escape(nome_arquivo) + r"\))",
                re.IGNORECASE,
            )
            if not pattern.search(md_novo):
                # Já foi aplicado ou o marker não está — pula
                continue
            bloco = _formatar_bloco(ext)
            # Evita duplicar se já foi aplicado
            if bloco.strip() in md_novo:
                continue
            md_novo = pattern.sub(r"\1\n\n" + bloco + "\n", md_novo, count=1)
            mudou = True
            if meta["id"] not in ext["aplicado_em_docs"]:
                ext["aplicado_em_docs"].append(meta["id"])

        if mudou:
            docs_tocados += 1
            if dry_run:
                print(f"  [dry-run] aplicaria em {md_path.name}")
            else:
                md_path.write_text(md_novo, encoding="utf-8")
                print(f"  [ok] aplicado em {md_path.name}")

    # Atualiza controle
    if not dry_run:
        ref_path.write_text(json.dumps(refinamento, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n[aplicar_refinamento] {ticker}: {docs_tocados} docs atualizados com {len(extracoes)} extrações")
    return 0


def _formatar_bloco(ext: dict) -> str:
    """Produz o bloco Markdown a ser injetado depois do marker de imagem."""
    tipo = ext.get("tipo", "gráfico")
    titulo = ext.get("titulo", "")
    dados = ext.get("dados_markdown", "").strip()
    if not dados:
        return ""
    header = f"**[dados extraídos da imagem — {tipo}"
    if titulo:
        header += f": {titulo}"
    header += "]**"
    return header + "\n\n" + dados


def main() -> int:
    ap = argparse.ArgumentParser(description="Aplica _refinamento.json no .md do ticker")
    ap.add_argument("ticker")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    return aplicar(args.ticker, dry_run=args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
