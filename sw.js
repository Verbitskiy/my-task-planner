const CACHE_NAME="task-planner-cache-v1";
const ASSETS=["/","/index.html","/style.css","/app.js","/db.js","/manifest.json","/assets/icons/icon-192.png"];

self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>key!==CACHE_NAME && caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch",e=>{ e.respondWith(caches.match(e.request).then(res=>res||fetch(e.request))); });

// --- Notification click ---
self.addEventListener("notificationclick",function(e){
  e.notification.close();
  if(e.action==="done"){
    clients.matchAll({type:"window"}).then(clientsArr=>{
      if(clientsArr.length>0){
        clientsArr[0].postMessage({action:"markDone",tag:e.notification.tag});
      }
    });
  }
});
