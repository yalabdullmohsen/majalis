/** PWA shell — network-first; never serve stale JS/CSS after deploy. */
const CACHE_NAME = "majalis-shell-v6";
const FETCH_TIMEOUT_MS = 8000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(["/"]))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

function fetchWithTimeout(request, ms = FETCH_TIMEOUT_MS) {
  return Promise.race([
    fetch(request, { cache: "no-store" }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("sw_fetch_timeout")), ms)),
  ]);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache-first hashed bundles — stale chunks break lazy routes after deploy.
  if (url.pathname.startsWith("/assets/") || url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    event.respondWith(
      fetchWithTimeout(req).catch(() => caches.match(req)),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetchWithTimeout(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match("/")),
    );
  }
});
