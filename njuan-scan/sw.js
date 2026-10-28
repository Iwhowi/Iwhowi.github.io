// Njuan Scan: funciona sin conexión
const CACHE = 'njuan-scan-317f76963e';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('njuan-scan-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin === location.origin) {
    if (r.mode === 'navigate') {
      // red primero (versión nueva) con 3 s de margen; si no hay red o falla, la copia guardada
      e.respondWith((async () => {
        try {
          const res = await timeout(fetch(r), 3000);
          if (res.ok) { const cp = res.clone(), cp2 = res.clone(); e.waitUntil(caches.open(CACHE).then(c => Promise.all([c.put('./index.html', cp), c.put('./', cp2)]))); return res; }
          throw new Error('status ' + res.status);
        } catch (err) { return (await caches.match('./index.html')) || Response.error(); }
      })());
      return;
    }
    e.respondWith(caches.match(r).then(m => m || fetch(r)));
  } else if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') e.waitUntil(c.put(r, res.clone())); return res; }))).catch(() => new Response('', { status: 504 })));
  }
});
