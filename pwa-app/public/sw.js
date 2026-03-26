// Service Worker for PWA
const CACHE_NAME = 'my-pwa-v5';

// Only cache our own domain files
const urlsToCache = [
  '/ticketing/',
  '/ticketing/manifest.json',
  '/ticketing/icon-192.png',
  '/ticketing/icon-512.png'
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.log(`[SW] Skipping ${url}:`, err.message);
            });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Fetch event - only handle requests from our domain
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ignore requests from extensions, chrome://, etc.
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Ignore requests not from our domain
  if (!url.hostname.includes('funnyguy26062018.github.io') && url.hostname !== 'localhost') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses from our domain
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone).catch(err => {
              // Silently fail - likely extension request
            });
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});