/* Chudstack service worker.
   Deliberately minimal: this is a PRIVATE, cookie-authenticated app, so we
   never cache page content (it could outlive a logout). Static assets are
   stale-while-revalidate (instant from cache, refreshed in the background so
   style/JS changes propagate without a hard refresh); navigations are
   network-only with a tiny offline fallback. */
const STATIC_CACHE = "stackdock-static-v20";
const AUDIO_CACHE = "stackdock-audio-v1";   // user's saved episodes — never purge

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then((c) =>
    c.addAll(["/static/icon-192.png", "/offline"])));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // saved offline audio: served ONLY from AUDIO_CACHE under the stable
  // /offline-audio/{slug} key. This lets the shelf stream each episode straight
  // from the cache (audio.src = /offline-audio/{slug}) instead of reading every
  // saved blob into memory at once — which OOM-crashed the page it exists for.
  if (url.origin === location.origin && url.pathname.startsWith("/offline-audio/")) {
    e.respondWith(caches.open(AUDIO_CACHE).then((c) =>
      c.match(e.request).then((hit) => hit ||
        new Response("", { status: 404, statusText: "Not saved offline" }))));
    return;
  }

  // static assets: stale-while-revalidate (same-origin only) so CSS/JS updates
  // reach clients on the next load instead of being pinned forever
  if (url.origin === location.origin && url.pathname.startsWith("/static/")) {
    e.respondWith(caches.open(STATIC_CACHE).then((c) =>
      c.match(e.request).then((hit) => {
        const net = fetch(e.request).then((resp) => {
          if (resp && resp.ok) c.put(e.request, resp.clone());
          return resp;
        }).catch(() => hit || Response.error());
        return hit || net;   // instant from cache, refresh in the background
      })));
    return;
  }

  // page navigations: network-first, but refresh the precached /offline copy
  // whenever we successfully fetch it online (otherwise the precached shelf —
  // including its position-sync JS — would be frozen until STATIC_CACHE bumps).
  if (e.request.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const resp = await fetch(e.request);
        if (resp && resp.ok && url.origin === location.origin && url.pathname === "/offline") {
          (await caches.open(STATIC_CACHE)).put("/offline", resp.clone());
        }
        return resp;
      } catch (err) {
        return (await caches.match("/offline")) || new Response(
          "<!doctype html><meta name=viewport content='width=device-width'>" +
          "<body style='font-family:system-ui;background:#f6f7f4;color:#1c2420;" +
          "display:grid;place-items:center;height:100vh;margin:0'>" +
          "<div style='text-align:center'><h2>Chudstack is offline</h2>" +
          "<p>Reconnect and pull to refresh.</p></div>",
          { headers: { "Content-Type": "text/html" } });
      }
    })());
    return;
  }
  // everything else (streamed audio, feeds, API): untouched
});
