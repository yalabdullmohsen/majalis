import { useCallback, useEffect, useRef, useState } from "react";
import {
  VERSION_CHECK_INTERVAL_MS,
  getLoadedCommit,
  isNewVersionAvailable,
} from "@/lib/version-check";
import { safeLocationReload } from "@/lib/safe-reload";
import { isChunkRecoveryInFlight } from "@/lib/chunk-recovery";
import { purgeStaleRuntimeCaches } from "@/lib/runtime-cache-purge";
import {
  isAppShellStable as isShellStableNow,
  whenAppShellStable,
} from "@/lib/app-shell-stability";

/**
 * خلال نافذة الإقلاع: لا شيت ولا reload صامت.
 * الـreload الصامت أثناء أول ثوانٍ كان يسبب وميضًا وشاشة ناقصة ثم «تحديث».
 */
const BOOT_QUIET_MS = 10_000;
/** حارس موحّد مع سكربت mj-version-boot في index.html */
const REFRESHING_FLAG = "ssunnah-refreshing-version";
/** مهلة مسح الكاش — Cache API قد يعلق على iOS WebView */
export const PURGE_BUDGET_MS = 1_500;
const RELOAD_FALLBACK_MS = 2_000;

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
  return isShellStableNow();
}

/**
 * فحص نشر أحدث عبر /version.json.
 * - خلال الإقلاع: لا شيء (لا شيت ولا reload) حتى يستقر الهيكل.
 * - بعد الاستقرار: شيت هادئ فقط؛ زر تحديث يفرض reload حقيقي.
 */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [shellReady, setShellReady] = useState(() => isAppShellStable());
  const [loadedCommit] = useState(() => getLoadedCommit());
  const checkingRef = useRef(false);
  const dismissedRef = useRef(false);
  const bootAtRef = useRef(Date.now());
  const pendingUpdateRef = useRef(false);

  const applyUpdate = useCallback(async () => {
    await performUserRequestedUpdate();
  }, []);

  const dismissUpdate = useCallback(() => {
    dismissedRef.current = true;
    pendingUpdateRef.current = false;
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    if (shellReady) return;
    return whenAppShellStable(() => {
      setShellReady(true);
      if (pendingUpdateRef.current && !dismissedRef.current) {
        setUpdateAvailable(true);
      }
    });
  }, [shellReady]);

  const check = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.webdriver) return;
    if (!loadedCommit || checkingRef.current || dismissedRef.current) return;
    if (isChunkRecoveryInFlight()) return;

    checkingRef.current = true;
    try {
      const found = await isNewVersionAvailable(loadedCommit);
      if (!found || dismissedRef.current || isChunkRecoveryInFlight()) return;

      const inBootWindow = Date.now() - bootAtRef.current < BOOT_QUIET_MS;
      // أثناء الإقلاع: أخّر الشيت فقط — لا reload صامت (كان مصدر الوميض).
      if (inBootWindow || !isAppShellStable() || !shellReady) {
        pendingUpdateRef.current = true;
        return;
      }

      pendingUpdateRef.current = false;
      setUpdateAvailable(true);
    } finally {
      checkingRef.current = false;
    }
  }, [loadedCommit, shellReady]);

  useEffect(() => {
    if (!loadedCommit || updateAvailable) return;

    const bootDelay = window.setTimeout(() => {
      void check();
    }, shellReady ? 0 : BOOT_QUIET_MS);

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
