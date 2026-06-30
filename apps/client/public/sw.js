const STATIC_CACHE = 'taskflow-static-v3';
const DYNAMIC_CACHE = 'taskflow-dynamic-v3';

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
      return fetch(request)
        .then(function (response) {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          var responseToCache = response.clone();
          caches.open(STATIC_CACHE).then(function (cache) {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(function (err) {
          // SPA Offline Fallback: If offline and requesting a route, return index.html from cache
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw err;
        });
    })
  );
});


// 4. Push – Handle incoming Web Push notification from server
self.addEventListener('push', function (event) {
  var data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'TaskFlow', body: event.data.text() };
    }
  }

  var title = data.title || 'TaskFlow Notification';
  var options = {
    body: data.body || 'You have a new update.',
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag || 'taskflow-notification',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Open TaskFlow' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 5. Notification Click – Navigate to app when notification is clicked
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  var targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If a window is already open, focus it and navigate
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
