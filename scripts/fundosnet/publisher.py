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
  <meta property="og:image" content="{OG_IMAGE}">
  <meta property="og:url" content="https://ricoaospoucos.com.br/artigos/{SLUG}.html">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Rico aos Poucos">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@ricoaospoucos">
  <meta name="twitter:title" content="{TITLE}">
  <meta name="twitter:description" content="{DESCRIPTION}">
  <meta name="twitter:image" content="{OG_IMAGE}">

  <link rel="icon" type="image/png" sizes="192x192" href="../icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="../icon-512.png">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
  <link rel="shortcut icon" href="../icon-192.png">
  <link rel="manifest" href="../manifest.json">

  <title>{TITLE} - Rico aos Poucos</title>
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/article-fii.css">

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
    "mainEntityOfPage": {{ "@type": "WebPage", "@id": "https://ricoaospoucos.com.br/artigos/{SLUG}.html" }},
    "image": "{OG_IMAGE}"
  }}
  </script>
</head>
<body data-ticker="{TICKER}">
  <div class="page-wrapper" style="min-height:100vh;display:flex;flex-direction:column;">

    <header id="site-header"></header>

    <article class="article-container" style="flex:1;">
      <div class="article-header">
        {BADGES_HTML}
        <h1>{TITLE}</h1>
        <p class="subtitle">{SUBTITLE}</p>
        <div class="article-meta">
          <span>📅 {DATE_BR}</span>
          <span>⏱️ {READ_MIN} min de leitura</span>
          <span>🏷️ {CATEGORIA_LABEL}</span>
        </div>
      </div>

      {COVER_HTML}

      <div class="article-content">
{BODY_HTML}

        <div class="disclaimer">
          <h4>⚠️ Aviso importante</h4>
          <p style="margin:0;">Este material tem caráter exclusivamente informativo e <strong>não constitui recomendação de investimento</strong>. Os dados foram consolidados automaticamente a partir de publicações oficiais CVM/B3. Rentabilidade passada não garante rentabilidade futura. Consulte um assessor certificado antes de decidir.</p>
        </div>
      </div>
    </article>

    <footer id="site-footer"></footer>

  </div>

  <script defer src="../js/article-layout.js"></script>
</body>
</html>
"""


def _slug_valido(slug: str) -> bool:
    return bool(re.fullmatch(r"[a-z0-9][a-z0-9-]{2,80}", slug))


def _extrair_ticker(slug: str) -> str | None:
    """Extrai o ticker (ex: MFII11) do início do slug."""
    m = re.match(r"^([a-z]{2,5}\d{1,2})(?:-|$)", slug.lower())
    return m.group(1).upper() if m else None


def _encontrar_capa(ticker: str | None) -> str | None:
    """Retorna path relativo (ex: imagens/MFII11.jpg) se a capa existir."""
    if not ticker:
        return None
    imagens_dir = ROOT / "imagens"
    for ext in ("jpg", "jpeg", "png", "webp", "svg"):
        for name in (ticker, ticker.upper(), ticker.lower()):
            p = imagens_dir / f"{name}.{ext}"
            if p.exists():
                return f"imagens/{p.name}"
    return None


def _gerar_capa_svg(ticker: str, article: dict) -> str | None:
    """Gera um card social SVG 1200x630 para servir de og:image/capa do artigo.

    Usa dados do artigo (título, primeiro badge) e do ticker pra compor um card
    com gradient, ticker grande, linha de destaque e chamada curta. Retorna path
    relativo pra `imagens/{TICKER}.svg` se criar, None caso contrário.
    """
    if not ticker:
        return None
    imagens_dir = ROOT / "imagens"
    imagens_dir.mkdir(parents=True, exist_ok=True)
    dst = imagens_dir / f"{ticker}.svg"
    if dst.exists():
        return f"imagens/{dst.name}"

    # pega primeiro badge semântico pra escolher paleta
    badges = article.get("badges") or []
    primeira_label = ""
    paleta = "neutra"
    if badges:
        tipo = badges[0].get("tipo", "atualizado")
        primeira_label = badges[0].get("label", "").upper()
        paleta = tipo

    paletas = {
        "urgente":   ("#0d1117", "#2a0a0f", "#f85149", "Ponto de Atenção"),
        "estrategia":("#0d1117", "#0a2615", "#3fb950", "Estratégia"),
        "atualizado":("#0d1117", "#0d1f3a", "#58a6ff", "Dossiê Atualizado"),
        "novato":    ("#0d1117", "#2a2315", "#f0c14b", "Análise Inicial"),
        "neutra":    ("#0d1117", "#1a1f2a", "#58a6ff", "Rico aos Poucos"),
    }
    bg1, bg2, cor, fallback_label = paletas.get(paleta, paletas["neutra"])
    label_topo = primeira_label or fallback_label

    # título: pega do article; se muito longo, quebra em 2 linhas
    titulo = (article.get("title") or "").strip()
    linha1, linha2 = titulo, ""
    if len(titulo) > 42:
        # quebra no espaço mais próximo do meio
        meio = len(titulo) // 2
        esq = titulo.rfind(" ", 0, meio)
        dir_ = titulo.find(" ", meio)
        quebra = esq if abs(meio - esq) <= abs(meio - dir_) else dir_
        if quebra > 0:
            linha1 = titulo[:quebra].strip()
            linha2 = titulo[quebra:].strip()

    def esc(s: str) -> str:
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{bg1}"/>
      <stop offset="1" stop-color="{bg2}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{cor}" stop-opacity="0.8"/>
      <stop offset="1" stop-color="{cor}" stop-opacity="0.1"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>

  <!-- marca d'água: ticker gigante -->
  <text x="1160" y="580" text-anchor="end"
        font-family="Inter, Arial, sans-serif" font-weight="900" font-size="340"
        fill="{cor}" fill-opacity="0.07">{esc(ticker)}</text>

  <!-- top label -->
  <rect x="80" y="80" width="{max(140, len(label_topo) * 14 + 40)}" height="36" rx="18" ry="18"
        fill="{cor}" fill-opacity="0.18" stroke="{cor}" stroke-opacity="0.4"/>
  <text x="{80 + max(140, len(label_topo) * 14 + 40) / 2}" y="105"
        text-anchor="middle"
        font-family="Inter, Arial, sans-serif" font-weight="700" font-size="16"
        fill="{cor}">{esc(label_topo)}</text>

  <!-- ticker destaque -->
  <text x="80" y="240"
        font-family="Inter, Arial, sans-serif" font-weight="900" font-size="120"
        fill="#fdfdfd">{esc(ticker)}</text>

  <!-- título -->
  <text x="80" y="340"
        font-family="Inter, Arial, sans-serif" font-weight="700" font-size="44"
        fill="#e6edf3">{esc(linha1)}</text>'''
    if linha2:
        svg += f'''
  <text x="80" y="398"
        font-family="Inter, Arial, sans-serif" font-weight="700" font-size="44"
        fill="#e6edf3">{esc(linha2)}</text>'''
    svg += f'''

  <!-- divisor -->
  <line x1="80" y1="480" x2="280" y2="480" stroke="{cor}" stroke-width="3"/>

  <!-- rodapé marca -->
  <text x="80" y="540"
        font-family="Inter, Arial, sans-serif" font-weight="600" font-size="22"
        fill="#8b949e">Rico aos Poucos</text>
  <text x="80" y="568"
        font-family="Inter, Arial, sans-serif" font-weight="400" font-size="18"
        fill="#6e7681">ricoaospoucos.com.br · análise de FIIs com dados oficiais</text>
</svg>
'''
    dst.write_text(svg, encoding="utf-8")
    return f"imagens/{dst.name}"


def publicar(article: dict, *, bump_sw: bool = False) -> Path:
    """Valida, renderiza e grava o artigo. Atualiza artigos.json e sitemap."""
    slug = article["slug"].strip().lower()
    if not _slug_valido(slug):
        raise PublishError(f"slug inválido: {slug!r}")

    dst = ARTIGOS_DIR / f"{slug}.html"
    if dst.exists():
        raise PublishError(f"artigo já existe: {dst}")

    title = article["title"].strip()
    # Aceita body_html (preferido) OU body_md (fallback - converte pra HTML)
    body_html = article.get("body_html") or _md_para_html(article.get("body_md", ""))
    subtitle = (article.get("subtitle") or "").strip()
    if not subtitle:
        # Primeiro parágrafo do body como fallback
        m = re.search(r"<p[^>]*>(.+?)</p>", body_html, re.DOTALL)
        subtitle = _limpar_descricao(m.group(1))[:250] if m else ""

    description = article.get("description") or subtitle or title
    description = _limpar_descricao(description)[:200]

    categoria = article.get("categoria", "renda-variavel")
    tags = article.get("tags", [])

    # Badges semânticos (IA indica em article.badges OU derivamos de tags)
    badges_raw = article.get("badges") or [
        {"label": "Análise Inicial", "tipo": "atualizado"}
    ]
    badges_html = " ".join(
        f'<span class="nivel-badge {html.escape(b.get("tipo","atualizado"))}">{html.escape(b.get("label","Análise"))}</span>'
        for b in badges_raw[:3]
    )

    # Capa: usa imagens/{TICKER}.(jpg|png|webp|svg) apenas se existir manualmente.
    # Geração automática de SVG desabilitada — fallback pro icon padrão.
    ticker = _extrair_ticker(slug)
    cover_rel = _encontrar_capa(ticker) if ticker else None
    if cover_rel:
        og_image = f"https://ricoaospoucos.com.br/{cover_rel}"
        cover_html = (
            f'<div style="margin: 24px 0; border-radius: 12px; overflow: hidden;">'
            f'<img src="../{cover_rel}" alt="{html.escape(title)}" '
            f'style="width: 100%; height: auto; display: block;" loading="eager">'
            f'</div>'
        )
    else:
        og_image = "https://ricoaospoucos.com.br/icon-512.png"
        cover_html = ""

    hoje = date.today()
    tempo_leitura = max(3, _tempo_leitura(re.sub(r"<[^>]+>", "", body_html)))
    filled = TEMPLATE.format(
        TITLE=html.escape(title),
        SUBTITLE=html.escape(subtitle),
        DESCRIPTION=html.escape(description),
        KEYWORDS=html.escape(", ".join(tags) or title),
        SLUG=slug,
        TICKER=html.escape(ticker or ""),
        DATE_ISO=hoje.isoformat(),
        DATE_BR=_agora_br(),
        READ_MIN=tempo_leitura,
        CATEGORIA_LABEL=html.escape(categoria),
        BADGES_HTML=badges_html,
        COVER_HTML=cover_html,
        OG_IMAGE=og_image,
        BODY_HTML=body_html,
    )

    ARTIGOS_DIR.mkdir(parents=True, exist_ok=True)
    dst.write_text(filled, encoding="utf-8")

    _registrar_em_artigos_json(
        slug, title, description, categoria, tags, hoje,
        tempo_leitura, body_html,
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
