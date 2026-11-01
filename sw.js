/* BoniVerso 2.0.2 — service worker do PWA com Web Push em segundo plano */
const CACHE = 'boniverso-v210-classroom-forum';
const ASSETS = ['./', './index.html', './styles.css', './nav-icons.css', './turmas-home.css', './boniverso-busca.css', './boniverso-busca.js', './boniverso-avisos.css', './app-updates.css', './app-updates.js', './boniverso-avisos.js', './boniverso-alertas-v200.js', './boniverso-webpush-v201.js', './forum-turmas.html', './boniverso-forum-menu-v210.js', './recibo.html', './app.js', './config.js', './bootstrap.js', './online-app.js', './ai-link.js', './boniverso-ai.html', './turmas-link.js', './turmas-home.js', './turmas.html', './sala.html', './turmas-navegacao.js', './turmas-navegacao.css', './aparecida.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './rafa-boni.jpg', './rafa-boni-cutout.png'];
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
// Uma mensagem recebida em segundo plano deve ser apresentada imediatamente,
// inclusive em iOS, que não permite push invisível em apps web.
self.addEventListener('push', event => {
  let payload={};
  try{payload=event.data?event.data.json():{}}catch{payload={}}
  const title=String(payload.title||'Novo aviso · BoniVerso').slice(0,140);
  const body=String(payload.body||'Há uma novidade para você. Abra o BoniVerso.').slice(0,240);
  const tag=String(payload.tag||'boniverso-push').slice(0,100);
  const appBase=new URL(self.registration.scope);
  let target=new URL('./?avisos=1',appBase);
  try{
    const suggested=new URL(payload.url,appBase);
    if(suggested.origin===appBase.origin&&suggested.pathname.startsWith(appBase.pathname))target=suggested;
  }catch{}
  event.waitUntil(self.registration.showNotification(title,{
    body,icon:'./icon-192.png',badge:'./icon-192.png',tag,
    data:{url:target.href},renotify:false,silent:false
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const fallback = new URL('./?avisos=1',self.registration.scope).href;
  const destination = event.notification.data?.url || fallback;
  const target = new URL(destination, self.registration.scope);
  if (target.origin !== self.location.origin || !target.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if(new URL(client.url).origin===target.origin && new URL(client.url).pathname.startsWith(new URL(self.registration.scope).pathname)){
        if('navigate' in client){try{await client.navigate(target.href)}catch{}}
        return client.focus();
      }
    }
    if(self.clients.openWindow)return self.clients.openWindow(target.href);
  })());
});
