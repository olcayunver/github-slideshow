---
layout: null
---

const CACHE_NAME = 'slideshow-v1';
const BASE_URL = '{{ site.baseurl }}';

// Assets to cache
const CACHE_ASSETS = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/node_modules/reveal.js/css/reveal.css`,
  `${BASE_URL}/node_modules/reveal.js/css/reset.css`,
  `${BASE_URL}/node_modules/reveal.js/css/theme/moon.css`,
  `${BASE_URL}/node_modules/reveal.js/lib/css/monokai.css`,
  `${BASE_URL}/node_modules/reveal.js/js/reveal.js`,
  `${BASE_URL}/node_modules/reveal.js/plugin/highlight/highlight.js`,
  `${BASE_URL}/node_modules/reveal.js/plugin/notes/notes.js`
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching core assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .catch(err => {
        console.error('Failed to cache assets:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
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

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }
        
        // Fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache successful responses
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Fallback for offline scenarios
            if (event.request.destination === 'document') {
              return caches.match(`${BASE_URL}/index.html`);
            }
          });
      })
  );
});