/* Dormon Doors — offline service worker (zakaz daftari + xarajatlar) */
const CACHE = 'dormon-doors-v4-3';
const ASSETS = [
  './',
  './index.html',
  './xarajat.html',
  './manifest.json',
  './icon-180.png',
  './icon-512.png',
  './icon-xarajat-180.png',
  './icon-xarajat-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(ASSETS.map(u => cache.add(u)))
    ).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      if (cached) {
        fetch(e.request).then(resp => {
          if (resp && resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp));
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then(resp => {
        if (resp && resp.ok && (e.request.url.startsWith(self.location.origin) || e.request.url.includes('cdnjs.cloudflare.com'))) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
