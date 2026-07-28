/**
 * PWA service worker — network-only for navigations, cache-first for selected data.
 *
 * Cache-name versioning: SHELL_CACHE/DATA_CACHE used to be a hand-bumped
 * literal ("v18") — easy to forget when touching this file, which silently
 * leaves returning PWA users on stale cached data after a deploy. They now
 * derive from SW_BUILD_ID, loaded from /sw-version.js — a tiny file written
 * at build time by scripts/generate-version.mjs from the real deploy commit
 * (same commit as /version.json). Every real deploy now gets fresh cache
 * names automatically; no manual bump required. If /sw-version.js is
 * missing for any reason (e.g. a build that skipped the version step), we
 * fall back to a static id so the SW still installs — caches just won't
 * rotate for that one deploy.
 */
let SW_BUILD_ID = "unversioned";
try {
  importScripts("/sw-version.js");
  if (typeof self.SW_BUILD_ID === "string" && self.SW_BUILD_ID) {
    SW_BUILD_ID = self.SW_BUILD_ID;
  }
} catch {
  // /sw-version.js missing or failed to load — keep the fallback above.
}

const OFFLINE_CACHE = `majalis-offline-${SW_BUILD_ID}`;
const DATA_CACHE    = `majalis-data-${SW_BUILD_ID}`;
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

const STATIC_SHELL_ASSETS = [
  "/offline.html",
  "/logo.png",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/star-pattern.svg",
  "/site.webmanifest",
  "/manifest.webmanifest",
  "/opengraph.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    // Never pre-cache /, index.html, or route documents. A cached document can
    // pin a returning PWA to the hashed assets of an older deployment.
    caches.open(OFFLINE_CACHE)
      .then((cache) =>
        Promise.all(
          STATIC_SHELL_ASSETS.map((url) =>
            cache.add(url).catch(() => undefined),
          ),
        ),
      )
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
      const isUpdate = prevVersion !== null && prevVersion !== SW_BUILD_ID;

      // حذف الكاشات القديمة
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== OFFLINE_CACHE && k !== DATA_CACHE && k !== VERSION_CACHE)
          .map((k) => caches.delete(k)),
      );

      // تخزين النسخة الحالية
      await verCache.put("/sw-version", new Response(SW_BUILD_ID));

      // السيطرة على كل النوافذ
      await self.clients.claim();

      // ملاحظة: كانت هذه الكتلة تُعيد تحميل كل النوافذ المفتوحة تلقائيًا
      // عند أي تحديث. كانت خاملة عمليًا طالما SHELL_CACHE مرقَّم يدويًا
      // (v18) نادر التغيّر — الآن بعد ربطه بمعرّف كل نشر فعلي (commit)،
      // كانت ستُصبح نشطة على كل نشر تقريبًا (وتيرة نشر عالية جدًا)، فتُقاطع
      // المستخدمين قسرًا أثناء الاستخدام. أُزيلت لصالح شريط "تحديث متاح"
      // الجديد (اختياري، بضغطة المستخدم فقط) — راجع UpdateAvailableBanner.
      void isUpdate;
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
    if (res.ok && shouldCacheResponse(req, res)) {
      const cache = await caches.open(cacheName);
      await enforceDataCacheBudget(cache, cacheName);
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

/** Never persist audio / large media in Cache Storage. */
function shouldCacheResponse(req, res) {
  try {
    const url = new URL(req.url);
    const path = url.pathname.toLowerCase();
    if (/\.(mp3|m4a|ogg|wav|webm|mp4)(\?|$)/i.test(path)) return false;
    if (url.hostname.includes("everyayah") || url.hostname.includes("mp3quran")) return false;
    if (url.hostname.includes("jsdelivr") && path.includes("adhan")) return false;
    const len = Number(res.headers.get("content-length") || 0);
    // Soft cap: skip caching payloads > 2.5MB
    if (len > 2_500_000) return false;
    return true;
  } catch {
    return true;
  }
}

const DATA_CACHE_MAX_ENTRIES = 120;

async function enforceDataCacheBudget(cache, cacheName) {
  if (!String(cacheName).startsWith("majalis-data-")) return;
  try {
    const keys = await cache.keys();
    if (keys.length < DATA_CACHE_MAX_ENTRIES) return;
    const overflow = keys.length - DATA_CACHE_MAX_ENTRIES + 10;
    for (let i = 0; i < overflow; i++) {
      await cache.delete(keys[i]);
    }
  } catch {
    /* ignore */
  }
}

async function rotateCachesForPressure(pressure) {
  try {
    const keys = await caches.keys();
    const offline = keys.filter((k) => k.startsWith("majalis-offline-")).sort();
    const data = keys.filter((k) => k.startsWith("majalis-data-")).sort();
    for (const group of [offline, data]) {
      for (const old of group.slice(0, Math.max(0, group.length - 1))) {
        await caches.delete(old);
      }
    }
    const newestData = data[data.length - 1];
    if (newestData && (pressure === "warn" || pressure === "critical")) {
      const cache = await caches.open(newestData);
      const reqs = await cache.keys();
      const keep = pressure === "critical" ? 40 : 80;
      if (reqs.length > keep) {
        for (const req of reqs.slice(0, reqs.length - keep)) {
          await cache.delete(req);
        }
      }
    }
  } catch {
    /* ignore */
  }
}

/** Navigations must never be stored: current network document or offline page only. */
async function networkFirstNavigation(req) {
  try {
    return await fetchWithTimeout(req);
  } catch {
    return (await caches.match("/offline.html", { cacheName: OFFLINE_CACHE })) ||
      new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
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

  // Never cache audio / media streams via SW
  if (/\.(mp3|m4a|ogg|wav|webm|mp4)(\?|$)/i.test(url.pathname)) {
    return; // network default
  }

  // Hashed JS/CSS bundles: always network (stale chunks break lazy routes)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      fetchWithTimeout(req).catch(() => caches.match(req) || Promise.reject()),
    );
    return;
  }

  // أصول ثابتة للهوية/الخطوط المحلية — cache-first (لا hashed، آمنة عبر النشرات)
  if (
    STATIC_SHELL_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/site.webmanifest" ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(cacheFirst(req, OFFLINE_CACHE));
    return;
  }

  // Internal API data (lessons, fawaid, prayer) → cache-first for offline
  if (CACHEABLE_API_PATHS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(cacheFirst(req, DATA_CACHE));
    return;
  }

  // بيانات المصحف QPC v2 (صفحات JSON + فهارس) — ثابتة ونادرة التغيّر،
  // cache-first يسرّع تقليب الصفحات ويُتيح قراءة محدودة دون شبكة.
  if (
    url.pathname.startsWith("/data/quran-v2/") ||
    url.pathname === "/data/quran/page-juz-index.json" ||
    url.pathname.startsWith("/fonts/quran/")
  ) {
    event.respondWith(cacheFirst(req, DATA_CACHE));
    return;
  }

  // HTML/navigation → network-first, never cache the response or fall back to
  // a previous build's document. Only the build-neutral offline page is cached.
  if (req.mode === "navigate") {
    event.respondWith(networkFirstNavigation(req));
    return;
  }
});

// ── Adhan Background Scheduling ──────────────────────────────────────────
// Main thread posts { type: 'SCHEDULE_ADHAN', prayerName, prayerArabic, delayMs }
// SW holds a setTimeout so the notification fires even when the tab is in background.

const _adhanTimers = new Map(); // prayerKey → timeoutId (keeps SW alive via waitUntil)

const _smartLocalTimers = new Map(); // tag → timeoutId

self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === "MAJALIS_QUOTA_ROTATE") {
    event.waitUntil(rotateCachesForPressure(msg.pressure || "warn"));
    return;
  }

  // Smart local schedule (adhkar / streak / khatmah / prayer reminders)
  if (msg.type === "MAJALIS_SCHEDULE_LOCAL_NOTIFS" && Array.isArray(msg.items)) {
    const STALE_TOLERANCE_MS = 2 * 60000;
    for (const item of msg.items) {
      const tag = item.tag || item.id;
      if (!tag || typeof item.delayMs !== "number" || item.delayMs < 0) continue;
      if (_smartLocalTimers.has(tag)) {
        clearTimeout(_smartLocalTimers.get(tag));
      }
      const fireAt = typeof item.fireAt === "number" ? item.fireAt : Date.now() + item.delayMs;
      const promise = new Promise((resolve) => {
        const tid = setTimeout(() => {
          _smartLocalTimers.delete(tag);
          if (Date.now() - fireAt > STALE_TOLERANCE_MS) {
            resolve();
            return;
          }
          self.registration.showNotification(item.title || "المجلس العلمي", {
            body: item.body || "",
            icon: "/logo.png?v=9",
            badge: "/favicon.png?v=9",
            dir: "rtl",
            lang: "ar",
            tag,
            renotify: true,
            data: { url: item.url || "/" },
          }).then(resolve).catch(resolve);
        }, Math.min(item.delayMs, 86_400_000));
        _smartLocalTimers.set(tag, tid);
      });
      event.waitUntil(promise);
    }
    return;
  }

  if (msg.type !== "SCHEDULE_ADHAN") return;

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
