/**
 * Dynamic Publications Loader for Rico aos Poucos
 * Renderiza um grid editorial dos últimos 6 artigos em destaque na home.
 *
 * Layout:
 *   - Hero (posição 0): card grande com capa em destaque
 *   - Stack lateral (posições 1, 2, 3): 3 cards compactos verticais
 *   - Linha inferior (posições 4, 5): 2 cards largos horizontais
 *
 * Mantém também retrocompatibilidade com a estrutura antiga
 * (#pubFeatured + #pubList) caso alguma página ainda use.
 */

const Publicacoes = {
  badgeMap: {
    'bitcoin':      { badge: 'BTC',   type: 'bearish' },
    'tlt':          { badge: 'TLT',   type: 'bullish' },
    'dolar':        { badge: 'USD',   type: 'bullish' },
    'fiis':         { badge: 'FIIs',  type: 'neutral' },
    'tesouro-ipca': { badge: 'IPCA+', type: 'neutral' },
    'ibov':         { badge: 'IBOV',  type: 'neutral' },
    'sp500':        { badge: 'S&P',   type: 'neutral' },
    'ouro':         { badge: 'OURO',  type: 'neutral' },
    'caixa':        { badge: 'CDI',   type: 'bullish' },
    'imoveis':      { badge: 'IMOV',  type: 'bullish' },
    'educacao':     { badge: 'EDU',   type: 'neutral' },
    'estrategias':  { badge: 'EST',   type: 'neutral' },
    'macroeconomia':{ badge: 'MACRO', type: 'neutral' },
    'renda-variavel': { badge: 'RV',  type: 'neutral' },
    'renda-fixa':   { badge: 'RF',    type: 'neutral' },
    'psicologia':   { badge: 'PSI',   type: 'neutral' }
  },

  articleOverrides: {
    'strategy-mstr-2026-analise': { badge: 'MSTR', type: 'bearish' }
  },

  monthsPtBR: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],

  getBadgeInfo(artigo) {
    if (this.articleOverrides[artigo.id]) return this.articleOverrides[artigo.id];
    if (artigo.setorRelacionado && this.badgeMap[artigo.setorRelacionado]) return this.badgeMap[artigo.setorRelacionado];
    if (artigo.categoria && this.badgeMap[artigo.categoria]) return this.badgeMap[artigo.categoria];
    return { badge: 'INFO', type: 'neutral' };
  },

  getDataPath() {
    const path = window.location.pathname;
    if (path.includes('/en/') || path.includes('/es/')) return '../data/artigos.json';
    return 'data/artigos.json';
  },

  getArticlesPath() {
    return 'artigos/';
  },

  formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()} ${this.monthsPtBR[d.getMonth()]} ${d.getFullYear()}`;
  },

  escape(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // ============================================================
  // Render — Grid editorial (modo padrão da home)
  // ============================================================
  buildCard(artigo, position) {
    const { badge, type } = this.getBadgeInfo(artigo);
    const href = this.getArticlesPath() + artigo.arquivo;
    const date = this.formatDate(artigo.dataPublicacao);
    const title = this.escape(artigo.titulo);
    const excerpt = this.escape(artigo.descricao || '');
    const capa = artigo.capa;

    let modifierClass = '';
    if (position === 0) modifierClass = 'article-card--hero';
    else if (position >= 1 && position <= 3) modifierClass = 'article-card--compact';
    else modifierClass = 'article-card--wide';

    const imageHtml = capa
      ? `<div class="article-card-image">
           <img src="${this.escape(capa)}" alt="${title}" loading="${position === 0 ? 'eager' : 'lazy'}" decoding="async">
         </div>`
      : `<div class="article-card-image">
           <div class="article-card-image-fallback">📰</div>
         </div>`;

    const ctaText = position === 0 ? 'Ler análise completa' : 'Ler';

    return `
      <a class="article-card ${modifierClass}" href="${href}" data-pos="${position}" aria-label="${title}">
        ${imageHtml}
        <div class="article-card-body">
          <div class="article-card-meta">
            <span class="article-card-badge ${type}">${badge}</span>
            ${date ? `<span class="article-card-date">${date}</span>` : ''}
          </div>
          <h3 class="article-card-title">${title}</h3>
          ${excerpt ? `<p class="article-card-excerpt">${excerpt}</p>` : ''}
          <span class="article-card-cta">
            ${ctaText}
            <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </a>
    `;
  },

  renderGrid(rootGrid, rootBottom, artigos) {
    // Hero (posição 0) + stack lateral [1, 2, 3]
    const hero = artigos[0] ? this.buildCard(artigos[0], 0) : '';
    const stack = [1, 2, 3]
      .map(i => artigos[i] ? this.buildCard(artigos[i], i) : '')
      .filter(Boolean)
      .join('');

    rootGrid.innerHTML = `
      ${hero}
      <div class="article-card-stack">
        ${stack}
      </div>
    `;

    // Linha inferior não é mais usada — limpa qualquer conteúdo legado
    if (rootBottom) {
      rootBottom.innerHTML = '';
    }
  },

  async initGrid() {
    const grid = document.getElementById('articlesHeroGrid');
    const gridBottom = document.getElementById('articlesHeroGridBottom');
    if (!grid) return false;

    try {
      const response = await fetch(this.getDataPath());
      if (!response.ok) throw new Error('Failed to load articles');
      const data = await response.json();

      const destaques = data.artigos
        .filter(a => a.destaque === true)
        .sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao))
        .slice(0, 4);

      if (destaques.length === 0) {
        grid.innerHTML = '<div class="articles-hero-loading">Nenhum artigo em destaque</div>';
        return true;
      }

      this.renderGrid(grid, gridBottom, destaques);
    } catch (error) {
      console.error('Error loading article grid:', error);
      grid.innerHTML = '<div class="articles-hero-loading">Não foi possível carregar os artigos.</div>';
    }
    return true;
  },

  // ============================================================
  // Render — Modo legacy (1 featured + lista lateral)
  // Mantido para páginas que ainda usem #pubFeatured + #pubList
  // ============================================================
  async initLegacy() {
    const pubList = document.getElementById('pubList');
    const pubFeatured = document.getElementById('pubFeatured');
    if (!pubList || !pubFeatured) return false;

    try {
      const response = await fetch(this.getDataPath());
      if (!response.ok) throw new Error('Failed to load articles');
      const data = await response.json();

      const destaques = data.artigos
        .filter(a => a.destaque === true)
        .sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao));

      if (destaques.length === 0) {
        pubList.innerHTML = '<p class="pub-empty">Nenhuma publicação em destaque</p>';
        return true;
      }

      this.renderLegacyList(pubList, destaques.slice(0, 6));
      this.renderLegacyFeatured(pubFeatured, destaques[0]);
      this.setupLegacyInteractions(pubList, pubFeatured, destaques);
    } catch (error) {
      console.error('Error loading publications (legacy):', error);
    }
    return true;
  },

  renderLegacyList(container, artigos) {
    const articlesPath = this.getArticlesPath();
    container.innerHTML = artigos.map((artigo, index) => {
      const { badge, type } = this.getBadgeInfo(artigo);
      const href = articlesPath + artigo.arquivo;
      const capa = artigo.capa || '';
      return `
        <button class="pub-list-item ${index === 0 ? 'active' : ''}"
                data-index="${index}"
                data-href="${this.escape(href)}"
                data-badge="${this.escape(badge)}"
                data-type="${this.escape(type)}"
                data-title="${this.escape(artigo.titulo)}"
                data-excerpt="${this.escape(artigo.descricao || '')}"
                data-capa="${this.escape(capa)}">
          <span class="pub-list-badge ${type}">${badge}</span>
          <span class="pub-list-title">${this.escape(artigo.titulo)}</span>
        </button>
      `;
    }).join('');
  },

  renderLegacyFeatured(container, artigo) {
    const { badge, type } = this.getBadgeInfo(artigo);
    const href = this.getArticlesPath() + artigo.arquivo;
    const lang = window.I18n ? window.I18n.currentLang : 'pt-BR';
    const readMore = ({ 'pt-BR': 'Ler mais', 'en': 'Read more', 'es': 'Leer más' })[lang] || 'Ler mais';
    const capaHtml = artigo.capa
      ? `<div class="pub-featured-image"><img src="${this.escape(artigo.capa)}" alt="${this.escape(artigo.titulo)}" loading="lazy"></div>`
      : '';

    container.innerHTML = `
      <a href="${href}" class="pub-featured-link ${artigo.capa ? 'has-cover' : ''}" id="pubFeaturedLink">
        ${capaHtml}
        <div class="pub-featured-content">
          <div class="pub-featured-badge ${type}" id="pubFeaturedBadge">${badge}</div>
          <h3 class="pub-featured-title" id="pubFeaturedTitle">${this.escape(artigo.titulo)}</h3>
          <p class="pub-featured-excerpt" id="pubFeaturedExcerpt">${this.escape(artigo.descricao || '')}</p>
          <span class="pub-featured-cta">
            <span>${readMore}</span>
            <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </a>
    `;
  },

  setupLegacyInteractions(pubList, pubFeatured, artigos) {
    const items = pubList.querySelectorAll('.pub-list-item');
    let currentIndex = 0;
    let autoRotateInterval;

    const activateItem = (index) => {
      const item = items[index];
      if (!item) return;
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const link = document.getElementById('pubFeaturedLink');
      const badgeEl = document.getElementById('pubFeaturedBadge');
      const titleEl = document.getElementById('pubFeaturedTitle');
      const excerptEl = document.getElementById('pubFeaturedExcerpt');

      if (link) {
        link.href = item.dataset.href;
        badgeEl.textContent = item.dataset.badge;
        badgeEl.className = 'pub-featured-badge ' + item.dataset.type;
        titleEl.textContent = item.dataset.title;
        excerptEl.textContent = item.dataset.excerpt;

        const capa = item.dataset.capa;
        let imageContainer = link.querySelector('.pub-featured-image');
        if (capa) {
          link.classList.add('has-cover');
          if (imageContainer) {
            imageContainer.querySelector('img').src = capa;
            imageContainer.querySelector('img').alt = item.dataset.title;
          } else {
            const imgHtml = document.createElement('div');
            imgHtml.className = 'pub-featured-image';
            imgHtml.innerHTML = `<img src="${capa}" alt="${item.dataset.title}" loading="lazy">`;
            link.insertBefore(imgHtml, link.firstChild);
          }
        } else {
          link.classList.remove('has-cover');
          if (imageContainer) imageContainer.remove();
        }

        link.style.opacity = '0';
        setTimeout(() => { link.style.opacity = '1'; }, 50);
      }
      currentIndex = index;
    };

    const nextItem = () => activateItem((currentIndex + 1) % items.length);
    const resetAutoRotate = () => {
      clearInterval(autoRotateInterval);
      autoRotateInterval = setInterval(nextItem, 7000);
    };
    const stopAutoRotate = () => { clearInterval(autoRotateInterval); autoRotateInterval = null; };
    const startAutoRotate = () => { if (!autoRotateInterval) autoRotateInterval = setInterval(nextItem, 7000); };

    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        activateItem(index);
        if (window.innerWidth < 768) {
          const cardPub = document.querySelector('.card-publicacoes');
          const header = document.querySelector('.app-header');
          if (cardPub) {
            const headerHeight = header ? header.offsetHeight : 0;
            const top = cardPub.getBoundingClientRect().top + window.scrollY - headerHeight - 10;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }
        resetAutoRotate();
      });
    });

    pubList.addEventListener('mouseenter', stopAutoRotate);
    pubList.addEventListener('mouseleave', resetAutoRotate);
    startAutoRotate();
  },

  async init() {
    // Tenta primeiro o grid novo. Se não existir na página, cai no legacy.
    const usedGrid = await this.initGrid();
    if (!usedGrid) await this.initLegacy();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Publicacoes.init());
} else {
  Publicacoes.init();
}

window.Publicacoes = Publicacoes;
