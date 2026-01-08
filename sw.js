const CACHE_NAME = "task-planner-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/db.js",
  "/manifest.json",
  "/assets/icons/icon-192.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  if (e.action === "done") {
    // Тут можна додати логіку виконання задачі прямо з пуша
  }
  e.waitUntil(clients.openWindow("/"));
});
