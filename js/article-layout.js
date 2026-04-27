/**
 * Article Layout — Rico aos Poucos
 *
 * Injeta CTA do FII + carrossel "Continue lendo" em artigos.
 * O cabeçalho/rodapé padrão fica em js/site-header.js (carregado em paralelo).
 *
 * Requisitos no HTML do artigo:
 *   <header id="site-header"></header>      ← preenchido por site-header.js
 *   <article class="article-container">…</article>
 *   <footer id="site-footer"></footer>      ← preenchido por site-header.js
 *   <script defer src="../js/site-header.js"></script>
 *   <script defer src="../js/article-layout.js"></script>
 *   (opcional) <body data-ticker="ABCP11"> — força CTA p/ FII específico
 */
const ArticleLayout = {

  // ──────────────────────────────────────────────────
  // CTA FII — se artigo é sobre um ticker e a página do FII existe
  // ──────────────────────────────────────────────────
  detectTicker() {
    // 1) data-ticker explícito no body
    const explicit = document.body.dataset.ticker;
    if (explicit) return explicit.toUpperCase();
    // 2) extrai do primeiro segmento do filename
    const name = (location.pathname.split('/').pop() || '').toLowerCase();
    const m = name.match(/^([a-z]{2,5}\d{1,2})[-.]/);
    return m ? m[1].toUpperCase() : null;
  },

  async renderFiiCTA(ticker) {
    if (!ticker) return null;
    const href = `../fiis/${ticker.toLowerCase()}/`;
    // Tenta detectar se a página existe (HEAD request)
    try {
      const r = await fetch(href, { method: 'HEAD' });
      if (!r.ok) return null;
    } catch (_) {
      return null;
    }
    return `
      <section class="article-cta-fii">
        <div class="article-cta-fii-inner">
          <div class="article-cta-fii-text">
            <h3>Quer a análise completa do <strong>${ticker}</strong>?</h3>
            <p>Indicadores atualizados, histórico, carteira, valuation e o veredicto consolidado — tudo em uma página só.</p>
          </div>
          <a href="${href}" class="article-cta-fii-btn">
            Ver análise do ${ticker}
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </section>
    `;
  },

  // ──────────────────────────────────────────────────
  // CARROSSEL DE ARTIGOS RELACIONADOS
  // ──────────────────────────────────────────────────
  async renderRelatedCarousel(currentSlug, ticker) {
    let data;
    try {
      const r = await fetch('../data/artigos.json');
      if (!r.ok) return null;
      data = await r.json();
    } catch (_) {
      return null;
    }
    const todos = (data.artigos || []).filter(a =>
      (a.id || a.slug) !== currentSlug
      && (a.arquivo || a.url)
    );

    // Scoring de relevância: mesmo ticker > mesma categoria > mesmo tema > mais recentes
    const scored = todos.map(a => {
      let score = 0;
      const slug = (a.id || a.slug || '').toLowerCase();
      const tags = (a.tags || []).map(t => t.toLowerCase());
      if (ticker) {
        const tl = ticker.toLowerCase();
        if (slug.startsWith(tl + '-') || tags.some(t => t === tl)) score += 100;
      }
      if (a.tema === 'fiis') score += 20;
      if (a.categoria === 'renda-variavel') score += 5;
      // bonus por recência (dias desde hoje)
      const d = new Date(a.dataPublicacao || 0).getTime();
      score += Math.max(0, 30 - (Date.now() - d) / 86400000);
      return { ...a, _score: score };
    }).sort((a, b) => b._score - a._score);

    const selecionados = scored.slice(0, 10);
    if (selecionados.length === 0) return null;

    const relPath = 'artigos/';
    return `
      <section class="article-related">
        <h3>Continue lendo</h3>
        <div class="article-related-scroll">
          ${selecionados.map(a => {
            const arquivo = a.arquivo || (a.url || '').replace(/^artigos\//, '');
            const data = a.dataPublicacao ? new Date(a.dataPublicacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
            const tempo = a.tempoLeitura ? `${a.tempoLeitura} min` : '';
            return `
              <a href="${arquivo}" class="article-related-card">
                <span class="article-related-meta">${data}${tempo ? ' · ' + tempo : ''}</span>
                <strong class="article-related-title">${a.titulo || ''}</strong>
                <span class="article-related-sub">${(a.subtitulo || a.descricao || '').slice(0, 140)}</span>
              </a>
            `;
          }).join('')}
        </div>
      </section>
    `;
  },

  // ──────────────────────────────────────────────────
  // INIT — só CTA + carrossel (header/footer são do site-header.js)
  // ──────────────────────────────────────────────────
  async init() {
    const article = document.querySelector('article.article-container');
    if (!article) return;

    const ticker = this.detectTicker();
    const currentSlug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');

    const ctaHtml = await this.renderFiiCTA(ticker);
    if (ctaHtml) article.insertAdjacentHTML('afterend', ctaHtml);

    const relatedHtml = await this.renderRelatedCarousel(currentSlug, ticker);
    if (relatedHtml) {
      const anchor = document.querySelector('.article-cta-fii') || article;
      anchor.insertAdjacentHTML('afterend', relatedHtml);
    }
  },
};

// Garante que site-header.js esteja carregado (compatibilidade com artigos
// antigos que só importam article-layout.js).
function ensureSiteHeader() {
  if (window.SiteHeader) return Promise.resolve();
  const existing = [...document.scripts].find(s => /(\/|^)js\/site-header\.js(\?|$)/.test(s.src));
  if (existing) {
    return new Promise((resolve) => {
      if (existing.complete || existing.dataset.loaded === '1') resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
    });
  }
  const myScript = document.currentScript
    || [...document.scripts].find(s => /(\/|^)js\/article-layout\.js(\?|$)/.test(s.src));
  if (!myScript) return Promise.resolve();
  const headerSrc = myScript.src.replace(/article-layout\.js([^/]*)$/, 'site-header.js$1');
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = headerSrc;
    s.defer = true;
    s.addEventListener('load', () => resolve(), { once: true });
    s.addEventListener('error', () => resolve(), { once: true });
    document.head.appendChild(s);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ensureSiteHeader().then(() => ArticleLayout.init()));
} else {
  ensureSiteHeader().then(() => ArticleLayout.init());
}

window.ArticleLayout = ArticleLayout;
