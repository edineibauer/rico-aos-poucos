/**
 * FII Layout — Rico aos Poucos
 *
 * Injeta header/footer/menu em páginas de FII (fiis/{TICKER}/index.html).
 * Pareado com js/fii-template.js (que renderiza o conteúdo do fundo).
 *
 * Requisitos no HTML:
 *   <header id="site-header"></header>      — preenchido automaticamente
 *   <div id="fii-root"></div>                — onde fii-template.js renderiza
 *   <footer id="site-footer"></footer>       — preenchido automaticamente
 *   <body data-ticker="ABCP11">              — usado pelo CTA (já é a pagina dele)
 *
 * Detecta também headers legados inline (.app-header) e os substitui.
 */
const FIILayout = {

  logoSVG: `
    <svg viewBox="0 0 1024 1024" width="36" height="36" aria-hidden="true">
      <defs><clipPath id="fl-rc"><rect width="1024" height="1024" rx="205"/></clipPath></defs>
      <g clip-path="url(#fl-rc)">
        <rect width="1024" height="1024" fill="#fdfdfd"/>
        <path d="M329.73 475.84C318.03 487.75 291.26 514.98 270.23 536.35L232 575.21V218.91l129.25.35c127.97.35 129.38.37 142.25 2.56 44.75 7.62 77.89 21.45 104.52 43.63 19.83 16.51 36.07 40.45 41.44 61.07l1.53 5.87-9.75 10.06c-5.36 5.53-29.55 30.3-53.75 55.05-24.21 24.75-48.25 49.39-53.42 54.75-5.18 5.36-9.91 9.75-10.51 9.75s-5.76-4.68-11.47-10.41l-10.38-10.41 5.36-2.71c16.69-8.46 27.74-21.74 32.49-39.04 2.49-9.07 3.04-29.21 1.06-38.93-4.86-23.89-21.8-40.39-47.62-46.39-16.32-3.79-26.87-4.26-85.51-3.77-30.79.25-56.1.5-56.24.56-.14.05-.25 32.32-.25 71.69v71.6zm438.27 271.66c0 .28-32.06.48-71.25.45l-71.25-.05-22.31-31.2c-12.27-17.16-31.31-43.7-42.31-58.99l-20-27.78 2.6-3.09c4.52-5.37 76.91-78.84 77.68-78.84 1.08 0 39.66 51.87 88.5 119 11 15.12 28.63 39.31 39.17 53.75s19.17 26.79 19.17 27.06zM356 687.92V748h-59c-32.45 0-59-.34-58.99-.75.01-.9 115.72-118.6 117.06-119.08.57-.21.93 23.06.93 59.75z" fill="rgb(32,58,87)"/>
        <path d="M298.21 658.25C261.73 694.96 231.8 725 231.69 725s-.19-27.65-.19-61.45v-61.44l16-16.26c8.8-8.96 50.21-51.0 92.03-93.35 41.82-42.36 79.13-80.27 82.92-84.26 3.78-3.99 7.25-7.25 7.72-7.25s10.62 9.34 22.59 20.75c11.96 11.41 32.71 31.06 46.11 43.66 23.13 21.77 24.46 22.85 26.49 21.5 2.26-1.49 29.72-29.31 97.15-98.41 22.54-23.10 48.53-49.65 57.76-58.99l16.79-17-4.34-4c-2.39-2.2-14.67-13.41-27.28-24.92s-23.07-21.23-23.23-21.61c-.30-.72.32-.88 36.29-9.4 12.65-2.99 32.22-7.70 43.5-10.45s28.15-6.85 37.5-9.11c9.35-2.26 23.30-5.64 31-7.51 32.51-7.91 64.33-15.50 64.96-15.50.15 0-.54 3.94-1.54 8.75-4.91 23.62-11.24 53.92-15.42 73.75-2.54 12.10-6.61 31.67-9.03 43.5s-5.78 23.83-7.48 31.81c-1.70 7.98-4.34 20.47-5.88 27.76s-3.06 13.52-3.38 13.84c-.61.61-9.56-6.89-25.23-21.16-4.95-4.51-12.15-10.97-16-14.36l-7-6.17-3.91 4.29c-4.90 5.38-32.10 33.35-61.08 62.80-26.70 27.13-158.79 162.16-166.52 170.22l-5.49 5.72-21.5-20.59c-55.42-53.08-73.11-69.87-73.91-70.14-.47-.17-1.47.34-2.22 1.13-4.59 4.81-75.04 75.93-131.66 132.91z" fill="rgb(214,164,45)"/>
      </g>
    </svg>
  `.trim(),

  // Páginas de FII estão em fiis/{ticker}/index.html → home é ../../
  menuItems: [
    { icon: '🏠', label: 'Início', href: '../../' },
    { icon: '🏢', label: 'FIIs', href: '../' },
    { icon: '📰', label: 'Artigos', href: '../../artigos/' },
    { icon: '🧮', label: 'Ferramentas', href: '../../ferramentas-financeiras/' },
    { icon: '🔍', label: 'Busca', href: '../../busca/' },
  ],

  renderHeader() {
    return `
      <div class="article-topbar">
        <a href="../" class="topbar-back" aria-label="Voltar para FIIs">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
        <a href="../../" class="topbar-brand" aria-label="Ir para a página inicial">
          <span class="topbar-logo">${this.logoSVG}</span>
          <span class="topbar-brand-text">
            <strong>Rico aos Poucos</strong>
            <small>Análise de FII</small>
          </span>
        </a>
        <button type="button" class="topbar-menu-btn" aria-label="Abrir menu" aria-expanded="false" id="topbarMenuBtn">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <nav class="topbar-menu" id="topbarMenu" aria-hidden="true">
          ${this.menuItems.map(it => `
            <a href="${it.href}" class="topbar-menu-item">
              <span class="topbar-menu-icon" aria-hidden="true">${it.icon}</span>
              <span>${it.label}</span>
            </a>
          `).join('')}
        </nav>
      </div>
    `;
  },

  bindMenu() {
    const btn = document.getElementById('topbarMenuBtn');
    const menu = document.getElementById('topbarMenu');
    if (!btn || !menu) return;
    const closeMenu = () => {
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      menu.classList.remove('open');
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== btn) closeMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  },

  renderFooter() {
    return `
      <div class="article-footer-inner">
        <div class="article-footer-brand">
          <strong>Rico aos Poucos</strong>
          <span>Educação financeira com dados, sem atalho.</span>
        </div>
        <nav class="article-footer-nav">
          ${this.menuItems.map(it => `<a href="${it.href}">${it.label}</a>`).join('')}
        </nav>
        <div class="article-footer-note">
          © ${new Date().getFullYear()} Rico aos Poucos · análise informativa, sem recomendação de investimento
        </div>
      </div>
    `;
  },

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
    // Header
    const headerHtml = this.renderHeader();
    const placeholder = document.getElementById('site-header');
    if (placeholder) {
      placeholder.outerHTML = `<header class="article-topbar-wrap">${headerHtml}</header>`;
    } else {
      const legado = document.querySelector('header.app-header');
      if (legado) legado.outerHTML = `<header class="article-topbar-wrap">${headerHtml}</header>`;
    }
    this.bindMenu();

    // Carrossel de artigos relacionados (depois do conteúdo do FII)
    const ticker = document.body.dataset.ticker
      || (location.pathname.match(/\/fiis\/([^/]+)\//) || [])[1]?.toUpperCase();
    if (ticker) {
      const relatedHtml = await this.renderRelatedArticles(ticker);
      if (relatedHtml) {
        const root = document.getElementById('fii-root');
        if (root) root.insertAdjacentHTML('afterend', relatedHtml);
      }
    }

    // Footer
    const footerPlaceholder = document.getElementById('site-footer');
    if (footerPlaceholder) {
      footerPlaceholder.outerHTML = `<footer class="article-footer">${this.renderFooter()}</footer>`;
    } else {
      const wrap = document.querySelector('.page-wrapper');
      if (wrap) wrap.insertAdjacentHTML('beforeend', `<footer class="article-footer">${this.renderFooter()}</footer>`);
    }
  },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => FIILayout.init());
} else {
  FIILayout.init();
}

window.FIILayout = FIILayout;
