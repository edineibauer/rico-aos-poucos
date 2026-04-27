/**
 * Page Header — DEPRECATED, vira um shim de site-header.js.
 *
 * Mantido pra compat com páginas legadas que usam:
 *   <header id="page-header" data-subtitle="..."></header>
 *   <script defer src="../js/page-header.js"></script>
 *
 * O site-header.js já reconhece o placeholder #page-header e o atributo
 * data-subtitle. Este script só garante que site-header.js seja carregado
 * caso a página antiga não o tenha incluído.
 */
(function () {
  if (window.SiteHeader || document.getElementById('site-header-loader-injected')) return;

  // Procura por um <script src="...page-header.js"> pra reaproveitar o caminho /js/
  const myScript = document.currentScript
    || [...document.scripts].find(s => /(\/|^)js\/page-header\.js(\?|$)/.test(s.src));
  if (!myScript) return;

  const headerSrc = myScript.src.replace(/page-header\.js([^/]*)$/, 'site-header.js$1');

  // Se o site-header.js já está na página, não faz nada
  const already = [...document.scripts].some(s => /(\/|^)js\/site-header\.js(\?|$)/.test(s.src));
  if (already) return;

  const tag = document.createElement('script');
  tag.id = 'site-header-loader-injected';
  tag.src = headerSrc;
  tag.defer = true;
  document.head.appendChild(tag);
})();
