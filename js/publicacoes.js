/**
 * Dynamic Publications Loader for Rico aos Poucos
 * Loads featured articles from artigos.json and renders them dynamically
 */

const Publicacoes = {
  // Map categories/sectors to badges and sentiment types
  badgeMap: {
    // By sector
    'bitcoin': { badge: 'BTC', type: 'bearish' },
    'tlt': { badge: 'TLT', type: 'bullish' },
    'dolar': { badge: 'USD', type: 'bullish' },
    'fiis': { badge: 'FIIs', type: 'neutral' },
    'tesouro-ipca': { badge: 'IPCA+', type: 'neutral' },
    'ibov': { badge: 'IBOV', type: 'neutral' },
    'sp500': { badge: 'S&P', type: 'neutral' },
    'ouro': { badge: 'OURO', type: 'neutral' },
    'caixa': { badge: 'CDI', type: 'bullish' },
    'imoveis': { badge: 'IMOV', type: 'bullish' },
    // By category (fallback)
    'educacao': { badge: 'EDU', type: 'neutral' },
    'estrategias': { badge: 'EST', type: 'neutral' },
    'macroeconomia': { badge: 'MACRO', type: 'neutral' },
    'renda-variavel': { badge: 'RV', type: 'neutral' },
    'renda-fixa': { badge: 'RF', type: 'neutral' },
    'psicologia': { badge: 'PSI', type: 'neutral' }
  },

  // Special overrides for specific articles
  articleOverrides: {
    'strategy-mstr-2026-analise': { badge: 'MSTR', type: 'bearish' }
  },

  // Get badge info for an article
  getBadgeInfo(artigo) {
    // Check for specific override first
    if (this.articleOverrides[artigo.id]) {
      return this.articleOverrides[artigo.id];
    }
    // Then check by sector
    if (artigo.setorRelacionado && this.badgeMap[artigo.setorRelacionado]) {
      return this.badgeMap[artigo.setorRelacionado];
    }
    // Finally fallback to category
    if (artigo.categoria && this.badgeMap[artigo.categoria]) {
      return this.badgeMap[artigo.categoria];
    }
    // Default
    return { badge: 'INFO', type: 'neutral' };
  },

  // Detect base path for data fetch
  getDataPath() {
    const path = window.location.pathname;

    // Check for language prefixes
    if (path.includes('/en/')) {
      return '../data/artigos.json';
    } else if (path.includes('/es/')) {
      return '../data/artigos.json';
    }
    return 'data/artigos.json';
  },

  // Get articles path based on language
  getArticlesPath() {
    const path = window.location.pathname;

    if (path.includes('/en/')) {
      return 'artigos/';
    } else if (path.includes('/es/')) {
      return 'artigos/';
    }
    return 'artigos/';
  },

  // Load and render publications
  async init() {
    const pubList = document.getElementById('pubList');
    const pubFeatured = document.getElementById('pubFeatured');

    if (!pubList || !pubFeatured) return;

    try {
      const response = await fetch(this.getDataPath());
      if (!response.ok) throw new Error('Failed to load articles');

      const data = await response.json();

      // Filter featured articles
      const destaques = data.artigos
        .filter(a => a.destaque === true)
        .sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao));

      if (destaques.length === 0) {
        pubList.innerHTML = '<p class="pub-empty">Nenhuma publicação em destaque</p>';
        return;
      }

      // Render the list
      this.renderList(pubList, destaques);

      // Render featured (first article)
      this.renderFeatured(pubFeatured, destaques[0]);

      // Setup interactions
      this.setupInteractions(pubList, pubFeatured, destaques);

    } catch (error) {
      console.error('Error loading publications:', error);
      // Keep static content as fallback
    }
  },

  // Render publication list
  renderList(container, artigos) {
    const articlesPath = this.getArticlesPath();

    container.innerHTML = artigos.map((artigo, index) => {
      const { badge, type } = this.getBadgeInfo(artigo);
      const href = articlesPath + artigo.arquivo;

      return `
        <button class="pub-list-item ${index === 0 ? 'active' : ''}"
                data-index="${index}"
                data-href="${href}"
                data-badge="${badge}"
                data-type="${type}"
                data-title="${artigo.titulo}"
                data-excerpt="${artigo.descricao}">
          <span class="pub-list-badge ${type}">${badge}</span>
          <span class="pub-list-title">${artigo.titulo}</span>
        </button>
      `;
    }).join('');
  },

  // Render featured article
  renderFeatured(container, artigo) {
    const { badge, type } = this.getBadgeInfo(artigo);
    const articlesPath = this.getArticlesPath();
    const href = articlesPath + artigo.arquivo;

    // Get translations based on current language
    const lang = window.I18n ? window.I18n.currentLang : 'pt-BR';
    const readMore = {
      'pt-BR': 'Ler mais',
      'en': 'Read more',
      'es': 'Leer más'
    }[lang] || 'Ler mais';

    container.innerHTML = `
      <a href="${href}" class="pub-featured-link" id="pubFeaturedLink">
        <div class="pub-featured-badge ${type}" id="pubFeaturedBadge">${badge}</div>
        <h3 class="pub-featured-title" id="pubFeaturedTitle">${artigo.titulo}</h3>
        <p class="pub-featured-excerpt" id="pubFeaturedExcerpt">${artigo.descricao}</p>
        <span class="pub-featured-cta">
          <span>${readMore}</span>
          <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </span>
      </a>
    `;
  },

  // Setup click and auto-rotate interactions
  setupInteractions(pubList, pubFeatured, artigos) {
    const items = pubList.querySelectorAll('.pub-list-item');
    let currentIndex = 0;
    let autoRotateInterval;

    const activateItem = (index) => {
      const item = items[index];
      if (!item) return;

      // Update active state
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Update featured
      const pubFeaturedLink = document.getElementById('pubFeaturedLink');
      const pubFeaturedBadge = document.getElementById('pubFeaturedBadge');
      const pubFeaturedTitle = document.getElementById('pubFeaturedTitle');
      const pubFeaturedExcerpt = document.getElementById('pubFeaturedExcerpt');

      if (pubFeaturedLink) {
        pubFeaturedLink.href = item.dataset.href;
        pubFeaturedBadge.textContent = item.dataset.badge;
        pubFeaturedBadge.className = 'pub-featured-badge ' + item.dataset.type;
        pubFeaturedTitle.textContent = item.dataset.title;
        pubFeaturedExcerpt.textContent = item.dataset.excerpt;

        // Fade animation
        pubFeaturedLink.style.opacity = '0';
        setTimeout(() => {
          pubFeaturedLink.style.opacity = '1';
        }, 50);
      }

      currentIndex = index;
    };

    const nextItem = () => {
      const nextIndex = (currentIndex + 1) % items.length;
      activateItem(nextIndex);
    };

    const startAutoRotate = () => {
      autoRotateInterval = setInterval(nextItem, 7000);
    };

    const stopAutoRotate = () => {
      clearInterval(autoRotateInterval);
    };

    // Click handlers
    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        stopAutoRotate();
        activateItem(index);

        // Smooth scroll on mobile
        if (window.innerWidth < 768) {
          const cardPub = document.querySelector('.card-publicacoes');
          const header = document.querySelector('.app-header');
          if (cardPub) {
            const headerHeight = header ? header.offsetHeight : 0;
            const top = cardPub.getBoundingClientRect().top + window.scrollY - headerHeight - 10;
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        }

        startAutoRotate();
      });
    });

    // Hover handlers
    pubList.addEventListener('mouseenter', stopAutoRotate);
    pubList.addEventListener('mouseleave', startAutoRotate);

    // Start auto-rotate
    startAutoRotate();
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Publicacoes.init());
} else {
  Publicacoes.init();
}

// Export
window.Publicacoes = Publicacoes;
