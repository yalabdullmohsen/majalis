/**
 * تنظيف كاش العرض عند تغيّر نسخة البناء — يمنع وميض UI/JSON/أصول قديمة بعد النشر.
 * لا يمس بيانات المستخدم الحساسة (ثيم، خط، إعدادات صلاة، تقدم قرآن، مصادقة…).
 */
import { getBuildMetadata } from "@/lib/error-report";
import { safeLocationReload } from "@/lib/safe-reload";

export const APP_VERSION_STORAGE_KEY = "majalis_app_version";
const FORCE_PURGE_KEY = "majalis_force_cache_purge";
/** يجب أن يطابق boot-legacy-cache.js و useVersionCheck لمنع reload loop */
const PURGE_RELOAD_GUARD = "ssunnah-refreshing-version";

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

/** مفاتيح دخولية/تخطيط قديمة أو تالفة تُمسح في الإقلاع البارد (متزامن). */
const LEGACY_COLD_BOOT_KEYS = [
  "majalis-quick-guide-v1",
  "majalis-quick-guide-seen",
  "majlis-quick-guide-v1",
  "majalis-welcome-v1",
  "majalis-intro-seen",
  "majalis-boot-guide",
  "show-onboarding",
  "force-onboarding",
  "majalis-first-run-setup-v1",
  "majalis.onboarding.onboarding_seen",
  "mj.silent-splash.session",
  "mj.launch-splash.session.v1",
  "mj.launch-splash.session.v2",
  "majalis-layout-cache-v0",
  "majalis-font-fit-cache-v0",
  "majalis-mushaf-layout-draft",
  "majalis-homepage-ad-dismissed",
  "HomepageAdBar",
];

/**
 * مسح صامت لمفاتيح إقلاع قديمة/تالفة — متزامن وغير حاجب.
 * لا يمس الثيم/الخط/آخر صفحة مصحف/إعدادات الأذان.
 */
export function purgeLegacyColdBootKeysSync(): number {
  let n = 0;
  for (const key of LEGACY_COLD_BOOT_KEYS) {
    try {
      if (localStorage.getItem(key) != null) {
        localStorage.removeItem(key);
        n += 1;
      }
    } catch {
      /* private mode */
    }
    try {
      if (sessionStorage.getItem(key) != null) {
        sessionStorage.removeItem(key);
        n += 1;
      }
    } catch {
      /* ignore */
    }
  }
  return n;
}

export function resolveAppVersion(): string | null {
  const { commitHash, buildVersion } = getBuildMetadata();
  if (commitHash && commitHash !== "unknown" && commitHash !== "dev") {
    /* طابق /version.json shortCommit (8) لتفادي reload-loop */
    return commitHash.slice(0, 8);
  }
  if (buildVersion && buildVersion !== "dev" && buildVersion !== "production") {
    return buildVersion.slice(0, 8);
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

export async function clearAllRuntimeCaches(): Promise<number> {
  return clearCacheStorage();
}

export async function unregisterAllServiceWorkers(): Promise<number> {
  if (!("serviceWorker" in navigator) || typeof navigator.serviceWorker.getRegistrations !== "function") {
    return 0;
  }
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)));
    return regs.length;
  } catch {
    return 0;
  }
}

export type LiveVersionInfo = {
  commit: string;
  shortCommit: string;
  builtAt: string | null;
};

/** جلب /version.json بدون كاش — للفشل الشبكي يُرجع null بصمت */
export async function fetchLiveVersionInfo(): Promise<LiveVersionInfo | null> {
  try {
    if (typeof fetch === "undefined") return null;
    const res = await fetch(`/version.json?force=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const commit =
      (typeof data.commit === "string" && data.commit.trim()) ||
      (typeof data.commitSha === "string" && data.commitSha.trim()) ||
      (typeof data.shortCommit === "string" && data.shortCommit.trim()) ||
      "";
    if (!commit) return null;
    const short =
      (typeof data.shortCommit === "string" && data.shortCommit.trim()) ||
      commit.slice(0, 8);
    const builtAt =
      (typeof data.builtAt === "string" && data.builtAt) ||
      (typeof data.buildTime === "string" && data.buildTime) ||
      null;
    return { commit, shortCommit: short.slice(0, 8), builtAt };
  } catch {
    return null;
  }
}

/** رقم النسخة المختصر المعروض في الإعدادات (محفوظ أو مضمّن في البناء) */
export function getDisplayedAppVersion(): string {
  try {
    const stored = localStorage.getItem(APP_VERSION_STORAGE_KEY);
    if (typeof stored === "string" && stored.trim()) {
      return stored.trim().slice(0, 8);
    }
  } catch {
    /* ignore */
  }
  return resolveAppVersion()?.slice(0, 8) ?? "—";
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

/**
 * زر الإعدادات «تحديث النسخة»:
 * يجلب /version.json، يمسح Cache Storage + SW، يخزّن commit، ثم hard reload مرة واحدة.
 * لا يمس الثيم/المفضلة/الصلاة/المصادقة.
 */
export async function refreshAppAndPurgeCaches(): Promise<{
  purged: boolean;
  cachesCleared: number;
  shortCommit: string | null;
  ok: boolean;
}> {
  try {
    if (sessionStorage.getItem(PURGE_RELOAD_GUARD) === "1") {
      sessionStorage.removeItem(PURGE_RELOAD_GUARD);
      return {
        purged: false,
        cachesCleared: 0,
        shortCommit: getDisplayedAppVersion(),
        ok: false,
      };
    }
  } catch {
    /* ignore */
  }

  const live = await fetchLiveVersionInfo();
  const shortCommit = live?.shortCommit ?? getDisplayedAppVersion();

  try {
    localStorage.setItem(FORCE_PURGE_KEY, "1");
  } catch {
    /* ignore */
  }

  const result = await purgeStaleRuntimeCaches({ force: true, reloadOnce: false });
  await unregisterAllServiceWorkers();

  if (live?.shortCommit) {
    try {
      localStorage.setItem(APP_VERSION_STORAGE_KEY, live.shortCommit);
    } catch {
      /* ignore */
    }
  }

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.update().catch(() => undefined);
      reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
      reg?.active?.postMessage({ type: "MAJALIS_PURGE_SHELL_ASSETS" });
    }
  } catch {
    /* ignore */
  }

  try {
    sessionStorage.setItem(PURGE_RELOAD_GUARD, "1");
  } catch {
    /* ignore */
  }

  safeLocationReload({ force: true });

  return {
    purged: result.purged,
    cachesCleared: result.cachesCleared,
    shortCommit,
    ok: true,
  };
}

/** تشخيص: مسح كاش + طباعة /version.json في الـ console */
export function installMajalisClearCacheDebug(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    __MAJALIS_CLEAR_CACHE__?: () => Promise<unknown>;
    __SSUNNAH_REFRESH_VERSION__?: () => Promise<unknown>;
    __SSUNNAH_VERSION__?: unknown;
  };
  w.__MAJALIS_CLEAR_CACHE__ = async () => refreshAppAndPurgeCaches();
  w.__SSUNNAH_REFRESH_VERSION__ = async () => refreshAppAndPurgeCaches();
  void fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((payload) => {
      if (!payload) return;
      w.__SSUNNAH_VERSION__ = payload;
      const sha = payload.commitSha || payload.shortCommit || payload.commit;
      const when = payload.buildTime || payload.builtAt;
      const branch = payload.branch || payload.ref;
      if (typeof console !== "undefined" && typeof console.info === "function") {
        console.info(`[ssunnah-version] commitSha=${sha} branch=${branch} buildTime=${when}`);
      }
    })
    .catch(() => undefined);
}
