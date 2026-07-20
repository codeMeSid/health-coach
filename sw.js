/* Health Map service worker — app-shell cache for GitHub Pages */
const CACHE = "health-map-v22";
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./plan-logic.mjs",
  "./program.mjs",
  "./recipes.mjs",
  "./stamp-lottery.mjs",
  "./stamp-packs.mjs",
  "./icons/favicon.ico",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/maskable-512.png",
  "./offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

/**
 * Local same-origin: stale-while-revalidate.
 * Cross-origin (fonts, motion CDN, unsplash, youtube thumbs): network, optional cache.
 */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (isAppShell(req)) {
      event.respondWith(networkFirst(req));
      return;
    }
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Runtime cache for Google Fonts CSS/files + esm.sh motion (offline resilience)
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com" ||
    url.hostname === "esm.sh"
  ) {
    event.respondWith(cacheFirst(req));
  }
});

function isAppShell(req) {
  const path = new URL(req.url).pathname;
  return (
    req.mode === "navigate" ||
    path.endsWith(".html") ||
    path.endsWith(".mjs") ||
    path.endsWith(".webmanifest")
  );
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req, { ignoreSearch: true });
    return cached || caches.match("./offline.html");
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req, { ignoreSearch: true });
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached || caches.match("./offline.html"));

  return cached || network;
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return cached || Response.error();
  }
}
