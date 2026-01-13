const APP_VERSION = '3.8';
const CACHE_NAME = `rico-aos-poucos-v${APP_VERSION}`;

// Recursos críticos - cacheados na instalação (mínimo para funcionar)
const CRITICAL_ASSETS = [
  './css/style.css',
  './css/comparador.css',
  './js/app.js',
  './js/i18n.js',
  './js/comparador.js',
  './js/comparador-ui.js',
  './js/page-header.js',
  './data/historico-mensal.json',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './offline.html'
];

// Páginas para cache em background (após carregamento)
const PAGES_TO_CACHE = [
  './',
  './index.html',
  './setores/index.html',
  './artigos/index.html',
  './desempenho/index.html',
  './sobre/index.html',
  './ferramentas-financeiras/index.html',
  './en/index.html',
  './en/setores/index.html',
  './en/artigos/index.html',
  './en/desempenho/index.html',
  './en/sobre/index.html',
  './es/index.html',
  './es/setores/index.html',
  './es/artigos/index.html',
  './es/desempenho/index.html',
  './es/sobre/index.html'
];

// Instalar - apenas recursos críticos (rápido)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Ativar - limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('rico-aos-poucos') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Verificar se é artigo individual (não cachear)
function isArticlePage(url) {
  const path = new URL(url).pathname;
  if (!path.includes('/artigos/')) return false;
  if (path.endsWith('/index.html') || path.endsWith('/artigos/') || path.endsWith('/artigos')) return false;
  return path.includes('.html');
}

// Verificar se é página cacheável
function isCacheablePage(url) {
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const basePath = self.location.pathname.replace('sw.js', '');

  return PAGES_TO_CACHE.some((item) => {
    const itemPath = item.replace('./', basePath);
    const normalizedItem = itemPath.replace(/\/$/, '/index.html');
    const normalizedPath = path.replace(/\/$/, '/index.html');
    return normalizedPath === normalizedItem ||
           path === itemPath ||
           path === itemPath.replace('/index.html', '/') ||
           path === itemPath.replace('/index.html', '');
  });
}

// Verificar se é asset crítico
function isCriticalAsset(url) {
  const path = new URL(url).pathname;
  return CRITICAL_ASSETS.some((asset) => path.endsWith(asset.replace('./', '/')));
}

// Estratégia de fetch
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignorar não-GET e requisições especiais
  if (request.method !== 'GET') return;
  if (request.url.startsWith('chrome-extension://')) return;
  if (!request.url.startsWith('http')) return;

  // Artigos individuais: sempre rede, fallback offline
  if (isArticlePage(request.url)) {
    event.respondWith(
      fetch(request).catch(() => caches.match('./offline.html'))
    );
    return;
  }

  // Assets críticos (CSS, JS, icons): cache-first
  if (isCriticalAsset(request.url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Páginas: network-first (conteúdo fresco), fallback cache
  if (request.destination === 'document' || isCacheablePage(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && isCacheablePage(request.url)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match('./offline.html');
          });
        })
    );
    return;
  }

  // Outros recursos: network-only
  event.respondWith(fetch(request).catch(() => {}));
});

// Mensagem para cache em background
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_PAGES') {
    event.waitUntil(cacheAllPages());
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});

// Cachear todas as páginas em background
async function cacheAllPages() {
  const cache = await caches.open(CACHE_NAME);
  const basePath = self.location.pathname.replace('sw.js', '');

  for (const page of PAGES_TO_CACHE) {
    const url = page.replace('./', basePath);
    try {
      // Verificar se já está em cache
      const cached = await cache.match(url);
      if (!cached) {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      }
    } catch (e) {
      // Ignorar erros de páginas individuais
    }
  }
}
