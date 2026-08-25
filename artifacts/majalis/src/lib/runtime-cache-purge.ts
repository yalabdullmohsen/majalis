/**
 * تنظيف كاش العرض عند تغيّر نسخة البناء — يمنع وميض UI/JSON/أصول قديمة بعد النشر.
 * لا يمس بيانات المستخدم الحساسة (ثيم، خط، إعدادات صلاة، تقدم قرآن، مصادقة…).
 */
import { getBuildMetadata } from "@/lib/error-report";
import { safeLocationReload } from "@/lib/safe-reload";

export const APP_VERSION_STORAGE_KEY = "majalis_app_version";
const FORCE_PURGE_KEY = "majalis_force_cache_purge";
const PURGE_RELOAD_GUARD = "majalis-version-purge-reload.v1";

const PRESERVE_LOCAL_STORAGE_EXACT = new Set([
  APP_VERSION_STORAGE_KEY,
  "majalis-theme",
  "majalis-font-preference-v2",
  "majalis-design-v",
  "majalis-boot-version-reload.v1",
]);

const PRESERVE_LOCAL_STORAGE_PREFIXES = [
  "sb-",
  "majalis-native-cache-purged:",
  "majalis-prayer",
  "majalis-adhan",
  "majalis-quran-last",
  "majalis-continue",
  "majalis-onboarding",
  "majalis-feature-tour",
  "majalis-streak",
  "majalis-wird",
  "majalis-tasbeeh",
  "supabase.auth",
];

const PURGE_LOCAL_STORAGE_PREFIXES = [
  "static-json:",
  "rq-",
  "react-query",
  "tanstack",
  "majalis-cache",
  "majalis-ui-cache",
  "majalis-feed",
  "majalis-lessons-cache",
  "workbox",
  "mj.sw-reload",
];

export function resolveAppVersion(): string | null {
  const { commitHash, buildVersion } = getBuildMetadata();
  if (commitHash && commitHash !== "unknown" && commitHash !== "dev") {
    return commitHash.slice(0, 12);
  }
  if (buildVersion && buildVersion !== "dev" && buildVersion !== "production") {
    return buildVersion;
  }
  return null;
}

function shouldPreserveLocalKey(key: string): boolean {
  if (PRESERVE_LOCAL_STORAGE_EXACT.has(key)) return true;
  return PRESERVE_LOCAL_STORAGE_PREFIXES.some((p) => key.startsWith(p));
}

function shouldPurgeLocalKey(key: string): boolean {
  if (shouldPreserveLocalKey(key)) return false;
  return PURGE_LOCAL_STORAGE_PREFIXES.some((p) => key.startsWith(p) || key.includes(p));
}

function purgeDisplayLocalStorage(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    for (const key of keys) {
      if (shouldPurgeLocalKey(key)) localStorage.removeItem(key);
    }
  } catch {
    /* private mode */
  }
}

async function clearCacheStorage(): Promise<number> {
  if (typeof caches === "undefined" || typeof caches.keys !== "function") return 0;
  const keys = await caches.keys();
  let n = 0;
  await Promise.all(
    keys.map(async (key) => {
      try {
        if (await caches.delete(key)) n += 1;
      } catch {
        /* ignore */
      }
    }),
  );
  return n;
}

async function clearStaticJsonIdb(): Promise<void> {
  try {
    const { idbKeys, idbDelete, OFFLINE_STORES } = await import("@/lib/offline-db");
    const keys = await idbKeys(OFFLINE_STORES.meta);
    await Promise.all(
      keys
        .filter((k) => k.startsWith("static-json:"))
        .map((k) => idbDelete(OFFLINE_STORES.meta, k).catch(() => undefined)),
    );
  } catch {
    /* IDB غير متاح */
  }
}

async function notifyServiceWorkerPurge(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    reg?.active?.postMessage({ type: "MAJALIS_PURGE_SHELL_ASSETS" });
  } catch {
    /* ignore */
  }
}

/** يسجّل النسخة الحالية دون مسح — للإقلاع الأول */
export function ensureAppVersionMarker(): string | null {
  const version = resolveAppVersion();
  if (!version) return null;
  try {
    if (!localStorage.getItem(APP_VERSION_STORAGE_KEY)) {
      localStorage.setItem(APP_VERSION_STORAGE_KEY, version);
    }
  } catch {
    /* ignore */
  }
  return version;
}

/**
 * عند اختلاف النسخة: امسح كاش العرض (Cache Storage + JSON IDB + مفاتيح كاش).
 * افتراضيًا بلا reload — SW/useVersionCheck يتوليان إعادة التحميل عند الحاجة.
 */
export async function purgeStaleRuntimeCaches(options?: {
  force?: boolean;
  reloadOnce?: boolean;
}): Promise<{ purged: boolean; cachesCleared: number; version: string | null }> {
  const version = resolveAppVersion();
  let prev: string | null;
  let forceFlag: boolean;
  try {
    prev = localStorage.getItem(APP_VERSION_STORAGE_KEY);
    forceFlag = localStorage.getItem(FORCE_PURGE_KEY) === "1";
  } catch {
    prev = null;
    forceFlag = false;
  }

  const force = options?.force === true || forceFlag;
  const changed = Boolean(version && prev && prev !== version);
  if (!force && !changed) {
    if (version && !prev) {
      try {
        localStorage.setItem(APP_VERSION_STORAGE_KEY, version);
      } catch {
        /* ignore */
      }
    }
    return { purged: false, cachesCleared: 0, version };
  }

  purgeDisplayLocalStorage();
  const cachesCleared = await clearCacheStorage();
  await clearStaticJsonIdb();
  await notifyServiceWorkerPurge();

  try {
    localStorage.removeItem(FORCE_PURGE_KEY);
    if (version) localStorage.setItem(APP_VERSION_STORAGE_KEY, version);
  } catch {
    /* ignore */
  }

  if (options?.reloadOnce === true) {
    try {
      if (sessionStorage.getItem(PURGE_RELOAD_GUARD) !== "1") {
        sessionStorage.setItem(PURGE_RELOAD_GUARD, "1");
        safeLocationReload();
      }
    } catch {
      /* ignore */
    }
  }

  return { purged: true, cachesCleared, version };
}

/** تشخيص تطوير فقط */
export function installMajalisClearCacheDebug(): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === "undefined") return;
  (window as Window & { __MAJALIS_CLEAR_CACHE__?: () => Promise<unknown> }).__MAJALIS_CLEAR_CACHE__ =
    async () => purgeStaleRuntimeCaches({ force: true, reloadOnce: true });
}
