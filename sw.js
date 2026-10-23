// Offline-Cache: Die App lädt beim ersten Besuch alle Dateien und läuft danach ohne Internet.
// Bei jeder Änderung an einer Datei VERSION erhöhen, damit Geräte die neue Fassung holen.
const VERSION = "v19";
const FILES = [
  "./", "index.html", "style.css", "grammar.js", "app.js", "manifest.webmanifest", "vendor/qrcode.js",
  "fonts/bricolage.woff2", "fonts/kalam-400.woff2", "fonts/kalam-700.woff2", "fonts/atkinson-400.woff2", "fonts/atkinson-700.woff2",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "welt/welt.js", "welt/camden.json", "vendor/three.module.min.js", "vendor/OrbitControls.js", "vendor/MapControls.js",
  "welt/fotos/all-saints-cathedral.jpg", "welt/fotos/camden-lock-market.jpg", "welt/fotos/camden-road-station.jpg", "welt/fotos/camden-town-station.jpg", "welt/fotos/credits.json", "welt/fotos/crowndale-centre.jpg", "welt/fotos/dublin-castle.jpg", "welt/fotos/hawley-arms.jpg", "welt/fotos/jewish-museum.jpg", "welt/fotos/koko.jpg", "welt/fotos/mornington-crescent-station.jpg", "welt/fotos/roundhouse.jpg", "welt/fotos/st-michaels-church.jpg", "welt/fotos/stables-market.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request))
  );
});
