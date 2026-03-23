// Service Worker for PWA - Development Friendly
const CACHE_NAME = 'my-pwa-v3';

// Only cache these specific files
const urlsToCache = [
  '/ticketing/',
  '/ticketing/manifest.json',
  '/ticketing/icon-192.png',
  '/ticketing/icon-512.png',
  '/ticketing/css/bootstrap.min.css',
  '/ticketing/css/bootstrap-icons.min.css',
  '/ticketing/fonts/bootstrap-icons.woff2',
  '/ticketing/fonts/bootstrap-icons.woff'
];

// Skip waiting and claim clients immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache what we can, but don't fail if something doesn't exist
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.log(`[SW] Failed to cache ${url}:`, err);
            });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// For development: always try network first
self.addEventListener('fetch', event => {
  // Skip caching for API routes during development
  if (event.request.url.includes('/api/') || event.request.url.includes('/my-site/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});

// Activate and clean old caches
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