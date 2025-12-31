const CACHE_NAME = 'pyodide-repl-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './main.js',
  './worker.js',
  './pyodide/pyodide.mjs',
  './pyodide/pyodide.asm.js',
  './pyodide/pyodide.asm.wasm',
  './pyodide/python_stdlib.zip',
  './pyodide/pyodide-lock.json',
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
        return cache.addAll(PRECACHE_URLS);
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
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests that are not in our precache list if we want to be strict,
  // but for now, we'll try to cache everything GET.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 && response.status !== 0) {
            return response;
          }

          // Clone the response
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
