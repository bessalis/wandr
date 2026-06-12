const CACHE = 'wandr-v3';
const ASSETS = [
  '/wandr/',
  '/wandr/index.html',
  '/wandr/manifest.json',
  '/wandr/icons/icon-192.png',
  '/wandr/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.10.0/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.10.0/dist/fonts/tabler-icons.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting()) // Aktivera ny SW direkt
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // Ta över alla öppna flikar direkt
  );
});

self.addEventListener('fetch', e => {
  // Network-first för HTML — hämtar alltid senaste versionen om online
  if (e.request.url.endsWith('.html') || e.request.url.endsWith('/wandr/')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first för allt annat (ikoner, CSS, fonter)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      });
    })
  );
});
