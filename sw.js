const CACHE='impacto-rebelde-v11-detail';
const FILES=['./','./index.html','./style.css','./style.css?v=detail11','./game.js','./game.js?v=detail11','./engine.js','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('impacto-rebelde-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(event.request);
   if(response.ok){event.waitUntil(cache.put(event.request,response.clone()));return response;}
   return await cache.match(event.request)||response;
  }catch{
   return await cache.match(event.request)||(event.request.mode==='navigate'?await cache.match('./index.html'):null)||Response.error();
  }
 })());
});
