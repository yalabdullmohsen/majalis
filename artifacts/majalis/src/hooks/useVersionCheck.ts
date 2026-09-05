import { useCallback, useEffect, useRef, useState } from "react";
import {
  VERSION_CHECK_INTERVAL_MS,
  getLoadedCommit,
  isNewVersionAvailable,
} from "@/lib/version-check";
import { safeLocationReload } from "@/lib/safe-reload";
import { isChunkRecoveryInFlight } from "@/lib/chunk-recovery";
import { purgeStaleRuntimeCaches } from "@/lib/runtime-cache-purge";

/** خلال نافذة الإقلاع: لا شيت تحديث — إعادة تحميل صامتة مرة واحدة فقط. */
const BOOT_SILENT_MS = 8_000;
const BOOT_RELOAD_KEY = "majalis-boot-version-reload.v1";
/** حارس موحّد مع سكربت mj-version-boot في index.html */
const REFRESHING_FLAG = "ssunnah-refreshing-version";
/** مهلة مسح الكاش — Cache API قد يعلق على iOS WebView */
export const PURGE_BUDGET_MS = 1_500;
const RELOAD_FALLBACK_MS = 2_000;

function alreadyDidBootReload(): boolean {
  try {
    return (
      sessionStorage.getItem(BOOT_RELOAD_KEY) === "1" ||
      sessionStorage.getItem(REFRESHING_FLAG) === "1"
    );
  } catch {
    return false;
  }
}

function markBootReload(): void {
  try {
    sessionStorage.setItem(BOOT_RELOAD_KEY, "1");
    sessionStorage.setItem(REFRESHING_FLAG, "1");
  } catch {
    /* ignore */
  }
}

function markUserRefresh(): void {
  try {
    sessionStorage.setItem(REFRESHING_FLAG, "1");
  } catch {
    /* ignore */
  }
}

/** عند فشل مسار التحديث: أزل العلم حتى لا تُعلَّق محاولات لاحقة. */
export function clearUserRefreshFlag(): void {
  try {
    sessionStorage.removeItem(REFRESHING_FLAG);
  } catch {
    /* ignore */
  }
}

function postSkipWaiting(worker: ServiceWorker | null | undefined): void {
  try {
    worker?.postMessage({ type: "SKIP_WAITING" });
  } catch {
    /* ignore */
  }
}

/** يفعّل SW المنتظر — بما في ذلك installing→waiting على iOS WebView. */
async function activateWaitingWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    await reg.update().catch(() => undefined);
    postSkipWaiting(reg.waiting);
    const installing = reg.installing;
    if (installing) {
      await new Promise<void>((resolve) => {
        const finish = () => resolve();
        const timer = window.setTimeout(finish, 900);
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed") {
            postSkipWaiting(installing);
            window.clearTimeout(timer);
            finish();
          } else if (installing.state === "activated" || installing.state === "redundant") {
            window.clearTimeout(timer);
            finish();
          }
        });
      });
    }
    postSkipWaiting(reg.waiting);
  } catch {
    /* ignore — نتابع reload */
  }
}

async function purgeAppCachesWithBudget(): Promise<void> {
  await Promise.race([
    (async () => {
      await purgeStaleRuntimeCaches({ force: true, reloadOnce: false });
      await activateWaitingWorker();
    })(),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, PURGE_BUDGET_MS);
    }),
  ]);
}

function hardReloadNow(): void {
  // force يتجاوز حارس الـ12 ثانية الذي كان يبتلع ضغطة «تحديث» بعد محاولة إقلاع
  safeLocationReload({ force: true });
  window.setTimeout(() => {
    try {
      const bare = window.location.href.split("#")[0];
      const url = new URL(bare, window.location.origin);
      url.searchParams.set("v", String(Date.now()));
      window.location.href = url.toString();
    } catch {
      window.location.href = `${window.location.pathname}?v=${Date.now()}`;
    }
  }, RELOAD_FALLBACK_MS);
}

/** مسار صامت عند الإقلاع فقط — يحترم حارس إعادة التحميل لمرّة واحدة. */
async function silentBootPurgeThenReload(): Promise<void> {
  if (alreadyDidBootReload()) return;
  markBootReload();
  try {
    await purgeAppCachesWithBudget();
  } catch {
    /* نعيد التحميل على أي حال */
  }
  hardReloadNow();
}

/**
 * مسار المستخدم من زر «تحديث».
 * مهم: لا يُلغى بسبب alreadyDidBootReload — ذلك كان سبب الشاشة المعلّقة.
 */
export async function performUserRequestedUpdate(): Promise<void> {
  markUserRefresh();
  try {
    await purgeAppCachesWithBudget();
  } catch {
    /* ignore — نتابع reload */
  }
  hardReloadNow();
}

export function isAppShellStable(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.classList.contains("app-booting")) return false;
  if (document.readyState === "loading") return false;
  return true;
}

/**
 * فحص نشر أحدث عبر /version.json.
 * - فور الدخول: إن وُجدت نسخة أحدث → مسح كاش + reload صامت مرة واحدة
 * - بعد استقرار الهيكل: شيت هادئ فقط؛ زر تحديث يفرض reload حقيقي.
 */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [shellReady, setShellReady] = useState(() => isAppShellStable());
  const [loadedCommit] = useState(() => getLoadedCommit());
  const checkingRef = useRef(false);
  const dismissedRef = useRef(false);
  const bootAtRef = useRef(Date.now());

  const applyUpdate = useCallback(async () => {
    await performUserRequestedUpdate();
  }, []);

  const dismissUpdate = useCallback(() => {
    dismissedRef.current = true;
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    if (shellReady) return;
    const markReady = () => {
      if (!isAppShellStable()) return;
      window.requestAnimationFrame(() => {
        window.setTimeout(() => setShellReady(true), 450);
      });
    };
    markReady();
    document.addEventListener("mj:boot-ready", markReady);
    document.addEventListener("DOMContentLoaded", markReady);
    window.addEventListener("load", markReady);
    const poll = window.setInterval(markReady, 500);
    return () => {
      document.removeEventListener("mj:boot-ready", markReady);
      document.removeEventListener("DOMContentLoaded", markReady);
      window.removeEventListener("load", markReady);
      window.clearInterval(poll);
    };
  }, [shellReady]);

  const check = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.webdriver) return;
    if (!loadedCommit || checkingRef.current || dismissedRef.current) return;
    if (isChunkRecoveryInFlight()) return;

    checkingRef.current = true;
    try {
      const found = await isNewVersionAvailable(loadedCommit);
      if (!found || dismissedRef.current || isChunkRecoveryInFlight()) return;

      const inBootWindow = Date.now() - bootAtRef.current < BOOT_SILENT_MS;
      if (inBootWindow) {
        await silentBootPurgeThenReload();
        return;
      }

      if (!isAppShellStable()) return;
      setUpdateAvailable(true);
    } finally {
      checkingRef.current = false;
    }
  }, [loadedCommit]);

  useEffect(() => {
    if (!loadedCommit || updateAvailable || !shellReady) return;

    const bootDelay = window.setTimeout(() => {
      void check();
    }, 0);

    const interval = window.setInterval(() => {
      void check();
    }, VERSION_CHECK_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(bootDelay);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadedCommit, updateAvailable, check, shellReady]);

  return { updateAvailable, applyUpdate, dismissUpdate, shellReady };
}
