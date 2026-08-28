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
const REFRESHING_FLAG = "majlisilm-refreshing-version";

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

async function purgeThenReload(): Promise<void> {
  if (alreadyDidBootReload()) return;
  markBootReload();
  try {
    await purgeStaleRuntimeCaches({ force: true, reloadOnce: false });
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.update().catch(() => undefined);
      reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
    }
  } catch {
    /* ignore — نعيد التحميل على أي حال */
  }
  safeLocationReload();
}

/**
 * فحص نشر أحدث عبر /version.json.
 * - فور الدخول: إن وُجدت نسخة أحدث → مسح كاش + reload صامت مرة واحدة
 * - بعد استقرار الجلسة: شيت هادئ فقط إن طلب المستخدم التحديث.
 */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [loadedCommit] = useState(() => getLoadedCommit());
  const checkingRef = useRef(false);
  const dismissedRef = useRef(false);
  const bootAtRef = useRef(Date.now());

  const applyUpdate = useCallback(() => {
    void purgeThenReload();
  }, []);

  const dismissUpdate = useCallback(() => {
    dismissedRef.current = true;
    setUpdateAvailable(false);
  }, []);

  const check = useCallback(async () => {
    if (!loadedCommit || checkingRef.current || dismissedRef.current) return;
    if (isChunkRecoveryInFlight()) return;

    checkingRef.current = true;
    try {
      const found = await isNewVersionAvailable(loadedCommit);
      if (!found || dismissedRef.current || isChunkRecoveryInFlight()) return;

      const inBootWindow = Date.now() - bootAtRef.current < BOOT_SILENT_MS;
      if (inBootWindow) {
        await purgeThenReload();
        return;
      }

      setUpdateAvailable(true);
    } finally {
      checkingRef.current = false;
    }
  }, [loadedCommit]);

  useEffect(() => {
    if (!loadedCommit || updateAvailable) return;

    // فحص فوري عند الإقلاع — لا تؤجّل 2.5s (كانت تسبب وميض نسخة قديمة)
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
  }, [loadedCommit, updateAvailable, check]);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
