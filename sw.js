const CACHE_NAME = 'rico-aos-poucos-v6';

// Lista fixa de recursos para cache (apenas estes serão cacheados)
const STATIC_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/i18n.js',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './offline.html',
  // Páginas PT-BR
  './setores/index.html',
  './artigos/index.html',
  './desempenho/index.html',
  './sobre/index.html',
  // Páginas EN
  './en/index.html',
  './en/setores/index.html',
  './en/artigos/index.html',
  './en/desempenho/index.html',
  './en/sobre/index.html',
  // Páginas ES
  './es/index.html',
  './es/setores/index.html',
  './es/artigos/index.html',
  './es/desempenho/index.html',
  './es/sobre/index.html'
];

// Instalar e cachear recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Ativar e limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Verificar se URL está na lista de cache
function isInStaticCache(url) {
  const urlPath = new URL(url).pathname;
  const basePath = self.location.pathname.replace('sw.js', '');

  return STATIC_CACHE.some((item) => {
    const itemPath = item.replace('./', basePath).replace(/\/$/, '/index.html');
    return urlPath === itemPath || urlPath === itemPath.replace('/index.html', '/') || urlPath === itemPath.replace('/index.html', '');
  });
}

// Verificar se é artigo individual (não cachear)
function isArticlePage(url) {
  const path = new URL(url).pathname;
  // Artigo individual: contém /artigos/ mas NÃO termina em index.html ou /
  if (!path.includes('/artigos/')) return false;
  if (path.endsWith('/index.html') || path.endsWith('/artigos/') || path.endsWith('/artigos')) return false;
  return path.includes('.html');
}

// Estratégia: Cache-first para recursos estáticos, Network-only para artigos
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignorar não-GET e requisições de extensões/chrome
  if (request.method !== 'GET') return;
  if (request.url.startsWith('chrome-extension://')) return;
  if (!request.url.startsWith('http')) return;

  // Artigos individuais: sempre da rede, fallback para offline.html
  if (isArticlePage(request.url)) {
    event.respondWith(
      fetch(request).catch(() => caches.match('./offline.html'))
    );
    return;
  }

  // Recursos estáticos: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      // Não está no cache, buscar da rede
      return fetch(request).then((response) => {
        // Não cachear dinamicamente - apenas recursos pré-definidos
        return response;
      }).catch(() => {
        // Offline e não está no cache
        if (request.destination === 'document') {
          return caches.match('./offline.html');
        }
      });
    })
  );
});
