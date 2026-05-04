const CACHE='sportgrade-v3';
const CORE=[
  '/Sportgrades/client/pe-grading-app.html',
  '/Sportgrades/client/login.html',
  '/Sportgrades/client/standards.json',
  '/Sportgrades/client/manifest.json',
  '/Sportgrades/client/assets/icon-192.png',
  '/Sportgrades/client/assets/icon-512.png',
];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>Promise.allSettled(CORE.map(u=>c.add(u))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.url.includes('supabase'))return; // אל תיירט קריאות API
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return; // רק same-origin
  e.respondWith(
    fetch(e.request)
      .then(res=>{
        if(res.ok){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      })
      .catch(()=>caches.match(e.request))
  );
});
