// ═══════════════════════════════════════════════
//  Gyan Ranjan Portfolio — Service Worker
//  PWA: Offline-first caching strategy
// ═══════════════════════════════════════════════

const CACHE_NAME = 'gyan-ranjan-portfolio-v1';
const OFFLINE_URL = './index.html';

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  // Photos
  './img_graduation.jpg',
  './img_convocation_award.jpg',
  './img_fire_gear.jpg',
  './img_formal_award.jpg',
  './img_parade_commander.jpg',
  './img_hindalco_cert.jpg',
  './img_team_kudos.jpg',
  './img_kudos_official.jpg',
  './img_nfsc_award.jpg',
  './img_nfsc_batch.jpg',
  './img_ashok_leyland.jpg',
  // Fonts (Google Fonts are fetched via CDN — cached on first load)
];

// ── INSTALL: pre-cache core assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean up old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Cache-first for assets, Network-first for HTML ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // HTML pages → Network first, fallback to cache
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // All other assets (CSS, JS, images) → Cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
