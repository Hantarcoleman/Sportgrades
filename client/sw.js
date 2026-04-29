const CACHE = 'sportgrade-v1';
const CORE = [
  '/Sportgrades/client/pe-grading-app.html',
  '/Sportgrades/client/manifest.json',
  '/Sportgrades/client/assets/icon-192.png',
  '/Sportgrades/client/assets/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for API calls (Supabase), cache-first for static assets
  if (e.request.url.includes('supabase')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
