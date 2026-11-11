/* AlignStix – Service Worker
   Bei jedem Release gemeinsam erhöhen: CACHE_NAME, version.json, FLIP_APP_VERSION in index.html. */
const CACHE_NAME = 'alignstix-v165';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './stickers.webp'];

self.addEventListener('install', event => {
  // Fehlende Einzeldateien (z. B. ein Icon) dürfen die Installation nicht verhindern.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(ASSETS.map(url =>
        fetch(url, { cache: 'reload' }).then(res => res.ok ? cache.put(url, res) : null).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Alles Gleiche-Origin-GET: Netz zuerst (am HTTP-Cache vorbei), offline aus dem Cache.
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  const isPage = request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');
  const key = isPage ? './index.html' : request;
  event.respondWith(
    fetch(request, { cache: 'no-store' })
      .then(res => {
        if (res.ok && !url.pathname.endsWith('/version.json')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(key, copy));
        }
        return res;
      })
      .catch(() => caches.match(key, { ignoreSearch: true }).then(hit => hit || Response.error()))
  );
});
