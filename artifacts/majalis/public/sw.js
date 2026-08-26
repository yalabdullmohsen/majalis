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

const OFFLINE_CACHE = `majlisilm-v${SW_BUILD_ID}-offline`;
const DATA_CACHE    = `majlisilm-v${SW_BUILD_ID}-data`;
const CACHE_PREFIX  = `majlisilm-v${SW_BUILD_ID}`;
const VERSION_CACHE = "majlisilm-version";
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
  "/favicon.svg",
  "/favicon-48.png",
  "/apple-touch-icon.png",
  "/icon-96.png",
  "/icon-192.png",
  "/icon-512.png",
  "/brand/icon-512-maskable.png",
  "/star-pattern.svg",
  "/brand/official-og.png?v=20260825",
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
      const keys = await caches.keys();
      const hasLegacy = keys.some(
        (k) =>
          k === "majalis-version" ||
          k === "majalis-audio-v1" ||
          k.startsWith("majalis-offline-") ||
          k.startsWith("majalis-data-") ||
          (k.startsWith("majlisilm-v") && !k.startsWith(CACHE_PREFIX)),
      );
      const isUpdate =
        (prevVersion !== null && prevVersion !== SW_BUILD_ID) || hasLegacy;

      await Promise.all(
        keys
          .filter((k) => k !== VERSION_CACHE && !k.startsWith(CACHE_PREFIX))
          .map((k) => caches.delete(k)),
      );

      // تخزين النسخة الحالية
      await verCache.put("/sw-version", new Response(SW_BUILD_ID));

      // السيطرة على كل النوافذ
      await self.clients.claim();

      // إعادة تحميل واحدة بعد تدوير الكاش — الحارس في العميل يمنع الوميض/التكرار
      if (isUpdate) {
        const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of windows) {
          client.postMessage({ type: "SW_UPDATED_RELOAD_ONCE" });
        }
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

/**
 * Stale-While-Revalidate: أعد الكاش فورًا وحدّث في الخلفية بهدوء.
 * مناسب لنصوص ثابتة (قرآن/أذكار/JSON) دون إثقال الذاكرة — لا يُخزَّن إلا الاستجابة الناجحة.
 */
async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) {
        cache.put(req, res.clone()).catch(() => undefined);
      }
      return res;
    })
    .catch(() => null);
  if (cached) {
    void networkPromise;
    return cached;
  }
  const network = await networkPromise;
  if (network) return network;
  return new Response(JSON.stringify({ ok: false, error: "offline" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Network-first ثم كاش عند الفشل — مناسب لـ /data و manifests بعد النشر
 * حتى لا تُعرض JSON/واجهة قديمة للحظة ثم تُستبدل.
 */
async function networkFirstThenCache(req, cacheName) {
  try {
    let networkReq = req;
    try {
      networkReq = new Request(req, { cache: "no-store" });
    } catch (_) {
      networkReq = req;
    }
    const res = await fetchWithTimeout(networkReq);
    if (res && (res.ok || res.status === 206)) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone()).catch(() => undefined);
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    return new Response(JSON.stringify({ ok: false, error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/** Navigations must never be stored: current network document or offline page only. */
async function networkFirstNavigation(req) {
  try {
    // تجاوز كاش HTTP للمتصفح قدر الإمكان — مستند SPA يجب أن يشير إلى hashes النشر الحالي.
    let networkReq = req;
    try {
      networkReq = new Request(req, { cache: "no-store" });
    } catch (_) {
      networkReq = req;
    }
    return await fetchWithTimeout(networkReq);
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

  // ملفات يجب ألا تُخدم من كاش قديم أبدًا (نشر / هوية / SW)
  if (
    url.pathname === "/version.json" ||
    url.pathname === "/sw-version.js" ||
    url.pathname === "/sw.js" ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/site.webmanifest" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      (async () => {
        try {
          let networkReq = req;
          try {
            networkReq = new Request(req, { cache: "no-store" });
          } catch (_) {
            networkReq = req;
          }
          return await fetchWithTimeout(networkReq);
        } catch {
          // manifests فقط: fallback كاش خفيف للتثبيت أوفلاين — لا لـ version/sw
          if (url.pathname.includes("manifest")) {
            const cached = await caches.match(req);
            if (cached) return cached;
          }
          return new Response("{}", {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      })(),
    );
    return;
  }

  // Hashed JS/CSS/fonts under /assets/: cache-first by immutable filename.
  // Never fall back to HTML (SPA offline shell) for script/style requests —
  // that historically poisoned module loads after deploys.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) {
          const ct = cached.headers.get("content-type") || "";
          if (!ct.includes("text/html")) return cached;
        }
        try {
          const res = await fetchWithTimeout(req);
          const ct = res.headers.get("content-type") || "";
          if (res.ok && !ct.includes("text/html")) {
            const cache = await caches.open(OFFLINE_CACHE);
            cache.put(req, res.clone()).catch(() => undefined);
          }
          // رفض إعادة HTML لمسار JS/CSS حتى لا يكسر import()
          if (ct.includes("text/html") && /\.(js|mjs|css)(\?|$)/i.test(url.pathname)) {
            return new Response("/* asset not found */", {
              status: 404,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
          }
          return res;
        } catch {
          if (cached) {
            const ct = cached.headers.get("content-type") || "";
            if (!ct.includes("text/html")) return cached;
          }
          return new Response("/* offline asset */", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      })(),
    );
    return;
  }

  // JSON تحت /data/ — network-first ثم كاش (لا SWR يعرض قديمًا أولًا)
  if (url.pathname.startsWith("/data/") && url.pathname.endsWith(".json")) {
    event.respondWith(networkFirstThenCache(req, DATA_CACHE));
    return;
  }

  // أصوات الأذان — network-first حتى لا تُخدم 404 قديمة من الكاش
  if (url.pathname.startsWith("/audio/") || url.pathname.startsWith("/sounds/")) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetchWithTimeout(req, 10_000);
          if (res.ok || res.status === 206) {
            const cache = await caches.open(OFFLINE_CACHE);
            cache.put(req, res.clone()).catch(() => undefined);
          }
          return res;
        } catch {
          const cached = await caches.match(req);
          if (cached && cached.ok) return cached;
          return new Response("audio unavailable", { status: 503 });
        }
      })(),
    );
    return;
  }

  // خطوط محلية — SWR: يعرض الكاش فورًا ويحدّث في الخلفية حتى لا يبقى ملف خط قديم بعد نشر
  if (url.pathname.startsWith("/fonts/")) {
    event.respondWith(staleWhileRevalidate(req, OFFLINE_CACHE));
    return;
  }

  // أصول ثابتة للهوية — cache-first (لا hashed؛ بلا manifests/version)
  if (STATIC_SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(req, OFFLINE_CACHE));
    return;
  }

  // Internal API data — SWR للنصوص/المواقيت الشائعة، cache-first لباقي APIs الثقيلة
  if (CACHEABLE_API_PATHS.some((p) => url.pathname.startsWith(p))) {
    const useSwr =
      url.pathname.startsWith("/api/adhkar") ||
      url.pathname.startsWith("/api/library") ||
      url.pathname.startsWith("/api/fawaid") ||
      url.pathname.startsWith("/api/prayer");
    event.respondWith(
      useSwr ? staleWhileRevalidate(req, DATA_CACHE) : cacheFirst(req, DATA_CACHE),
    );
    return;
  }

  // صور الهوية والعلامات تحت /brand/ — cache-first (WebP/PNG)
  if (
    url.pathname.startsWith("/brand/") &&
    /\.(png|webp|svg|jpe?g|ico|avif)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(req, OFFLINE_CACHE));
    return;
  }

  // بيانات المصحف QPC v2 — network-first ثم كاش (نفس سياسة /data)
  if (
    url.pathname.startsWith("/data/quran-v2/") ||
    url.pathname === "/data/quran/page-juz-index.json"
  ) {
    event.respondWith(networkFirstThenCache(req, DATA_CACHE));
    return;
  }
  if (url.pathname.startsWith("/fonts/quran/")) {
    event.respondWith(cacheFirst(req, DATA_CACHE));
    return;
  }

  // HTML/navigation → network-first + revalidate; never cache the document.
  // Only the build-neutral offline page is cached.
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    // لا تُخدم مستندات HTML لطلبات تبدو كأصول JS (Accept خاطئ / تمديد .js)
    if (/\.(js|mjs|css|map)(\?|$)/i.test(url.pathname)) {
      event.respondWith(
        new Response("/* not a document */", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
      );
      return;
    }
    event.respondWith(networkFirstNavigation(req));
    return;
  }
});

// ── Adhan Background Scheduling ──────────────────────────────────────────
// Main thread posts { type: 'SCHEDULE_ADHAN', prayerName, prayerArabic, delayMs }
// SW holds a setTimeout so the notification fires even when the tab is in background.

const _adhanTimers = new Map(); // prayerKey → timeoutId (keeps SW alive via waitUntil)
const _iqamahTimers = new Map(); // prayerKey → timeoutId

const _smartLocalTimers = new Map(); // tag → timeoutId

function clearAllAdhanSwTimers() {
  for (const tid of _adhanTimers.values()) clearTimeout(tid);
  _adhanTimers.clear();
  for (const tid of _iqamahTimers.values()) clearTimeout(tid);
  _iqamahTimers.clear();
}

self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg) return;

  // Part 19: MessageChannel request/response (__majalisChannel + ports[0])
  if (msg.__majalisChannel && event.ports && event.ports[0]) {
    const port = event.ports[0];
    const reply = (ok, payload, error) => {
      try {
        port.postMessage({
          ok,
          type: msg.type,
          id: msg.id,
          payload,
          error,
        });
      } catch (_) {
        /* ignore */
      }
    };

    if (msg.type === "MAJALIS_OFFLINE_CACHE_STATUS") {
      event.waitUntil(
        (async () => {
          try {
            const names = await caches.keys();
            let entries = 0;
            for (const name of names) {
              const cache = await caches.open(name);
              const keys = await cache.keys();
              entries += keys.length;
            }
            reply(true, { caches: names.length, entries });
          } catch (err) {
            reply(false, null, String(err && err.message ? err.message : err));
          }
        })(),
      );
      return;
    }

    if (msg.type === "MAJALIS_OFFLINE_SYNC") {
      // Acknowledge sync kick — actual warm runs on the client; SW confirms receipt
      reply(true, { received: true, at: Date.now(), payload: msg.payload ?? null });
      return;
    }

    if (msg.type === "MAJALIS_AUDIO_CACHE_STATUS") {
      event.waitUntil(
        (async () => {
          try {
            // كاش الصوت القديم majalis-audio-v1 يُحذف في activate؛ نعدّ إدخالات /audio/ في OFFLINE_CACHE
            const cache = await caches.open(OFFLINE_CACHE).catch(() => null);
            const keys = cache ? await cache.keys() : [];
            const audioEntries = keys.filter((req) => {
              try {
                const p = new URL(req.url).pathname;
                return p.startsWith("/audio/") || p.startsWith("/sounds/");
              } catch (_) {
                return false;
              }
            }).length;
            reply(true, { audioEntries });
          } catch (err) {
            reply(false, null, String(err && err.message ? err.message : err));
          }
        })(),
      );
      return;
    }

    reply(false, null, "unknown-type");
    return;
  }

  // بعد فشل تحميل chunk: امسح كاش القشرة حتى لا تُخدم أصول/مستندات عتيقة.
  if (msg.type === "MAJALIS_PURGE_SHELL_ASSETS") {
    event.waitUntil(
      (async () => {
        try {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((k) => k.startsWith("majlisilm-v") || k.startsWith("majalis-offline-") || k === OFFLINE_CACHE)
              .map((k) => caches.delete(k)),
          );
        } catch (_) {
          /* ignore */
        }
      })(),
    );
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
            icon: "/logo.png?v=20260825",
            badge: "/favicon.png?v=20260825",
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

  if (msg.type === "CANCEL_ALL_ADHAN") {
    clearAllAdhanSwTimers();
    return;
  }

  if (msg.type === "SCHEDULE_IQAMAH") {
    const { prayerKey, prayerArabic, delayMs, fireAt, cityName } = msg;
    if (typeof delayMs !== "number" || delayMs < 0) return;
    if (_iqamahTimers.has(prayerKey)) {
      clearTimeout(_iqamahTimers.get(prayerKey));
    }
    const STALE_TOLERANCE_MS = 2 * 60000;
    const promise = new Promise((resolve) => {
      const tid = setTimeout(() => {
        _iqamahTimers.delete(prayerKey);
        if (typeof fireAt === "number" && Date.now() - fireAt > STALE_TOLERANCE_MS) {
          resolve();
          return;
        }
        const cityLine = cityName ? ` — ${cityName}` : "";
        self.registration.showNotification(`إقامة ${prayerArabic}${cityLine}`, {
          body: `قد قامت الصلاة${cityName ? ` · ${cityName}` : ""}`,
          icon: "/logo.png?v=20260825",
          badge: "/favicon.png?v=20260825",
          dir: "rtl",
          lang: "ar",
          tag: `iqamah-${prayerKey}`,
          renotify: true,
          requireInteraction: false,
          data: { url: "/prayer-times", action: "iqamah", prayerKey },
        }).then(resolve).catch(resolve);
      }, Math.min(delayMs, 86_400_000));
      _iqamahTimers.set(prayerKey, tid);
    });
    event.waitUntil(promise);
    return;
  }

  if (msg.type !== "SCHEDULE_ADHAN") return;

  const { prayerKey, prayerArabic, delayMs, fireAt, cityName } = msg;
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
      const cityLine = cityName ? ` — ${cityName}` : "";
      self.registration.showNotification(`حان وقت ${prayerArabic}${cityLine}`, {
        body: `حيَّ على الصلاة، حيَّ على الفلاح${cityName ? ` · ${cityName}` : ""}`,
        icon: "/logo.png?v=20260825",
        badge: "/favicon.png?v=20260825",
        dir: "rtl",
        lang: "ar",
        tag: `adhan-${prayerKey}`,
        renotify: true,
        requireInteraction: true,
        actions: [
          { action: "stop-adhan", title: "إيقاف الأذان" },
          { action: "open-prayer", title: "مواقيت الصلاة" },
        ],
        data: { url: "/prayer-times", action: "adhan", prayerKey },
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
    icon: "/logo.png?v=20260825",
    badge: "/favicon.png?v=20260825",
    dir: "rtl",
    lang: "ar",
    data: { url: payload.url || "/" },
    tag: payload.tag || "majalis-notification",
    renotify: !!payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  const action = event.action;
  event.notification.close();

  if (action === "stop-adhan") {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
        for (const client of all) {
          try {
            client.postMessage({ type: "STOP_ADHAN" });
          } catch {
            /* ignore */
          }
        }
        const target = event.notification.data?.url || "/prayer-times";
        const match = all.find((c) => "focus" in c);
        if (match) return match.focus();
        return clients.openWindow(target);
      }),
    );
    return;
  }

  const target =
    action === "open-prayer"
      ? "/prayer-times"
      : event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      const match = all.find((c) => c.url.includes(target) && "focus" in c);
      if (match) return match.focus();
      return clients.openWindow(target);
    }),
  );
});
