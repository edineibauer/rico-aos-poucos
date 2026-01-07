/**
 * Comments System for Rico aos Poucos
 * Uses Disqus for easy commenting without login requirement
 *
 * SETUP REQUIRED:
 * 1. Create account at https://disqus.com
 * 2. Register your site and get a shortname
 * 3. Update DISQUS_SHORTNAME below with your shortname
 * 4. Enable guest commenting in Disqus admin panel:
 *    Settings > Community > Guest Commenting = ON
 */

const Comments = {
  // CHANGE THIS to your Disqus shortname after registering at disqus.com
  DISQUS_SHORTNAME: 'ricoaospoucos',

  // Get unique identifier for current page
  getPageIdentifier() {
    // Use the filename as identifier for consistency across languages
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    return filename;
  },

  // Get canonical URL for the article
  getPageUrl() {
    // Use canonical link if available, otherwise current URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      return canonical.href;
    }
    return window.location.href;
  },

  // Get page title
  getPageTitle() {
    const titleEl = document.querySelector('h1');
    return titleEl ? titleEl.textContent : document.title;
  },

  // Get translations based on language
  getTranslations() {
    const path = window.location.pathname;

    if (path.includes('/en/')) {
      return {
        title: 'Comments',
        loading: 'Loading comments...',
        enable: 'Please enable JavaScript to view comments.',
        link: 'comments powered by Disqus'
      };
    } else if (path.includes('/es/')) {
      return {
        title: 'Comentarios',
        loading: 'Cargando comentarios...',
        enable: 'Por favor habilite JavaScript para ver los comentarios.',
        link: 'comentarios de Disqus'
      };
    }

    return {
      title: 'Comentários',
      loading: 'Carregando comentários...',
      enable: 'Por favor habilite o JavaScript para ver os comentários.',
      link: 'comentários por Disqus'
    };
  },

  // Render comments section HTML
  render() {
    const t = this.getTranslations();

    return `
      <section class="comments-section">
        <h3 class="comments-title">${t.title}</h3>
        <div id="disqus_thread">
          <div class="comments-loading">
            <span class="comments-spinner"></span>
            <span>${t.loading}</span>
          </div>
        </div>
        <noscript>${t.enable} <a href="https://disqus.com/?ref_noscript">${t.link}</a></noscript>
      </section>
    `;
  },

  // Load Disqus script
  loadDisqus() {
    const pageIdentifier = this.getPageIdentifier();
    const pageUrl = this.getPageUrl();
    const pageTitle = this.getPageTitle();

    // Configure Disqus
    window.disqus_config = function() {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
      this.page.title = pageTitle;
    };

    // Load Disqus embed script
    const d = document;
    const s = d.createElement('script');
    s.src = `https://${this.DISQUS_SHORTNAME}.disqus.com/embed.js`;
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
  },

  // Initialize comments
  init() {
    const container = document.getElementById('comments-container');
    if (!container) return;

    // Render the comments section
    container.innerHTML = this.render();

    // Load Disqus
    this.loadDisqus();
  },

  // Load comment counts for multiple articles
  // Usage: Comments.loadCounts(['article-id-1', 'article-id-2'])
  loadCounts(callback) {
    // Load Disqus count script
    const s = document.createElement('script');
    s.id = 'dsq-count-scr';
    s.src = `https://${this.DISQUS_SHORTNAME}.disqus.com/count.js`;
    s.async = true;

    s.onload = () => {
      if (callback) callback();
    };

    document.body.appendChild(s);
  },

  // Get comment count for a specific article
  // Returns a span element that Disqus will populate
  getCountElement(articleId, href) {
    return `<a href="${href}#disqus_thread" data-disqus-identifier="${articleId}" class="comment-count"></a>`;
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
