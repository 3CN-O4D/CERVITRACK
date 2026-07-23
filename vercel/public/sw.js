const CACHE_NAME = 'cervitrack-v1';
const STATIC_CACHE = 'cervitrack-static-v1';
const API_CACHE = 'cervitrack-api-v1';

const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/globals.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase direct calls (they have auth headers)
  if (url.hostname.includes('supabase')) return;

  // API routes: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, cloned));
        }
        return response;
      });
    })
  );
});
