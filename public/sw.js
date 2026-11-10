// NBC ESS service worker.
//
// Caches only what is safe to share between everyone who uses a device: the hashed build assets
// under /_next/static/, the app icons, the manifest and the offline page. Everything else (pages,
// React Server Component payloads, API calls, media) always goes to the network and is never
// stored, so no personal data can end up in Cache Storage.
//
// Bump CACHE_NAME whenever these rules or the precached files change: activate deletes every
// other cache, and that is the only way to invalidate what installed apps hold. Sign-out
// (AuthContext.logout) also wipes Cache Storage.

const CACHE_NAME = 'nbc-ess-v3';
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [OFFLINE_URL, '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

// Activate: drop every older cache (v2 cached pages and RSC payloads), then take control.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function isCacheable(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (request.headers.has('RSC')) return false; // React Server Component payloads: never cache
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === OFFLINE_URL
  );
}

// The offline page is precached, but sign-out wipes Cache Storage; put it back when online.
function ensureOfflinePage() {
  return caches
    .open(CACHE_NAME)
    .then((cache) => cache.match(OFFLINE_URL).then((hit) => hit || cache.add(OFFLINE_URL)))
    .catch(() => {});
}

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Navigations: always the network (HTML is never cached); the offline page if that fails.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          ensureOfflinePage();
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error()))
    );
    return;
  }

  // Not on the allow-list (RSC, API, media, other origins): the browser handles it, uncached.
  if (!isCacheable(request, url)) return;

  // Static assets: cache first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
