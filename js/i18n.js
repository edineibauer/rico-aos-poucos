/**
 * Internationalization (i18n) Module for Rico aos Poucos
 * Supports: pt-BR (default at /), en (at /en/), es (at /es/)
 * Uses URL-based language routing for SEO
 * Compatible with GitHub Pages subdirectory hosting
 */

const I18n = {
  // Available languages with their folder names
  languages: {
    'pt-BR': { code: 'pt-BR', name: 'Português', flag: '🇧🇷', folder: '', file: 'pt-br.json' },
    'en': { code: 'en', name: 'English', flag: '🇺🇸', folder: 'en', file: 'en.json' },
    'es': { code: 'es', name: 'Español', flag: '🇪🇸', folder: 'es', file: 'es.json' }
  },

  // Default language
  defaultLang: 'pt-BR',

  // Current language (detected from URL)
  currentLang: null,

  // Base path of the site (detected automatically)
  basePath: '',

  /**
   * Detect the base path of the site (for GitHub Pages compatibility)
   * Example: /rico-aos-poucos/ on GitHub Pages, or / locally
   *
   * The base path is only present when hosting on GitHub Pages with a repo name
   * e.g., https://username.github.io/repo-name/ has base path /repo-name
   * But https://ricoaospoucos.com/ has no base path (root)
   */
  detectBasePath() {
    const hostname = window.location.hostname;
    const path = window.location.pathname;

    // If we're on GitHub Pages (*.github.io), detect the repo name from the path
    if (hostname.endsWith('.github.io') || hostname.endsWith('.github.io.')) {
      // The first part of the path is the repo name (base path)
      const parts = path.split('/').filter(p => p);
      if (parts.length > 0) {
        // Check if the first segment is NOT a language folder
        // The repo name comes before any language prefix
        const firstPart = parts[0];
        if (firstPart !== 'en' && firstPart !== 'es') {
          return '/' + firstPart;
        }
      }
    }

    // For custom domains (like ricoaospoucos.com) or localhost, no base path needed
    return '';
  },

  /**
   * Initialize the i18n system
   */
  init() {
    // Detect base path first
    this.basePath = this.detectBasePath();

    // Detect current language from URL
    this.currentLang = this.detectLanguageFromURL();

    // Save to localStorage
    localStorage.setItem('rico-lang', this.currentLang);

    // Render language selector
    this.renderLanguageSelector();

    // Check if we should redirect based on saved preference
    this.checkRedirect();
  },

  /**
   * Detect language from current URL path
   */
  detectLanguageFromURL() {
    const path = window.location.pathname;

    // Remove base path to get the relative path
    let relativePath = path;
    if (this.basePath && path.startsWith(this.basePath)) {
      relativePath = path.substring(this.basePath.length);
    }

    // Normalize: ensure starts with /
    if (!relativePath.startsWith('/')) {
      relativePath = '/' + relativePath;
    }

    if (relativePath.startsWith('/en/') || relativePath === '/en') {
      return 'en';
    } else if (relativePath.startsWith('/es/') || relativePath === '/es') {
      return 'es';
    }
    return 'pt-BR';
  },

  /**
   * Get the relative path within the current language (without base path and language folder)
   */
  getRelativePath() {
    const path = window.location.pathname;
    let relativePath = path;

    // Remove base path
    if (this.basePath && path.startsWith(this.basePath)) {
      relativePath = path.substring(this.basePath.length);
    }

    // Normalize
    if (!relativePath.startsWith('/')) {
      relativePath = '/' + relativePath;
    }

    // Remove language folder
    if (relativePath.startsWith('/en/')) {
      relativePath = relativePath.substring(3);
    } else if (relativePath.startsWith('/es/')) {
      relativePath = relativePath.substring(3);
    } else if (relativePath === '/en' || relativePath === '/es') {
      relativePath = '/';
    }

    // Ensure starts with /
    if (!relativePath.startsWith('/')) {
      relativePath = '/' + relativePath;
    }

    return relativePath;
  },

  /**
   * Check if we need to redirect based on saved language preference
   * Only redirects on first visit to root
   */
  checkRedirect() {
    const savedLang = localStorage.getItem('rico-lang');
    const currentLang = this.detectLanguageFromURL();
    const relativePath = this.getRelativePath();

    // Only auto-redirect if user is on root and has a saved preference
    if (relativePath === '/' || relativePath === '/index.html') {
      if (savedLang && savedLang !== 'pt-BR' && savedLang !== currentLang) {
        const langInfo = this.languages[savedLang];
        if (langInfo && langInfo.folder) {
          const newURL = this.basePath + '/' + langInfo.folder + '/';
          window.location.href = newURL;
        }
      }
    }
  },

  /**
   * Get the equivalent URL for a different language
   */
  getURLForLanguage(targetLang) {
    const relativePath = this.getRelativePath();
    const targetFolder = this.languages[targetLang]?.folder || '';

    let newPath;
    if (targetFolder) {
      // Target is en or es
      newPath = this.basePath + '/' + targetFolder + relativePath;
    } else {
      // Target is pt-BR (default, no folder)
      newPath = this.basePath + relativePath;
    }

    // Clean up double slashes
    newPath = newPath.replace(/\/+/g, '/');

    // Ensure starts with /
    if (!newPath.startsWith('/')) {
      newPath = '/' + newPath;
    }

    return newPath;
  },

  /**
   * Change language (redirects to the new language URL)
   */
  setLanguage(langCode) {
    if (!this.languages[langCode]) {
      langCode = this.defaultLang;
    }

    // Save preference
    localStorage.setItem('rico-lang', langCode);

    // Redirect to the new language URL
    const newURL = this.getURLForLanguage(langCode);
    window.location.href = newURL;
  },

  /**
   * Render language selector in header
   */
  renderLanguageSelector() {
    const container = document.getElementById('langSelector');
    if (!container) return;

    const current = this.languages[this.currentLang];

    container.innerHTML = `
      <div class="lang-selector">
        <button class="lang-current" id="langToggle" aria-label="Selecionar idioma">
          <span class="lang-flag">${current.flag}</span>
          <span class="lang-code">${current.code.split('-')[0].toUpperCase()}</span>
          <svg class="lang-arrow" viewBox="0 0 24 24" width="12" height="12">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <div class="lang-dropdown" id="langDropdown">
          ${Object.values(this.languages).map(lang => `
            <button class="lang-option ${lang.code === this.currentLang ? 'active' : ''}"
                    data-lang="${lang.code}">
              <span class="lang-flag">${lang.flag}</span>
              <span class="lang-name">${lang.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Add event listeners
    const toggle = document.getElementById('langToggle');
    const dropdown = document.getElementById('langDropdown');

    toggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = btn.getAttribute('data-lang');
        if (lang !== this.currentLang) {
          this.setLanguage(lang);
        }
        dropdown.classList.remove('open');
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown?.classList.remove('open');
    });
  },

  /**
   * Get current language info
   */
  getCurrentLanguage() {
    return this.languages[this.currentLang];
  },

  /**
   * Get saved language preference
   */
  getSavedLanguage() {
    return localStorage.getItem('rico-lang') || this.defaultLang;
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
  I18n.init();
}

// Export for use in other scripts
window.I18n = I18n;
