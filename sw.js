// Hisab service worker.
// Online: loads the newest version from the internet and saves a copy.
// Offline: uses the saved copy. Your data (expenses etc.) is never touched by updates.
// Change the version below whenever you upload a new index.html.
var CACHE = "hisab-v3";
var FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var isPage = req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  if (isPage) {
    // network first, fall back to saved copy when offline
    e.respondWith(fetch(req, { cache: "no-store" }).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put("./index.html", copy); });
      return res;
    }).catch(function () {
      return caches.match("./index.html");
    }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    });
  }));
});
