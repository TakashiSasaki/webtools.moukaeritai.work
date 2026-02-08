const CACHE_NAME = 'micropython-repl-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './main.js',
  './micropython.mjs',
  './micropython.wasm',
  'https://unpkg.com/@xterm/xterm@5.4.0/css/xterm.css',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@xterm/xterm@5.4.0/lib/xterm.js',
  'https://unpkg.com/@xterm/addon-fit@0.9.0/lib/addon-fit.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return Promise.all(
          PRECACHE_URLS.map(url => {
            const request = new Request(url, { mode: url.startsWith('http') ? 'no-cors' : 'same-origin' });
            return fetch(request).then(response => {
              return cache.put(url, response);
            }).catch(err => {
              console.warn('Failed to precache:', url, err);
            });
          })
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 && response.status !== 0) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});
