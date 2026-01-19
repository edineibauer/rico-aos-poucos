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
      <div class="footer-columns">
        <!-- Column 1: Brand -->
        <div class="footer-col footer-col-brand">
          <div class="footer-brand">
            <svg viewBox="0 0 1024 1024" width="32" height="32">
              <defs><clipPath id="rcf"><rect width="1024" height="1024" rx="205"/></clipPath></defs>
              <g clip-path="url(#rcf)">
                <rect width="1024" height="1024" fill="#fdfdfd"/>
                <path d="M329.73 475.84C318.03 487.75 291.26 514.98 270.23 536.35L232 575.21V218.91l129.25.35c127.97.35 129.38.37 142.25 2.56 44.75 7.62 77.89 21.45 104.52 43.63 19.83 16.51 36.07 40.45 41.44 61.07l1.53 5.87-9.75 10.06c-5.36 5.53-29.55 30.3-53.75 55.05-24.21 24.75-48.25 49.39-53.42 54.75-5.18 5.36-9.91 9.75-10.51 9.75s-5.76-4.68-11.47-10.41l-10.38-10.41 5.36-2.71c16.69-8.46 27.74-21.74 32.49-39.04 2.49-9.07 3.04-29.21 1.06-38.93-4.86-23.89-21.8-40.39-47.62-46.39-16.32-3.79-26.87-4.26-85.51-3.77-30.79.25-56.1.5-56.24.56-.14.05-.25 32.32-.25 71.69v71.6zm438.27 271.66c0 .28-32.06.48-71.25.45l-71.25-.05-22.31-31.2c-12.27-17.16-31.31-43.7-42.31-58.99l-20-27.78 2.6-3.09c4.52-5.37 76.91-78.84 77.68-78.84 1.08 0 39.66 51.87 88.5 119 11 15.12 28.63 39.31 39.17 53.75s19.17 26.79 19.17 27.06zM356 687.92V748h-59c-32.45 0-59-.34-58.99-.75.01-.9 115.72-118.6 117.06-119.08.57-.21.93 23.06.93 59.75z" fill="rgb(32,58,87)"/>
                <path d="M298.21 658.25C261.73 694.96 231.8 725 231.69 725s-.19-27.65-.19-61.45v-61.44l16-16.26c8.8-8.96 50.21-51.0 92.03-93.35 41.82-42.36 79.13-80.27 82.92-84.26 3.78-3.99 7.25-7.25 7.72-7.25s10.62 9.34 22.59 20.75c11.96 11.41 32.71 31.06 46.11 43.66 23.13 21.77 24.46 22.85 26.49 21.5 2.26-1.49 29.72-29.31 97.15-98.41 22.54-23.10 48.53-49.65 57.76-58.99l16.79-17 -4.34-4c-2.39-2.2-14.67-13.41-27.28-24.92s-23.07-21.23-23.23-21.61c-.3-.72.32-.88 36.29-9.4 12.65-2.99 32.22-7.70 43.5-10.45s28.15-6.85 37.5-9.11c9.35-2.26 23.30-5.64 31-7.51 32.51-7.91 64.33-15.50 64.96-15.50.15 0-.54 3.94-1.54 8.75-4.91 23.62-11.24 53.92-15.42 73.75-2.54 12.10-6.61 31.67-9.03 43.5s-5.78 23.83-7.48 31.81c-1.70 7.98-4.34 20.47-5.88 27.76s-3.06 13.52-3.38 13.84c-.61.61-9.56-6.89-25.23-21.16-4.95-4.51-12.15-10.97-16-14.36l-7-6.17-3.91 4.29c-4.90 5.38-32.10 33.35-61.08 62.80-26.70 27.13-158.79 162.16-166.52 170.22l-5.49 5.72-21.5-20.59c-55.42-53.08-73.11-69.87-73.91-70.14-.47-.17-1.47.34-2.22 1.13-4.59 4.81-75.04 75.93-131.66 132.91z" fill="rgb(214,164,45)"/>
              </g>
            </svg>
            <span>Rico aos Poucos</span>
          </div>
          <p class="footer-tagline" data-i18n="common.disclaimer">Conteúdo educacional • Não é recomendação de investimento</p>
        </div>

        <!-- Column 2: Tools -->
        <div class="footer-col footer-col-tools">
          <span class="footer-col-title" data-i18n="footer.quickLinks">Ferramentas</span>
          <div class="footer-col-links">
            <a href="${basePath}simulador-investimentos/" class="footer-link-item">
              <span>💼</span> <span data-i18n="footer.portfolioSim">Simulador de Carteira</span>
            </a>
            <a href="${basePath}calculadora-aposentadoria/" class="footer-link-item">
              <span>🏖️</span> <span data-i18n="footer.retirementCalc">Calculadora de Aposentadoria</span>
            </a>
            <a href="${basePath}calculadora-custo-construcao/" class="footer-link-item">
              <span>🏗️</span> <span data-i18n="footer.constructionCalc">Calculadora de Construção</span>
            </a>
          </div>
        </div>

        <!-- Column 3: Navigation -->
        <div class="footer-col footer-col-nav">
          <span class="footer-col-title" data-i18n="footer.navigation">Navegação</span>
          <div class="footer-col-links">
            <a href="${basePath}" class="footer-link-item">
              <span>🏠</span> <span data-i18n="nav.home">Início</span>
            </a>
            <a href="${basePath}setores/" class="footer-link-item">
              <span>📊</span> <span data-i18n="nav.sectors">Setores</span>
            </a>
            ${showSobreLink ? `
            <a href="${sobrePath}" class="footer-link-item">
              <span>💡</span> <span data-i18n="nav.about">Sobre o Canal</span>
            </a>
            ` : ''}
          </div>
        </div>

        <!-- Column 4: Social -->
        <div class="footer-col footer-col-social">
          <span class="footer-col-title" data-i18n="footer.followUs">Acompanhe</span>
          <div class="footer-col-links">
            <a href="https://www.youtube.com/@ricoaospoucos-edineibauer" target="_blank" class="footer-link-item footer-youtube-link">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.5.5c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.5 9.5.5 9.5.5s7.6 0 9.5-.5c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z"/></svg>
              <span>YouTube</span>
            </a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-version">
          <span data-i18n="footer.version">v1.5</span>
          <span class="separator">•</span>
          <span data-i18n="footer.date">Janeiro 2026</span>
        </div>
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
