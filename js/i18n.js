/**
 * Internationalization (i18n) Module for Rico aos Poucos
 * Supports: pt-BR (default), en, es
 */

const I18n = {
  // Available languages
  languages: {
    'pt-BR': { code: 'pt-BR', name: 'Português', flag: '🇧🇷', file: 'pt-br.json' },
    'en': { code: 'en', name: 'English', flag: '🇺🇸', file: 'en.json' },
    'es': { code: 'es', name: 'Español', flag: '🇪🇸', file: 'es.json' }
  },

  // Default language
  defaultLang: 'pt-BR',

  // Current language
  currentLang: null,

  // Loaded translations
  translations: {},

  // Base path for language files
  basePath: '',

  /**
   * Initialize the i18n system
   */
  async init() {
    // Detect base path (relative to current page)
    this.basePath = this.detectBasePath();

    // Get saved language or detect from browser
    const savedLang = localStorage.getItem('rico-lang');
    const browserLang = navigator.language;

    let lang = savedLang;
    if (!lang) {
      // Try to match browser language
      if (browserLang.startsWith('pt')) lang = 'pt-BR';
      else if (browserLang.startsWith('es')) lang = 'es';
      else if (browserLang.startsWith('en')) lang = 'en';
      else lang = this.defaultLang;
    }

    await this.setLanguage(lang);
    this.renderLanguageSelector();
  },

  /**
   * Detect base path relative to language folder
   */
  detectBasePath() {
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length - 1;

    // Handle different page depths
    if (path === '/' || path.endsWith('/index.html') && depth <= 1) {
      return './';
    }

    // Count directory depth and go up
    let basePath = '';
    for (let i = 0; i < depth; i++) {
      basePath += '../';
    }
    return basePath || './';
  },

  /**
   * Load language file
   */
  async loadLanguage(langCode) {
    const langInfo = this.languages[langCode];
    if (!langInfo) {
      console.warn(`Language ${langCode} not supported, falling back to default`);
      return this.loadLanguage(this.defaultLang);
    }

    try {
      const response = await fetch(`${this.basePath}lang/${langInfo.file}`);
      if (!response.ok) throw new Error(`Failed to load ${langInfo.file}`);
      return await response.json();
    } catch (error) {
      console.error('Error loading language file:', error);
      if (langCode !== this.defaultLang) {
        return this.loadLanguage(this.defaultLang);
      }
      return {};
    }
  },

  /**
   * Set current language
   */
  async setLanguage(langCode) {
    if (!this.languages[langCode]) {
      langCode = this.defaultLang;
    }

    this.translations = await this.loadLanguage(langCode);
    this.currentLang = langCode;
    localStorage.setItem('rico-lang', langCode);

    // Update HTML lang attribute
    document.documentElement.lang = langCode;

    // Translate page
    this.translatePage();

    // Update selector if exists
    this.updateSelectorDisplay();

    // Dispatch event for custom handlers
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: langCode } }));
  },

  /**
   * Get translation by key path
   * Example: t('home.expectations') returns "Expectativas do Canal"
   */
  t(keyPath, replacements = {}) {
    const keys = keyPath.split('.');
    let value = this.translations;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        console.warn(`Translation not found: ${keyPath}`);
        return keyPath;
      }
    }

    // Handle replacements like {sector}
    if (typeof value === 'string') {
      Object.keys(replacements).forEach(key => {
        value = value.replace(`{${key}}`, replacements[key]);
      });
    }

    return value;
  },

  /**
   * Translate all elements with data-i18n attribute
   */
  translatePage() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation !== key) {
        el.textContent = translation;
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation !== key) {
        el.placeholder = translation;
      }
    });

    // Translate titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translation = this.t(key);
      if (translation !== key) {
        el.title = translation;
      }
    });

    // Translate aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const translation = this.t(key);
      if (translation !== key) {
        el.setAttribute('aria-label', translation);
      }
    });
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

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = btn.getAttribute('data-lang');
        this.setLanguage(lang);
        dropdown.classList.remove('open');
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
    });
  },

  /**
   * Update selector display after language change
   */
  updateSelectorDisplay() {
    const toggle = document.getElementById('langToggle');
    if (!toggle) return;

    const current = this.languages[this.currentLang];
    toggle.innerHTML = `
      <span class="lang-flag">${current.flag}</span>
      <span class="lang-code">${current.code.split('-')[0].toUpperCase()}</span>
      <svg class="lang-arrow" viewBox="0 0 24 24" width="12" height="12">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;

    // Update active state in dropdown
    document.querySelectorAll('.lang-option').forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      btn.classList.toggle('active', lang === this.currentLang);
    });
  },

  /**
   * Get current language info
   */
  getCurrentLanguage() {
    return this.languages[this.currentLang];
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
