/* Taj Gifts service worker — app shell caching + offline fallback */
const CACHE = "tajgifts-v3";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // Account, checkout, order and admin responses can contain customer or owner
  // data. Never put them in the browser Cache API: cache keys do not include
  // cookies, so doing so could expose a prior user's page on a shared device.
  const privateNavigation = [
    "/account", "/checkout", "/order/", "/admin", "/login", "/signup", "/forgot", "/reset", "/auth/",
    "/app/account", "/app/checkout", "/app/order/",
  ].some((path) => url.pathname === path || url.pathname.startsWith(path));

  // Public navigations are network-first and may use a cached public shell only
  // when offline. Respect server no-store instructions and never cache errors.
  if (e.request.mode === "navigate") {
    if (privateNavigation) {
      e.respondWith(fetch(e.request));
      return;
    }
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const noStore = /no-store/i.test(r.headers.get("Cache-Control") || "");
          if (r.ok && !noStore) {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return r;
        })
        .catch(() => caches.match(e.request).then((m) => m || caches.match("/app")))
    );
    return;
  }

  // static assets: cache-first with background refresh
  if (/\.(png|jpe?g|svg|webp|css|js|woff2?)$/i.test(url.pathname) || url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(e.request).then(
        (m) =>
          m ||
          fetch(e.request).then((r) => {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return r;
          })
      )
    );
  }
});
