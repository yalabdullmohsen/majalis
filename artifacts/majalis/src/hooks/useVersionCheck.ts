import { useCallback, useEffect, useRef, useState } from "react";
import {
  VERSION_CHECK_INTERVAL_MS,
  getLoadedCommit,
  isNewVersionAvailable,
} from "@/lib/version-check";
import { safeLocationReload } from "@/lib/safe-reload";
import { isChunkRecoveryInFlight } from "@/lib/chunk-recovery";

/** خلال نافذة الإقلاع: لا شيت تحديث — إعادة تحميل صامتة مرة واحدة فقط. */
const BOOT_SILENT_MS = 8_000;
const BOOT_RELOAD_KEY = "majalis-boot-version-reload.v1";

function alreadyDidBootReload(): boolean {
  try {
    return sessionStorage.getItem(BOOT_RELOAD_KEY) === "1";
  } catch {
    return false;
  }
}

function markBootReload(): void {
  try {
    sessionStorage.setItem(BOOT_RELOAD_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * فحص نشر أحدث عبر /version.json.
 * - عند الدخول (أول ثوانٍ): إن وُجدت نسخة أحدث → reload صامت مرة واحدة بلا شيت
 *   (يمنع ظهور «تحديثان قديمان» وتعليق الشاشة مع SW/chunk-recovery).
 * - بعد استقرار الجلسة: شيت هادئ فقط إن طلب المستخدم التحديث.
 */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [loadedCommit] = useState(() => getLoadedCommit());
  const checkingRef = useRef(false);
  const dismissedRef = useRef(false);
  const bootAtRef = useRef(Date.now());

  const applyUpdate = useCallback(() => {
    safeLocationReload();
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
        if (!alreadyDidBootReload()) {
          markBootReload();
          safeLocationReload();
        }
        return;
      }

      setUpdateAvailable(true);
    } finally {
      checkingRef.current = false;
    }
  }, [loadedCommit]);

  useEffect(() => {
    if (!loadedCommit || updateAvailable) return;

    // لا تفحص فورًا عند الرسم الأول — أعطِ SW/chunks فرصة للاستقرار
    const bootDelay = window.setTimeout(() => {
      void check();
    }, 2_500);

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
