/**
 * Internationalization (i18n) Module for Rico aos Poucos
 * Supports: pt-BR (default at /), en (at /en/), es (at /es/)
 * Uses URL-based language routing for SEO
 */

const I18n = {
  // Available languages with their URL prefixes
  languages: {
    'pt-BR': { code: 'pt-BR', name: 'Português', flag: '🇧🇷', prefix: '', file: 'pt-br.json' },
    'en': { code: 'en', name: 'English', flag: '🇺🇸', prefix: '/en', file: 'en.json' },
    'es': { code: 'es', name: 'Español', flag: '🇪🇸', prefix: '/es', file: 'es.json' }
  },

  // Default language
  defaultLang: 'pt-BR',

  // Current language (detected from URL)
  currentLang: null,

  /**
   * Initialize the i18n system
   */
  init() {
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

    if (path.startsWith('/en/') || path === '/en') {
      return 'en';
    } else if (path.startsWith('/es/') || path === '/es') {
      return 'es';
    }
    return 'pt-BR';
  },

  /**
   * Check if we need to redirect based on saved language preference
   * Only redirects on first visit to root
   */
  checkRedirect() {
    const savedLang = localStorage.getItem('rico-lang');
    const currentLang = this.detectLanguageFromURL();
    const path = window.location.pathname;

    // Only auto-redirect if user is on root and has a saved preference
    if (path === '/' || path === '/index.html') {
      if (savedLang && savedLang !== 'pt-BR' && savedLang !== currentLang) {
        const langInfo = this.languages[savedLang];
        if (langInfo) {
          window.location.href = langInfo.prefix + '/';
        }
      }
    }
  },

  /**
   * Get the equivalent URL for a different language
   */
  getURLForLanguage(targetLang) {
    const currentLang = this.detectLanguageFromURL();
    const currentPrefix = this.languages[currentLang]?.prefix || '';
    const targetPrefix = this.languages[targetLang]?.prefix || '';

    let path = window.location.pathname;

    // Remove current language prefix
    if (currentPrefix && path.startsWith(currentPrefix)) {
      path = path.substring(currentPrefix.length) || '/';
    }

    // Add target language prefix
    if (targetPrefix) {
      path = targetPrefix + path;
    }

    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    return path;
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
