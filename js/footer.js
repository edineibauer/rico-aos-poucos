/**
 * Footer Template System for Rico aos Poucos
 * Centralizes footer rendering and Google Analytics
 * Supports multiple footer types based on page context
 */

const Footer = {
  // Google Analytics ID
  GA_ID: 'G-6XBNHTHSTW',

  // Footer type detection based on URL
  detectFooterType() {
    const path = window.location.pathname;

    // Remove base path for GitHub Pages
    let relativePath = path;
    if (window.I18n && window.I18n.basePath) {
      relativePath = path.replace(window.I18n.basePath, '');
    }

    // Normalize path
    if (!relativePath.startsWith('/')) {
      relativePath = '/' + relativePath;
    }

    // Remove language prefix
    relativePath = relativePath.replace(/^\/(en|es)\//, '/');

    // Detect page type
    if (relativePath.match(/^\/setores\/[^/]+\//)) {
      // Individual sector page: /setores/dolar/
      return 'sector-detail';
    } else if (relativePath === '/setores/' || relativePath === '/setores/index.html') {
      // Sectors list page
      return 'sectors-list';
    } else if (relativePath === '/desempenho/' || relativePath === '/desempenho/index.html') {
      // Performance page (uses YouTube footer like sectors list)
      return 'performance';
    } else if (relativePath === '/sobre/' || relativePath === '/sobre/index.html') {
      // About page
      return 'about';
    } else {
      // Default: main pages, articles, etc.
      return 'default';
    }
  },

  // Get the correct relative path for links based on current page depth
  getBasePath() {
    const path = window.location.pathname;
    let relativePath = path;

    // Remove base path
    if (window.I18n && window.I18n.basePath) {
      relativePath = path.replace(window.I18n.basePath, '');
    }

    // Count depth (number of directories)
    const parts = relativePath.split('/').filter(p => p && !p.includes('.html'));

    if (parts.length === 0) {
      return './';
    } else if (parts.length === 1) {
      return '../';
    } else if (parts.length === 2) {
      return '../../';
    } else if (parts.length === 3) {
      return '../../../';
    }
    return '../'.repeat(parts.length);
  },

  // Get path to sobre page
  getSobrePath() {
    const basePath = this.getBasePath();
    const lang = window.I18n ? window.I18n.currentLang : 'pt-BR';

    if (lang === 'pt-BR') {
      return basePath + 'sobre/';
    }
    return basePath + 'sobre/';
  },

  // Get path to setores page
  getSetoresPath() {
    const basePath = this.getBasePath();
    return basePath.replace(/\.\.\/$/, '') || '../';
  },

  // Render default footer (main pages, articles)
  renderDefaultFooter(showSobreLink = true) {
    const sobrePath = this.getSobrePath();
    const basePath = this.getBasePath();

    return `
    <footer class="app-footer">
      ${showSobreLink ? `
      <div class="footer-links">
        <a href="${sobrePath}" class="footer-link">
          <span>💡</span> <span data-i18n="nav.about">Sobre o Canal</span>
        </a>
      </div>
      ` : ''}
      <div class="footer-quick-links">
        <span class="footer-quick-title" data-i18n="footer.quickLinks">Ferramentas</span>
        <div class="footer-quick-grid">
          <a href="${basePath}ferramentas-financeiras/#carteira" class="footer-quick-item">
            <span>💼</span> <span data-i18n="footer.portfolioSim">Simulador de Carteira</span>
          </a>
          <a href="${basePath}ferramentas-financeiras/#aposentadoria" class="footer-quick-item">
            <span>🏖️</span> <span data-i18n="footer.retirementCalc">Calculadora de Aposentadoria</span>
          </a>
          <a href="${basePath}calculadora-custo-construcao/" class="footer-quick-item">
            <span>🏗️</span> <span data-i18n="footer.constructionCalc">Calculadora de Construção</span>
          </a>
        </div>
      </div>
      <p class="footer-disclaimer" data-i18n="common.disclaimer">
        Conteúdo educacional • Não é recomendação de investimento
      </p>
      <div class="footer-version">
        <span data-i18n="footer.version">v1.5</span>
        <span class="separator">•</span>
        <span data-i18n="footer.date">Janeiro 2026</span>
      </div>
    </footer>
    `;
  },

  // Render sector detail footer (with back link)
  renderSectorDetailFooter() {
    const translations = {
      'pt-BR': 'Voltar para Setores',
      'en': 'Back to Sectors',
      'es': 'Volver a Sectores'
    };
    const lang = window.I18n ? window.I18n.currentLang : 'pt-BR';
    const backText = translations[lang] || translations['pt-BR'];

    return `
    <footer class="page-footer">
      <div class="container">
        <div class="footer-nav">
          <a href="../" class="back-link">
            <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>${backText}</span>
          </a>
        </div>
        <p class="footer-disclaimer" data-i18n="common.disclaimer">Conteúdo educacional - Não é recomendação de investimento</p>
      </div>
    </footer>
    `;
  },

  // Render sectors list footer (with YouTube link)
  renderSectorsListFooter() {
    return `
    <footer class="page-footer">
      <a href="https://www.youtube.com/@ricoaospoucos-edineibauer" target="_blank" class="footer-youtube">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.5.5c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.5 9.5.5 9.5.5s7.6 0 9.5-.5c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z"/></svg>
        YouTube
      </a>
      <p class="footer-text" data-i18n="common.disclaimer">Conteúdo educacional - Não é recomendação de investimento</p>
    </footer>
    `;
  },

  // Render about page footer (no sobre link)
  renderAboutFooter() {
    return this.renderDefaultFooter(false);
  },

  // Initialize Google Analytics
  initGoogleAnalytics() {
    // Check if already loaded
    if (window.gtag) return;

    // Load gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', this.GA_ID);
  },

  // Main initialization
  init() {
    // Initialize Google Analytics first
    this.initGoogleAnalytics();

    // Find footer container
    const container = document.getElementById('footer-container');
    if (!container) {
      // Fallback: look for existing footer and replace it
      const existingFooter = document.querySelector('footer.app-footer, footer.page-footer');
      if (existingFooter) {
        // Don't replace if footer.js is managing it
        return;
      }
      return;
    }

    // Detect footer type and render
    const footerType = this.detectFooterType();
    let footerHTML = '';

    switch (footerType) {
      case 'sector-detail':
        footerHTML = this.renderSectorDetailFooter();
        break;
      case 'sectors-list':
      case 'performance':
        footerHTML = this.renderSectorsListFooter();
        break;
      case 'about':
        footerHTML = this.renderAboutFooter();
        break;
      default:
        footerHTML = this.renderDefaultFooter();
    }

    container.innerHTML = footerHTML;
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Footer.init());
} else {
  Footer.init();
}

// Export for use in other scripts
window.Footer = Footer;
