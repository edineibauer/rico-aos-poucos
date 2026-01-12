/**
 * Page Header Template for Rico aos Poucos
 * Standard header for all internal pages (not home)
 *
 * Usage:
 * 1. Add <header id="page-header" data-subtitle="Page Title"></header> in your HTML
 * 2. Include this script: <script src="path/to/page-header.js"></script>
 * 3. The header will render automatically
 */

const PageHeader = {
  // User menu translations
  userMenuTranslations: {
    'pt-BR': {
      myPortfolio: 'Minha Carteira',
      editPortfolio: 'Editar Carteira',
      noPortfolio: 'Nenhuma carteira configurada'
    },
    'en': {
      myPortfolio: 'My Portfolio',
      editPortfolio: 'Edit Portfolio',
      noPortfolio: 'No portfolio configured'
    },
    'es': {
      myPortfolio: 'Mi Cartera',
      editPortfolio: 'Editar Cartera',
      noPortfolio: 'Ninguna cartera configurada'
    }
  },
  // Logo SVG inline
  logoSVG: `
    <svg viewBox="0 0 1024 1024" width="36" height="36">
      <defs><clipPath id="rc"><rect width="1024" height="1024" rx="205"/></clipPath></defs>
      <g clip-path="url(#rc)">
        <rect width="1024" height="1024" fill="#fdfdfd"/>
        <path d="M329.73 475.84C318.03 487.75 291.26 514.98 270.23 536.35L232 575.21V218.91l129.25.35c127.97.35 129.38.37 142.25 2.56 44.75 7.62 77.89 21.45 104.52 43.63 19.83 16.51 36.07 40.45 41.44 61.07l1.53 5.87-9.75 10.06c-5.36 5.53-29.55 30.3-53.75 55.05-24.21 24.75-48.25 49.39-53.42 54.75-5.18 5.36-9.91 9.75-10.51 9.75s-5.76-4.68-11.47-10.41l-10.38-10.41 5.36-2.71c16.69-8.46 27.74-21.74 32.49-39.04 2.49-9.07 3.04-29.21 1.06-38.93-4.86-23.89-21.8-40.39-47.62-46.39-16.32-3.79-26.87-4.26-85.51-3.77-30.79.25-56.1.5-56.24.56-.14.05-.25 32.32-.25 71.69v71.6zm438.27 271.66c0 .28-32.06.48-71.25.45l-71.25-.05-22.31-31.2c-12.27-17.16-31.31-43.7-42.31-58.99l-20-27.78 2.6-3.09c4.52-5.37 76.91-78.84 77.68-78.84 1.08 0 39.66 51.87 88.5 119 11 15.12 28.63 39.31 39.17 53.75s19.17 26.79 19.17 27.06zM356 687.92V748h-59c-32.45 0-59-.34-58.99-.75.01-.9 115.72-118.6 117.06-119.08.57-.21.93 23.06.93 59.75z" fill="rgb(32,58,87)"/>
        <path d="M298.21 658.25C261.73 694.96 231.8 725 231.69 725s-.19-27.65-.19-61.45v-61.44l16-16.26c8.8-8.96 50.21-51.0 92.03-93.35 41.82-42.36 79.13-80.27 82.92-84.26 3.78-3.99 7.25-7.25 7.72-7.25s10.62 9.34 22.59 20.75c11.96 11.41 32.71 31.06 46.11 43.66 23.13 21.77 24.46 22.85 26.49 21.5 2.26-1.49 29.72-29.31 97.15-98.41 22.54-23.1 48.53-49.65 57.76-58.99l16.79-17 -4.34-4c-2.39-2.2-14.67-13.41-27.28-24.92s-23.07-21.23-23.23-21.61c-.3-.72.32-.88 36.29-9.4 12.65-2.99 32.22-7.7 43.5-10.45s28.15-6.85 37.5-9.11c9.35-2.26 23.3-5.64 31-7.51 32.51-7.91 64.33-15.5 64.96-15.5.15 0-.54 3.94-1.54 8.75-4.91 23.62-11.24 53.92-15.42 73.75-2.54 12.1-6.61 31.67-9.03 43.5s-5.78 23.83-7.48 31.81c-1.70 7.98-4.34 20.47-5.88 27.76s-3.06 13.52-3.38 13.84c-.61.61-9.56-6.89-25.23-21.16-4.95-4.51-12.15-10.97-16-14.36l-7-6.17-3.91 4.29c-4.9 5.38-32.1 33.35-61.08 62.8-26.7 27.13-158.79 162.16-166.52 170.22l-5.49 5.72-21.5-20.59c-55.42-53.08-73.11-69.87-73.91-70.14-.47-.17-1.47.34-2.22 1.13-4.59 4.81-75.04 75.93-131.66 132.91z" fill="rgb(214,164,45)"/>
      </g>
    </svg>
  `,

  /**
   * Get the back link based on current path depth
   * Returns '../' for pages in subdirectories
   */
  getBackLink() {
    const path = window.location.pathname;

    // Count depth: /calculadora/ = 1, /en/calculadora/ = 2, /setores/dolar/ = 2
    const segments = path.split('/').filter(s => s && s !== 'index.html');

    // If in language folder (en, es), we need to go back to language root
    const isLangFolder = segments[0] === 'en' || segments[0] === 'es';

    if (isLangFolder) {
      // /en/calculadora/ -> /en/
      return '../';
    } else {
      // /calculadora/ -> /
      return '../';
    }
  },

  /**
   * Get current language
   */
  getLang() {
    const saved = localStorage.getItem('rico-lang');
    if (saved) return saved;
    const path = window.location.pathname;
    if (path.startsWith('/en/')) return 'en';
    if (path.startsWith('/es/')) return 'es';
    return 'pt-BR';
  },

  /**
   * Get translation
   */
  t(key) {
    const lang = this.getLang();
    return this.userMenuTranslations[lang]?.[key] || this.userMenuTranslations['pt-BR'][key];
  },

  /**
   * Render the header HTML
   * @param {string} subtitle - The page subtitle to display
   */
  render(subtitle) {
    const backLink = this.getBackLink();

    return `
      <a href="${backLink}" class="header-back" aria-label="Voltar">
        <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </a>
      <div class="app-logo">
        ${this.logoSVG}
      </div>
      <div class="app-title-group">
        <h1 class="app-name">Rico aos Poucos</h1>
        <span class="app-subtitle">${subtitle}</span>
      </div>
      <div class="header-actions">
        <div class="user-menu-container">
          <button class="user-menu-btn" id="userMenuBtn" aria-label="${this.t('myPortfolio')}">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
          <div class="user-menu-dropdown" id="userMenuDropdown">
            <button class="user-menu-item" id="editPortfolioBtn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              <span>${this.t('myPortfolio')}</span>
            </button>
          </div>
        </div>
        <div id="langSelector"></div>
      </div>
    `;
  },

  /**
   * Initialize - find header container and render
   */
  init() {
    const container = document.getElementById('page-header');
    if (!container) return;

    // Get subtitle from data attribute
    const subtitle = container.getAttribute('data-subtitle') || '';

    // Add the app-header class for styling
    container.classList.add('app-header');

    // Render the header content
    container.innerHTML = this.render(subtitle);

    // Bind user menu events
    this.bindUserMenu();

    // Create portfolio modal
    this.createPortfolioModal();
  },

  /**
   * Bind user menu toggle events
   */
  bindUserMenu() {
    const btn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userMenuDropdown');
    const editBtn = document.getElementById('editPortfolioBtn');

    if (btn && dropdown) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('active');
      });

      dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        dropdown.classList.remove('active');
        this.openPortfolioModal();
      });
    }
  },

  /**
   * Create the portfolio modal
   */
  createPortfolioModal() {
    if (document.getElementById('portfolioModal')) return;

    const lang = this.getLang();
    const translations = {
      'pt-BR': {
        title: 'Minha Carteira de Investimentos',
        subtitle: 'Configure a distribuicao da sua carteira',
        total: 'Total',
        save: 'Salvar Carteira',
        cancel: 'Cancelar',
        clear: 'Limpar',
        extraYield: '+ % a.a.',
        extraYieldPlaceholder: 'Ex: 5',
        assets: {
          dolar: 'Dolar',
          caixa: 'Caixa (CDI)',
          tlt: 'TLT (Bonds)',
          imoveis: 'Imoveis',
          fiis: 'FIIs',
          ipca: 'IPCA+',
          ibov: 'Ibovespa',
          ouro: 'Ouro',
          sp500: 'S&P 500',
          bitcoin: 'Bitcoin'
        }
      },
      'en': {
        title: 'My Investment Portfolio',
        subtitle: 'Configure your portfolio allocation',
        total: 'Total',
        save: 'Save Portfolio',
        cancel: 'Cancel',
        clear: 'Clear',
        extraYield: '+ % p.a.',
        extraYieldPlaceholder: 'Ex: 5',
        assets: {
          dolar: 'Dollar',
          caixa: 'Cash (CDI)',
          tlt: 'TLT (Bonds)',
          imoveis: 'Real Estate',
          fiis: 'REITs',
          ipca: 'IPCA+',
          ibov: 'Ibovespa',
          ouro: 'Gold',
          sp500: 'S&P 500',
          bitcoin: 'Bitcoin'
        }
      },
      'es': {
        title: 'Mi Cartera de Inversiones',
        subtitle: 'Configure la distribucion de su cartera',
        total: 'Total',
        save: 'Guardar Cartera',
        cancel: 'Cancelar',
        clear: 'Limpiar',
        extraYield: '+ % a.a.',
        extraYieldPlaceholder: 'Ej: 5',
        assets: {
          dolar: 'Dolar',
          caixa: 'Caja (CDI)',
          tlt: 'TLT (Bonos)',
          imoveis: 'Inmuebles',
          fiis: 'FIIs',
          ipca: 'IPCA+',
          ibov: 'Ibovespa',
          ouro: 'Oro',
          sp500: 'S&P 500',
          bitcoin: 'Bitcoin'
        }
      }
    };

    const t = translations[lang] || translations['pt-BR'];
    const assets = ['dolar', 'caixa', 'tlt', 'imoveis', 'fiis', 'ipca', 'ibov', 'ouro', 'sp500', 'bitcoin'];
    const assetsWithExtraYield = ['dolar', 'ipca']; // Assets that have extra yield input

    let slidersHTML = '';
    assets.forEach(asset => {
      const hasExtraYield = assetsWithExtraYield.includes(asset);
      slidersHTML += `
        <div class="portfolio-slider-row ${hasExtraYield ? 'has-extra-yield' : ''}">
          <label class="portfolio-slider-label">${t.assets[asset]}</label>
          <input type="range" class="portfolio-slider" id="portfolio-${asset}"
                 min="0" max="100" value="0" data-asset="${asset}">
          <span class="portfolio-slider-value" id="portfolio-${asset}-value">0%</span>
          ${hasExtraYield ? `
            <div class="portfolio-extra-yield">
              <input type="number" class="portfolio-extra-input" id="portfolio-${asset}-extra"
                     min="0" max="20" step="0.5" value="0" placeholder="${t.extraYieldPlaceholder}">
              <span class="portfolio-extra-label">${t.extraYield}</span>
            </div>
          ` : ''}
        </div>
      `;
    });

    const modal = document.createElement('div');
    modal.id = 'portfolioModal';
    modal.className = 'portfolio-modal';
    modal.innerHTML = `
      <div class="portfolio-modal-content">
        <div class="portfolio-modal-header">
          <h2>${t.title}</h2>
          <p>${t.subtitle}</p>
          <button class="portfolio-modal-close" id="portfolioModalClose">&times;</button>
        </div>
        <div class="portfolio-modal-body">
          <div class="portfolio-sliders">
            ${slidersHTML}
          </div>
          <div class="portfolio-total-row">
            <span class="portfolio-total-label">${t.total}:</span>
            <span class="portfolio-total-value" id="portfolioTotalValue">0%</span>
          </div>
        </div>
        <div class="portfolio-modal-footer">
          <button class="portfolio-btn-secondary" id="portfolioClearBtn">${t.clear}</button>
          <button class="portfolio-btn-secondary" id="portfolioCancelBtn">${t.cancel}</button>
          <button class="portfolio-btn-primary" id="portfolioSaveBtn">${t.save}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind modal events
    this.bindPortfolioModal();
  },

  /**
   * Bind portfolio modal events
   */
  bindPortfolioModal() {
    const modal = document.getElementById('portfolioModal');
    const closeBtn = document.getElementById('portfolioModalClose');
    const cancelBtn = document.getElementById('portfolioCancelBtn');
    const saveBtn = document.getElementById('portfolioSaveBtn');
    const clearBtn = document.getElementById('portfolioClearBtn');
    const sliders = document.querySelectorAll('.portfolio-slider');

    // Close modal
    const closeModal = () => {
      modal.classList.remove('active');
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Update totals on slider change
    sliders.forEach(slider => {
      slider.addEventListener('input', () => {
        const valueSpan = document.getElementById(`${slider.id}-value`);
        if (valueSpan) {
          valueSpan.textContent = `${slider.value}%`;
        }
        this.updatePortfolioTotal();
      });
    });

    // Clear all
    clearBtn?.addEventListener('click', () => {
      sliders.forEach(slider => {
        slider.value = 0;
        const valueSpan = document.getElementById(`${slider.id}-value`);
        if (valueSpan) valueSpan.textContent = '0%';
      });
      // Clear extra yield inputs
      document.querySelectorAll('.portfolio-extra-input').forEach(input => {
        input.value = 0;
      });
      this.updatePortfolioTotal();
    });

    // Save portfolio
    saveBtn?.addEventListener('click', () => {
      this.savePortfolio();
      closeModal();
    });
  },

  /**
   * Update portfolio total display
   */
  updatePortfolioTotal() {
    const sliders = document.querySelectorAll('.portfolio-slider');
    let total = 0;
    sliders.forEach(slider => {
      total += parseInt(slider.value) || 0;
    });

    const totalSpan = document.getElementById('portfolioTotalValue');
    if (totalSpan) {
      totalSpan.textContent = `${total}%`;
      totalSpan.classList.toggle('valid', total === 100);
      totalSpan.classList.toggle('invalid', total !== 100);
    }
  },

  /**
   * Open portfolio modal
   */
  openPortfolioModal() {
    const modal = document.getElementById('portfolioModal');
    if (!modal) return;

    // Load saved portfolio
    const saved = this.getPortfolio();
    const sliders = document.querySelectorAll('.portfolio-slider');

    sliders.forEach(slider => {
      const asset = slider.dataset.asset;
      const value = saved?.[asset] || 0;
      slider.value = value;
      const valueSpan = document.getElementById(`${slider.id}-value`);
      if (valueSpan) valueSpan.textContent = `${value}%`;

      // Load extra yield if exists
      const extraInput = document.getElementById(`portfolio-${asset}-extra`);
      if (extraInput) {
        const extraValue = saved?.[`${asset}_extra`] || 0;
        extraInput.value = extraValue;
      }
    });

    this.updatePortfolioTotal();
    modal.classList.add('active');
  },

  /**
   * Save portfolio to localStorage
   */
  savePortfolio() {
    const sliders = document.querySelectorAll('.portfolio-slider');
    const portfolio = {};
    let total = 0;

    sliders.forEach(slider => {
      const asset = slider.dataset.asset;
      const value = parseInt(slider.value) || 0;
      if (value > 0) {
        portfolio[asset] = value;
      }
      total += value;

      // Save extra yield if exists
      const extraInput = document.getElementById(`portfolio-${asset}-extra`);
      if (extraInput) {
        const extraValue = parseFloat(extraInput.value) || 0;
        if (extraValue > 0) {
          portfolio[`${asset}_extra`] = extraValue;
        }
      }
    });

    localStorage.setItem('rico-portfolio', JSON.stringify(portfolio));

    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('portfolioUpdated', { detail: portfolio }));
  },

  /**
   * Get saved portfolio from localStorage
   */
  getPortfolio() {
    try {
      const saved = localStorage.getItem('rico-portfolio');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PageHeader.init());
} else {
  PageHeader.init();
}

// Export for use in other scripts
window.PageHeader = PageHeader;
