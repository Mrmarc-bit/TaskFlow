const STATIC_CACHE = 'taskflow-static-v2';
const DYNAMIC_CACHE = 'taskflow-dynamic-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json',
];

// 1. Install – pre-cache app shell
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate – clear old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch – Network-first for API, Cache-first for static assets
self.addEventListener('fetch', function (event) {
  var request = event.request;

  // Only handle GET requests over http/https — ignore chrome-extension://, data:, etc.
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) return;

  var url = new URL(request.url);

  // Network-first strategy for API calls
  var isApi = url.pathname.includes('/auth') ||
    url.pathname.includes('/tasks') ||
    url.pathname.includes('/analytics') ||
    url.pathname.includes('/categories') ||
    url.pathname.includes('/tags') ||
    url.pathname.includes('/notifications');

  if (isApi) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          if (!response || response.status !== 200) {
            return response;
          }
          var responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then(function (cache) {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (cachedResponse) {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({
                status: 'error',
                message: 'You are currently offline. Cache for this endpoint is unavailable.',
              }),
              { headers: { 'Content-Type': 'application/json' }, status: 503 }
            );
          });
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then(function (response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        var responseToCache = response.clone();
        caches.open(STATIC_CACHE).then(function (cache) {
          cache.put(request, responseToCache);
        });
        return response;
      });
    })
  );
});
