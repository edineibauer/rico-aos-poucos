/**
 * FII Layout — Rico aos Poucos
 *
 * Injeta carrossel de artigos relacionados em páginas de FII (fiis/{TICKER}/).
 * O cabeçalho/rodapé padrão fica em js/site-header.js (carregado em paralelo).
 * Pareado com js/fii-template.js (que renderiza o conteúdo do fundo).
 *
 * Requisitos no HTML:
 *   <header id="site-header"></header>      ← preenchido por site-header.js
 *   <div id="fii-root"></div>               ← onde fii-template.js renderiza
 *   <footer id="site-footer"></footer>      ← preenchido por site-header.js
 *   <body data-ticker="ABCP11">             ← usado pelo carrossel
 *   <script defer src="../../js/site-header.js"></script>
 *   <script defer src="../../js/fii-layout.js"></script>
 */
const FIILayout = {

  // Carrossel de artigos relacionados ao ticker
  async renderRelatedArticles(ticker) {
    if (!ticker) return null;
    let data;
    try {
      const r = await fetch('../../data/artigos.json');
      if (!r.ok) return null;
      data = await r.json();
    } catch (_) { return null; }

    const tl = ticker.toLowerCase();
    const relacionados = (data.artigos || []).filter(a => {
      const slug = (a.id || a.slug || '').toLowerCase();
      const tags = (a.tags || []).map(t => t.toLowerCase());
      return slug.startsWith(tl + '-') || tags.includes(tl);
    }).slice(0, 8);

    if (relacionados.length === 0) return null;
    return `
      <section class="article-related" style="margin-top: 40px;">
        <h3>Artigos sobre ${ticker}</h3>
        <div class="article-related-scroll">
          ${relacionados.map(a => {
            const arquivo = a.arquivo || (a.url || '').replace(/^artigos\//, '');
            const data = a.dataPublicacao ? new Date(a.dataPublicacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
            return `
              <a href="../../artigos/${arquivo}" class="article-related-card">
                <span class="article-related-meta">${data}</span>
                <strong class="article-related-title">${a.titulo || ''}</strong>
                <span class="article-related-sub">${(a.subtitulo || a.descricao || '').slice(0, 140)}</span>
              </a>
            `;
          }).join('')}
        </div>
      </section>
    `;
  },

  async init() {
    // Carrossel de artigos relacionados (depois do conteúdo do FII)
    // Header e footer são responsabilidade do js/site-header.js.
    const ticker = document.body.dataset.ticker
      || (location.pathname.match(/\/fiis\/([^/]+)\//) || [])[1]?.toUpperCase();
    if (!ticker) return;
    const relatedHtml = await this.renderRelatedArticles(ticker);
    if (!relatedHtml) return;
    const root = document.getElementById('fii-root');
    if (root) root.insertAdjacentHTML('afterend', relatedHtml);
  },
};

// Garante que site-header.js esteja carregado (compatibilidade com páginas
// antigas que só importam fii-layout.js).
function ensureSiteHeader() {
  if (window.SiteHeader) return Promise.resolve();
  const existing = [...document.scripts].find(s => /(\/|^)js\/site-header\.js(\?|$)/.test(s.src));
  if (existing) {
    return new Promise((resolve) => {
      if (existing.complete || existing.dataset.loaded === '1') resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
    });
  }
  // currentScript do fii-layout.js indica de onde veio — site-header.js está no mesmo /js/
  const myScript = document.currentScript
    || [...document.scripts].find(s => /(\/|^)js\/fii-layout\.js(\?|$)/.test(s.src));
  if (!myScript) return Promise.resolve();
  const headerSrc = myScript.src.replace(/fii-layout\.js([^/]*)$/, 'site-header.js$1');
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
  document.addEventListener('DOMContentLoaded', () => ensureSiteHeader().then(() => FIILayout.init()));
} else {
  ensureSiteHeader().then(() => FIILayout.init());
}

window.FIILayout = FIILayout;
