/* BoniVerso — atualize o identificador CACHE a cada nova versão publicada. */
const CACHE = 'boniverso-v112-rooms-search-sidebar';
const ASSETS = ['./', './index.html', './styles.css', './nav-icons.css', './turmas-home.css', './boniverso-busca.css', './boniverso-busca.js', './boniverso-avisos.css', './app-updates.css', './app-updates.js', './boniverso-avisos.js', './recibo.html', './app.js', './config.js', './bootstrap.js', './online-app.js', './ai-link.js', './boniverso-ai.html', './turmas-link.js', './turmas-home.js', './turmas.html', './sala.html', './turmas-navegacao.js', './turmas-navegacao.css', './aparecida.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './rafa-boni.jpg', './rafa-boni-cutout.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('boniverso-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const dynamic = /\.(?:html|js|css)$/.test(new URL(event.request.url).pathname) || new URL(event.request.url).pathname.endsWith('/');
  if (dynamic) {
    event.respondWith(fetch(event.request).then(r => {
      if (r.ok) caches.open(CACHE).then(c => c.put(event.request, r.clone()));
      return r;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone));
    }
    return response;
  })));
});
