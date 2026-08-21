/**
 * تفريغ كاش Service Worker / CacheStorage داخل Capacitor Native فقط.
 * يكمّل مسح كاش WKWebView (بدون localStorage) في AppDelegate عند تحميل الموقع الحي
 * (server.url) داخل WKWebView، ويمنع بقاء SW قديم يخدم أصولًا عتيقة.
 */
import { isNative } from "./capacitor-utils";

const STORAGE_PREFIX = "majalis-native-cache-purged:";

function resolveNativeBuildFingerprint(): string {
  const sha = String(import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || "").trim();
  if (sha) return sha;
  const commit = String(import.meta.env.VITE_COMMIT_HASH || "").trim();
  if (commit) return commit;
  const buildId = String(import.meta.env.VITE_BUILD_ID || "").trim();
  if (buildId) return buildId;
  return "unknown";
}

function alreadyPurgedForBuild(fingerprint: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${fingerprint}`) === "1";
  } catch {
    return false;
  }
}

function markPurgedForBuild(fingerprint: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${fingerprint}`, "1");
  } catch {
    /* private mode / quota — ignore */
  }
}

async function unregisterServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator) || typeof navigator.serviceWorker?.getRegistrations !== "function") {
    return;
  }
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map(async (registration) => {
      try {
        await registration.unregister();
      } catch (err) {
        console.warn("[native-cache-freshness] SW unregister failed", err);
      }
    }),
  );
}

async function clearCacheStorage(): Promise<void> {
  if (typeof caches === "undefined" || typeof caches.keys !== "function") {
    return;
  }
  const keys = await caches.keys();
  await Promise.all(
    keys.map(async (key) => {
      try {
        await caches.delete(key);
      } catch (err) {
        console.warn("[native-cache-freshness] caches.delete failed", key, err);
      }
    }),
  );
}

/**
 * يُستدعى قبل createRoot في main.tsx داخل Capacitor فقط.
 * أي فشل يُسجَّل كـ console.warn ولا يُرمى إلى الأعلى.
 */
export async function purgeNativeWebRuntimeCaches(): Promise<void> {
  try {
    if (!isNative) return;

    const fingerprint = resolveNativeBuildFingerprint();
    if (alreadyPurgedForBuild(fingerprint)) return;

    const budget = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 700);
    });

    await Promise.race([
      (async () => {
        await unregisterServiceWorkers();
        await clearCacheStorage();
        markPurgedForBuild(fingerprint);
      })(),
      budget,
    ]);
  } catch (err) {
    console.warn("[native-cache-freshness] purge failed", err);
  }
}
