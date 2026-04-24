"""Sincroniza sitemap.xml com os FIIs existentes em fiis/{ticker}/index.html.

Mantém todas as seções estáticas (home, ferramentas, calculadoras, gestores, artigos)
e atualiza APENAS as entradas de /fiis/{ticker}/, adicionando os faltantes e
atualizando lastmod dos já presentes.
"""
from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

from paths import ROOT

SITEMAP = ROOT / "sitemap.xml"
FIIS_DIR = ROOT / "fiis"

TICKER_RX = re.compile(r"https://ricoaospoucos\.com\.br/fiis/([a-z0-9]+)/")


def listar_tickers_com_pagina() -> list[str]:
    tickers = []
    for d in sorted(FIIS_DIR.iterdir()):
        if not d.is_dir():
            continue
        if d.name in ("recomendados",):
            continue
        if (d / "index.html").exists():
            tickers.append(d.name)
    return tickers


def _bloco_fii(ticker: str, data_iso: str) -> str:
    return (
        f"  <url>\n"
        f"    <loc>https://ricoaospoucos.com.br/fiis/{ticker}/</loc>\n"
        f"    <lastmod>{data_iso}</lastmod>\n"
        f"    <changefreq>weekly</changefreq>\n"
        f"    <priority>0.8</priority>\n"
        f"  </url>\n"
    )


def atualizar() -> dict:
    tickers_page = set(listar_tickers_com_pagina())
    conteudo = SITEMAP.read_text(encoding="utf-8")

    # Extrai todos os blocos <url>...</url> e separa os de /fiis/ dos demais
    url_blocks = re.findall(r"(  <url>[\s\S]*?  </url>\n?)", conteudo)

    fii_blocks: dict[str, str] = {}
    outros_blocks: list[str] = []
    for b in url_blocks:
        m = TICKER_RX.search(b)
        if m:
            fii_blocks[m.group(1)] = b
        else:
            outros_blocks.append(b)

    hoje = date.today().isoformat()

    adicionados = []
    atualizados = []
    for t in tickers_page:
        if t not in fii_blocks:
            fii_blocks[t] = _bloco_fii(t, hoje)
            adicionados.append(t)
        else:
            # Atualiza lastmod
            novo = re.sub(
                r"<lastmod>[^<]*</lastmod>",
                f"<lastmod>{hoje}</lastmod>",
                fii_blocks[t],
                count=1,
            )
            if novo != fii_blocks[t]:
                fii_blocks[t] = novo
                atualizados.append(t)

    # Remove tickers que não têm mais página
    removidos = [t for t in list(fii_blocks.keys()) if t not in tickers_page]
    for t in removidos:
        del fii_blocks[t]

    # Monta novo sitemap: cabeçalho + comentários/não-FII + seção FIIs + fecho
    cabecalho = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n'
        '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n\n'
    )
    fecho = "</urlset>\n"

    outros_join = "".join(outros_blocks)
    fiis_join = "  <!-- Páginas de FIIs (atualizado automaticamente) -->\n"
    for t in sorted(fii_blocks):
        fiis_join += fii_blocks[t]

    novo = cabecalho + outros_join + "\n" + fiis_join + fecho
    SITEMAP.write_text(novo, encoding="utf-8")

    return {
        "tickers_no_site": len(tickers_page),
        "adicionados": adicionados,
        "atualizados_lastmod": len(atualizados),
        "removidos": removidos,
    }


if __name__ == "__main__":
    r = atualizar()
    print(f"[sitemap] total de FIIs: {r['tickers_no_site']}")
    if r["adicionados"]:
        print(f"  adicionados ({len(r['adicionados'])}): {', '.join(r['adicionados'])}")
    if r["atualizados_lastmod"]:
        print(f"  lastmod atualizado: {r['atualizados_lastmod']}")
    if r["removidos"]:
        print(f"  removidos: {', '.join(r['removidos'])}")
    sys.exit(0)
