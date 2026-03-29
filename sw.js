// Service Worker for PWA
  const CACHE_NAME = "my-pwa-v5";

  // Only cache our own domain files
  const urlsToCache = ["/manifest.json","/index.html","/file.svg","/repair-tools.png"];

  // Install event - cache files
  self.oninstall = (event) => {
    event.waitUntil(cacheURLs());
  };
  async function cacheURLs()
  {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache);
  }

  // Activate event
  self.onactivate = (event) => {
    event.waitUntil(deleteOldCachedFiles());
  };
  async function deleteOldCachedFiles()
  {
    const cacheNames = await caches.keys();
    const oldCacheNames = cacheNames.filter(cacheName => cacheName !== CACHE_NAME) // old caches
    oldCacheNames.forEach(cacheName => caches.delete(cacheName))     // delete them  
  }