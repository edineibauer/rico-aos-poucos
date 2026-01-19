/**
 * Internationalization (i18n) Module for Rico aos Poucos
 * Simplified version - Portuguese (Brazil) only
 */

const I18n = {
  currentLang: 'pt-BR',
  defaultLang: 'pt-BR',

  init() {
    localStorage.setItem('rico-lang', 'pt-BR');
  },

  getCurrentLanguage() {
    return { code: 'pt-BR', name: 'Português', flag: '🇧🇷' };
  },

  getSavedLanguage() {
    return 'pt-BR';
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
  I18n.init();
}

window.I18n = I18n;
