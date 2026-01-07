/**
 * Comments Section for Rico aos Poucos
 * Currently directs users to YouTube for discussion
 */

const Comments = {
  // YouTube channel URL
  YOUTUBE_CHANNEL: 'https://www.youtube.com/@ricoaospoucos-edineibauer',

  // Get translations based on language
  getTranslations() {
    const path = window.location.pathname;

    if (path.includes('/en/')) {
      return {
        title: 'Join the Discussion',
        message: 'Have questions or want to share your opinion?',
        cta: 'Comment on YouTube',
        note: 'Join our community on the channel'
      };
    } else if (path.includes('/es/')) {
      return {
        title: 'Únete a la Discusión',
        message: '¿Tienes preguntas o quieres compartir tu opinión?',
        cta: 'Comentar en YouTube',
        note: 'Únete a nuestra comunidad en el canal'
      };
    }

    return {
      title: 'Participe da Discussão',
      message: 'Tem dúvidas ou quer compartilhar sua opinião?',
      cta: 'Comentar no YouTube',
      note: 'Participe da nossa comunidade no canal'
    };
  },

  // Render the discussion section
  render() {
    const t = this.getTranslations();

    return `
      <section class="comments-section">
        <h3 class="comments-title">${t.title}</h3>
        <div class="comments-youtube">
          <p>${t.message}</p>
          <a href="${this.YOUTUBE_CHANNEL}" target="_blank" class="comments-youtube-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            ${t.cta}
          </a>
          <span class="comments-note">${t.note}</span>
        </div>
      </section>
    `;
  },

  // Initialize
  init() {
    const container = document.getElementById('comments-container');
    if (!container) return;

    container.innerHTML = this.render();
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Comments.init());
} else {
  Comments.init();
}

// Export
window.Comments = Comments;
