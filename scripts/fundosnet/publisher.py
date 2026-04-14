"""Publicador de artigos gerados pela IA.

Recebe um `article` (dict validado pelo schema) e:
1. Renderiza HTML com layout consistente com o resto do site.
2. Grava em artigos/<slug>.html.
3. Registra em data/artigos.json.
4. Atualiza sitemap.xml.
"""
from __future__ import annotations

import html
import json
import re
from datetime import date, datetime
from pathlib import Path

from paths import ARTIGOS_DIR, ARTIGOS_META, ROOT, SITEMAP

MESES_PT = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]


class PublishError(Exception):
    pass


def _agora_br() -> str:
    d = date.today()
    return f"{d.day} de {MESES_PT[d.month - 1].capitalize()} de {d.year}"


def _md_para_html(md: str) -> str:
    """Conversão básica de markdown → HTML. Sem dependência externa."""
    linhas = md.splitlines()
    saida: list[str] = []
    lista_aberta = False

    for raw in linhas:
        linha = raw.rstrip()
        if not linha.strip():
            if lista_aberta:
                saida.append("</ul>")
                lista_aberta = False
            continue

        # ### h3
        m = re.match(r"^###\s+(.*)$", linha)
        if m:
            if lista_aberta: saida.append("</ul>"); lista_aberta = False
            saida.append(f"<h3>{_inline(m.group(1))}</h3>")
            continue
        # ## h2
        m = re.match(r"^##\s+(.*)$", linha)
        if m:
            if lista_aberta: saida.append("</ul>"); lista_aberta = False
            saida.append(f"<h2>{_inline(m.group(1))}</h2>")
            continue
        # > blockquote simples vira callout
        m = re.match(r"^>\s+(.*)$", linha)
        if m:
            if lista_aberta: saida.append("</ul>"); lista_aberta = False
            saida.append(f'<div class="callout"><p>{_inline(m.group(1))}</p></div>')
            continue
        # - item de lista
        m = re.match(r"^[-*]\s+(.*)$", linha)
        if m:
            if not lista_aberta:
                saida.append("<ul>"); lista_aberta = True
            saida.append(f"<li>{_inline(m.group(1))}</li>")
            continue
        # parágrafo
        if lista_aberta:
            saida.append("</ul>")
            lista_aberta = False
        saida.append(f"<p>{_inline(linha)}</p>")

    if lista_aberta:
        saida.append("</ul>")
    return "\n".join(saida)


def _inline(texto: str) -> str:
    """Marcações inline: **bold**, *italic*, `code`, [link](url). Preserva HTML
    pré-existente (a IA já devolve trechos com classes Tailwind).
    """
    # negrito
    texto = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", texto)
    # itálico (simples)
    texto = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", texto)
    # code
    texto = re.sub(r"`([^`]+)`", r"<code>\1</code>", texto)
    # links
    texto = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', texto)
    return texto


def _tempo_leitura(md: str) -> int:
    palavras = len(re.findall(r"\w+", md))
    return max(2, palavras // 230)


TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{DESCRIPTION}">
  <meta name="keywords" content="{KEYWORDS}">
  <meta name="author" content="Rico aos Poucos">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://ricoaospoucos.com.br/artigos/{SLUG}.html">
  <meta name="theme-color" content="#0d1117">

  <meta property="og:title" content="{TITLE}">
  <meta property="og:description" content="{DESCRIPTION}">
  <meta property="og:image" content="https://ricoaospoucos.com.br/icon-512.png">
  <meta property="og:url" content="https://ricoaospoucos.com.br/artigos/{SLUG}.html">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Rico aos Poucos">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@ricoaospoucos">
  <meta name="twitter:title" content="{TITLE}">
  <meta name="twitter:description" content="{DESCRIPTION}">
  <meta name="twitter:image" content="https://ricoaospoucos.com.br/icon-512.png">

  <link rel="icon" type="image/png" sizes="192x192" href="../icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="../icon-512.png">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
  <link rel="shortcut icon" href="../icon-192.png">
  <link rel="manifest" href="../manifest.json">

  <title>{TITLE} - Rico aos Poucos</title>
  <link rel="stylesheet" href="../css/style.css">

  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{TITLE}",
    "description": "{DESCRIPTION}",
    "datePublished": "{DATE_ISO}",
    "dateModified": "{DATE_ISO}",
    "author": {{ "@type": "Organization", "name": "Rico aos Poucos", "url": "https://ricoaospoucos.com.br" }},
    "publisher": {{
      "@type": "Organization",
      "name": "Rico aos Poucos",
      "logo": {{ "@type": "ImageObject", "url": "https://ricoaospoucos.com.br/icon-512.png" }}
    }},
    "mainEntityOfPage": {{ "@type": "WebPage", "@id": "https://ricoaospoucos.com.br/artigos/{SLUG}.html" }}
  }}
  </script>

  <style>
    .article-container {{ max-width: 800px; margin: 0 auto; padding: 40px 20px; }}
    .article-header {{ margin-bottom: 32px; }}
    .article-header h1 {{ font-size: 2rem; margin: 16px 0; line-height: 1.3; }}
    .article-meta {{ display: flex; gap: 16px; color: var(--text-muted); font-size: 0.9rem; flex-wrap: wrap; }}
    .article-content {{ line-height: 1.8; color: var(--text-secondary); }}
    .article-content h2 {{ color: var(--text-primary); margin: 32px 0 16px; font-size: 1.4rem; }}
    .article-content h3 {{ color: var(--text-primary); margin: 24px 0 12px; font-size: 1.1rem; }}
    .article-content p {{ margin-bottom: 16px; }}
    .article-content ul, .article-content ol {{ margin: 16px 0 16px 24px; }}
    .article-content li {{ margin-bottom: 8px; }}
    .callout {{ border-left: 3px solid var(--accent); padding: 16px; margin: 24px 0; background: rgba(255,255,255,0.03); border-radius: 8px; }}
    @media (max-width: 768px) {{ .article-header h1 {{ font-size: 1.5rem; }} }}
  </style>
</head>
<body>
  <div class="page-wrapper">
    <header style="position:sticky;top:0;z-index:10;background:var(--bg-primary);border-bottom:1px solid var(--border-color);padding:12px 20px;display:flex;align-items:center;gap:12px;">
      <a href="./" style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:rgba(255,255,255,0.05);border-radius:10px;color:var(--text-primary);text-decoration:none;">
        <svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;stroke-width:2;fill:none;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </a>
      <div style="flex:1;min-width:0;">
        <h1 style="font-size:1rem;font-weight:600;color:var(--text-primary);margin:0;">Rico aos Poucos</h1>
        <span style="font-size:0.7rem;color:var(--text-muted);">Artigo</span>
      </div>
    </header>

    <article class="article-container">
      <div class="article-header">
        {BADGES_HTML}
        <h1>{TITLE}</h1>
        <div class="article-meta">
          <span>📅 {DATE_BR}</span>
          <span>⏱️ {READ_MIN} min de leitura</span>
          <span>🏷️ {CATEGORIA_LABEL}</span>
        </div>
      </div>

      <div class="article-content">
{BODY_HTML}
      </div>
    </article>
  </div>

  <script defer src="../js/article-header.js"></script>
</body>
</html>
"""


def _slug_valido(slug: str) -> bool:
    return bool(re.fullmatch(r"[a-z0-9][a-z0-9-]{2,80}", slug))


def publicar(article: dict, *, bump_sw: bool = False) -> Path:
    """Valida, renderiza e grava o artigo. Atualiza artigos.json e sitemap."""
    slug = article["slug"].strip().lower()
    if not _slug_valido(slug):
        raise PublishError(f"slug inválido: {slug!r}")

    dst = ARTIGOS_DIR / f"{slug}.html"
    if dst.exists():
        raise PublishError(f"artigo já existe: {dst}")

    title = article["title"].strip()
    body_md = article["body_md"]
    description = (article.get("description") or body_md.split("\n")[0][:160]).strip()
    categoria = article.get("categoria", "renda-variavel")
    tags = article.get("tags", [])

    badges_html = ""
    if tags:
        badges_html = " ".join(
            f'<span class="nivel-badge">{html.escape(t)}</span>' for t in tags[:3]
        )

    hoje = date.today()
    filled = TEMPLATE.format(
        TITLE=html.escape(title),
        DESCRIPTION=html.escape(description),
        KEYWORDS=html.escape(", ".join(tags) or title),
        SLUG=slug,
        DATE_ISO=hoje.isoformat(),
        DATE_BR=_agora_br(),
        READ_MIN=_tempo_leitura(body_md),
        CATEGORIA_LABEL=html.escape(categoria),
        BADGES_HTML=badges_html,
        BODY_HTML=_md_para_html(body_md),
    )

    ARTIGOS_DIR.mkdir(parents=True, exist_ok=True)
    dst.write_text(filled, encoding="utf-8")

    _registrar_em_artigos_json(
        slug, title, description, categoria, tags, hoje,
        _tempo_leitura(body_md), body_md,
        destaque=bool(article.get("destaque")),
    )
    _atualizar_sitemap(slug)

    if bump_sw:
        _bump_sw_version()

    return dst


def _limpar_descricao(s: str) -> str:
    """Remove markdown/HTML residual pra descrição virar texto puro."""
    # primeiro desescapa entities (senão <strong> vira texto e escapa do strip de tags)
    s = (s.replace("&quot;", '"').replace("&amp;", "&")
          .replace("&lt;", "<").replace("&gt;", ">").replace("&#39;", "'"))
    s = re.sub(r"<[^>]*>", "", s)                         # tags HTML completas
    s = re.sub(r"<[^>]*$", "", s)                         # tag aberta cortada no fim
    s = re.sub(r"\*\*([^*]+)\*\*", r"\1", s)              # **bold**
    s = re.sub(r"\*([^*]+)\*", r"\1", s)                  # *italic*
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _registrar_em_artigos_json(
    slug: str, title: str, description: str, categoria: str,
    tags: list[str], data: date, tempo_leitura: int, body_md: str, *, destaque: bool,
) -> None:
    """Registra no data/artigos.json com schema compatível com o template da listagem.

    Template (artigos/index.html) espera: id, titulo, subtitulo, descricao,
    arquivo (só filename), nivel, categoria, tema, tags, dataPublicacao,
    tempoLeitura, destaque, setorRelacionado.
    """
    if not ARTIGOS_META.exists():
        return
    meta = json.loads(ARTIGOS_META.read_text(encoding="utf-8"))
    artigos = meta.get("artigos")
    if artigos is None:
        meta["artigos"] = artigos = []

    desc_limpa = _limpar_descricao(description)
    # subtítulo = primeiro parágrafo do body_md (cortado em ~220 chars)
    primeiro_paragrafo = next((p for p in body_md.splitlines() if p.strip() and not p.startswith("#")), desc_limpa)
    subtitulo = _limpar_descricao(primeiro_paragrafo)[:220]

    novo = {
        "id": slug,
        "titulo": title,
        "subtitulo": subtitulo,
        "descricao": desc_limpa[:300],
        "arquivo": f"{slug}.html",
        "nivel": "intermediario",
        "categoria": "renda-variavel",
        "tema": "fiis",
        "tags": tags,
        "dataPublicacao": data.isoformat(),
        "tempoLeitura": tempo_leitura,
        "destaque": destaque,
        "setorRelacionado": "fiis",
        "origem": "fundosnet-automatico",
    }
    # Remove duplicatas pelo id/slug (reentrancia)
    artigos = [a for a in artigos if a.get("id") != slug and a.get("slug") != slug]
    artigos.insert(0, novo)
    meta["artigos"] = artigos
    meta["ultimaAtualizacao"] = data.isoformat()
    ARTIGOS_META.write_text(json.dumps(meta, indent=2, ensure_ascii=False))


def _atualizar_sitemap(slug: str) -> None:
    if not SITEMAP.exists():
        return
    conteudo = SITEMAP.read_text(encoding="utf-8")
    nova_url = f"  <url>\n    <loc>https://ricoaospoucos.com.br/artigos/{slug}.html</loc>\n    <lastmod>{date.today().isoformat()}</lastmod>\n    <priority>0.7</priority>\n  </url>\n"
    if f"/artigos/{slug}.html" in conteudo:
        return
    conteudo = conteudo.replace("</urlset>", nova_url + "</urlset>")
    SITEMAP.write_text(conteudo, encoding="utf-8")


def _bump_sw_version() -> None:
    sw_path = ROOT / "sw.js"
    if not sw_path.exists():
        return
    texto = sw_path.read_text(encoding="utf-8")
    m = re.search(r"APP_VERSION\s*=\s*['\"](\d+\.\d+)['\"]", texto)
    if not m:
        return
    atual = m.group(1)
    maj, menor = atual.split(".")
    nova = f"{maj}.{int(menor) + 1}"
    texto = texto.replace(f"APP_VERSION = '{atual}'", f"APP_VERSION = '{nova}'")
    texto = texto.replace(f'APP_VERSION = "{atual}"', f'APP_VERSION = "{nova}"')
    sw_path.write_text(texto, encoding="utf-8")
