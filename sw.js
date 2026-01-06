const CACHE_NAME = 'rico-aos-poucos-v5';

// Páginas principais para cache (excluindo artigos individuais)
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/i18n.js',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
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
  './es/sobre/index.html',
  // Dados
  './data/artigos.json',
  './data/artigos-en.json',
  './data/artigos-es.json',
  // Página offline
  './offline.html'
];

// Instalar Service Worker e cachear recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Erro ao cachear:', error);
      })
  );
});

// Ativar e limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Verificar se é uma página de artigo individual
function isArticlePage(url) {
  const path = new URL(url).pathname;
  return (path.includes('/artigos/') || path.includes('/en/artigos/') || path.includes('/es/artigos/'))
    && !path.endsWith('/index.html')
    && !path.endsWith('/artigos/')
    && !path.endsWith('/artigos');
}

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Se está no cache, retornar
        if (cachedResponse) {
          return cachedResponse;
        }

        // Tentar buscar da rede
        return fetch(request)
          .then((networkResponse) => {
            // Verificar resposta válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Cachear resposta (exceto artigos individuais)
            if (!isArticlePage(request.url)) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, responseToCache));
            }

            return networkResponse;
          })
          .catch(() => {
            // Offline - retornar fallback apropriado
            if (request.destination === 'document') {
              // Se é artigo individual, mostrar página offline
              if (isArticlePage(request.url)) {
                return caches.match('./offline.html');
              }
              // Para outras páginas, tentar index.html
              return caches.match('./index.html');
            }
          });
      })
  );
});
