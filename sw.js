const CACHE='corrida-v105';
const ARQS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQS.map(u=>new Request(u,{cache:'reload'}))))); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin){ // fontes do Google: tenta a rede, guarda cópia, usa cópia offline
    e.respondWith(caches.open(CACHE).then(c=>fetch(e.request).then(r=>{ c.put(e.request,r.clone()); return r; }).catch(()=>c.match(e.request))));
    return;
  }
  // arquivos do jogo: rede primeiro (pega atualizações), cache se estiver offline
  if(e.request.method!=='GET') return;
  e.respondWith(fetch(e.request.url,{cache:'no-cache'}).then(r=>{ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return r; }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
