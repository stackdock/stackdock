/* Stackdock service worker.
   Deliberately minimal: this is a PRIVATE, cookie-authenticated app, so we
   never cache page content (it could outlive a logout). Static assets are
   cache-first; navigations are network-only with a tiny offline fallback. */
const STATIC_CACHE = "stackdock-static-v3";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then((c) =>
    c.addAll(["/static/style.css", "/static/icon-192.png", "/static/work-icon.svg"])));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // static assets: cache-first (same-origin only)
  if (url.origin === location.origin && url.pathname.startsWith("/static/")) {
    e.respondWith(
      caches.match(e.request).then((hit) =>
        hit || fetch(e.request).then((resp) => {
          const copy = resp.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(e.request, copy));
          return resp;
        })));
    return;
  }

  // page navigations: network-only, friendly offline fallback (never cached)
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(
        "<!doctype html><meta name=viewport content='width=device-width'>" +
        "<body style='font-family:system-ui;background:#f6f7f4;color:#1c2420;" +
        "display:grid;place-items:center;height:100vh;margin:0'>" +
        "<div style='text-align:center'><h2>Stackdock is offline</h2>" +
        "<p>Reconnect and pull to refresh.</p></div>",
        { headers: { "Content-Type": "text/html" } })));
  }
  // everything else (audio, feeds, API): untouched
});
