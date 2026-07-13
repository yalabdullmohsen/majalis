/** PWA service worker v17 — network-first for app shell, cache-first for static Quran/lesson data. */

const SHELL_CACHE   = "majalis-shell-v17";
const DATA_CACHE    = "majalis-data-v17";
const VERSION_CACHE = "majalis-version";
const FETCH_TIMEOUT = 8000;

// External API routes served cache-first (Quran API data, prayer times)
const DATA_FIRST_ORIGINS = [
  "api.alquran.cloud",
  "api.aladhan.com",
];

// Internal API routes to cache for offline use
const CACHEABLE_API_PATHS = [
  "/api/lessons",
  "/api/fawaid",
  "/api/prayer",
  "/api/adhkar",
  "/api/quiz",
  "/api/library",
];

const SHELL_ROUTES = [
  "/",
  "/offline.html",
  "/start-here",
  "/adhkar",
  "/prayer-times",
  "/tasbih",
  "/daily-wird",
  "/sunan-yawmiyya",
  "/quran",
  "/fawaid",
  "/duas",
  "/asma-husna",
  "/lessons",
  "/library",
  "/scholars",
  "/quiz",
  "/fatwa",
  "/islamic-glossary",
  "/hadith-science",
  "/stories",
  "/fiqh",
  "/tajweed",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ROUTES).catch(() => cache.addAll(["/", "/offline.html"])))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // كشف هل هذا تحديث أم تثبيت أول
      const verCache = await caches.open(VERSION_CACHE);
      const prev = await verCache.match("/sw-version");
      const prevVersion = prev ? await prev.text() : null;
      const isUpdate = prevVersion !== null && prevVersion !== SHELL_CACHE;

      // حذف الكاشات القديمة
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE && k !== VERSION_CACHE)
          .map((k) => caches.delete(k)),
      );

      // تخزين النسخة الحالية
      await verCache.put("/sw-version", new Response(SHELL_CACHE));

      // السيطرة على كل النوافذ
      await self.clients.claim();

      // عند التحديث: إعادة تحميل كل النوافذ المفتوحة
      if (isUpdate) {
        const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        allClients.forEach((client) => {
          client.navigate(client.url).catch(() => undefined);
        });
      }
    })(),
  );
});

function fetchWithTimeout(req, ms = FETCH_TIMEOUT) {
  return Promise.race([
    fetch(req),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("sw_timeout")), ms),
    ),
  ]);
}

/** Cache-first: try cache, fall back to network and update cache. */
async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone()).catch(() => undefined);
    }
    return res;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/** Network-first: try network, fall back to cache. */
async function networkFirst(req, cacheName) {
  try {
    const res = await fetchWithTimeout(req);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone()).catch(() => undefined);
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    return (await caches.match("/offline.html")) || caches.match("/");
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // External Quran/prayer APIs → cache-first (data rarely changes mid-day)
  if (DATA_FIRST_ORIGINS.some((h) => url.hostname.includes(h))) {
    event.respondWith(cacheFirst(req, DATA_CACHE));
    return;
  }

  // Only handle same-origin from here
  if (url.origin !== self.location.origin) return;

  // Hashed JS/CSS bundles: always network (stale chunks break lazy routes)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      fetchWithTimeout(req).catch(() => caches.match(req) || Promise.reject()),
    );
    return;
  }

  // Internal API data (lessons, fawaid, prayer) → cache-first for offline
  if (CACHEABLE_API_PATHS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(cacheFirst(req, DATA_CACHE));
    return;
  }

  // App shell navigation → network-first with shell fallback
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, SHELL_CACHE));
    return;
  }
});

// ── Adhan Background Scheduling ──────────────────────────────────────────
// Main thread posts { type: 'SCHEDULE_ADHAN', prayerName, prayerArabic, delayMs }
// SW holds a setTimeout so the notification fires even when the tab is in background.

const _adhanTimers = new Map(); // prayerKey → timeoutId (keeps SW alive via waitUntil)

self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || msg.type !== "SCHEDULE_ADHAN") return;

  const { prayerKey, prayerArabic, delayMs, fireAt } = msg;
  if (typeof delayMs !== "number" || delayMs < 0) return;

  // Cancel any existing timer for this prayer
  if (_adhanTimers.has(prayerKey)) {
    clearTimeout(_adhanTimers.get(prayerKey));
  }

  const STALE_TOLERANCE_MS = 2 * 60000; // لا تُظهر إشعاراً لأذانٍ فات وقته (نوم/خلفية)

  const promise = new Promise((resolve) => {
    const tid = setTimeout(() => {
      _adhanTimers.delete(prayerKey);
      // مؤقّت متأخّر: تجاهل الإشعار إن فات وقته بأكثر من المسموح
      if (typeof fireAt === "number" && Date.now() - fireAt > STALE_TOLERANCE_MS) {
        resolve();
        return;
      }
      self.registration.showNotification(`🕌 حان وقت ${prayerArabic}`, {
        body: "حيَّ على الصلاة، حيَّ على الفلاح",
        icon: "/logo.png?v=9",
        badge: "/favicon.png?v=9",
        dir: "rtl",
        lang: "ar",
        tag: `adhan-${prayerKey}`,
        renotify: true,
        data: { url: "/prayer-times" },
      }).then(resolve).catch(resolve);
    }, Math.min(delayMs, 86_400_000)); // cap at 24 h

    _adhanTimers.set(prayerKey, tid);
  });

  event.waitUntil(promise);
});

// ── Push Notifications ────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: "المجلس العلمي", body: event.data.text() }; }

  const title = payload.title || "المجلس العلمي";
  const options = {
    body: payload.body || "",
    icon: "/logo.png?v=9",
    badge: "/favicon.png?v=9",
    dir: "rtl",
    lang: "ar",
    data: { url: payload.url || "/" },
    tag: payload.tag || "majalis-notification",
    renotify: !!payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      const match = all.find((c) => c.url === target && "focus" in c);
      if (match) return match.focus();
      return clients.openWindow(target);
    }),
  );
});
