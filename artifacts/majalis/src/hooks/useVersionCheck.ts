import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTO_RELOAD_GRACE_MS,
  VERSION_CHECK_INTERVAL_MS,
  getLoadedCommit,
  isNewVersionAvailable,
} from "@/lib/version-check";
import {
  isProtectedSession,
  onProtectedSessionChange,
} from "@/lib/protected-session";
import {
  applyServiceWorkerUpdate,
  onServiceWorkerUpdateAvailable,
} from "@/lib/service-worker";

/**
 * Detects newer deploys + waiting SW. Never force-reloads during protected
 * Quran/Azkar reading sessions — waits until the session ends or the user
 * presses "تحديث الآن".
 */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [loadedCommit] = useState(() => getLoadedCommit());
  const checkingRef = useRef(false);
  const reloadTimerRef = useRef<number | null>(null);
  const pendingReloadRef = useRef(false);

  const clearReloadTimer = useCallback(() => {
    if (reloadTimerRef.current !== null) {
      window.clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = null;
    }
  }, []);

  const applyUpdate = useCallback(() => {
    clearReloadTimer();
    pendingReloadRef.current = false;
    if (isProtectedSession()) {
      pendingReloadRef.current = true;
      return;
    }
    void applyServiceWorkerUpdate();
  }, [clearReloadTimer]);

  const scheduleSoftReload = useCallback(() => {
    setUpdateAvailable(true);
    if (isProtectedSession()) {
      pendingReloadRef.current = true;
      clearReloadTimer();
      return;
    }
    if (reloadTimerRef.current === null) {
      reloadTimerRef.current = window.setTimeout(applyUpdate, AUTO_RELOAD_GRACE_MS);
    }
  }, [applyUpdate, clearReloadTimer]);

  const check = useCallback(async () => {
    if (!loadedCommit || checkingRef.current) return;
    checkingRef.current = true;
    try {
      const found = await isNewVersionAvailable(loadedCommit);
      if (found) scheduleSoftReload();
    } finally {
      checkingRef.current = false;
    }
  }, [loadedCommit, scheduleSoftReload]);

  useEffect(() => {
    if (!loadedCommit || updateAvailable) return;

    const interval = window.setInterval(() => {
      void check();
    }, VERSION_CHECK_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadedCommit, updateAvailable, check]);

  useEffect(() => {
    const unsubSw = onServiceWorkerUpdateAvailable(() => scheduleSoftReload());
    const unsubSession = onProtectedSessionChange((state) => {
      if (!state.active && pendingReloadRef.current && updateAvailable) {
        // Session ended — apply deferred update gracefully
        reloadTimerRef.current = window.setTimeout(applyUpdate, AUTO_RELOAD_GRACE_MS);
      }
    });
    return () => {
      unsubSw();
      unsubSession();
    };
  }, [scheduleSoftReload, applyUpdate, updateAvailable]);

  useEffect(
    () => () => {
      clearReloadTimer();
    },
    [clearReloadTimer],
  );

  return { updateAvailable, applyUpdate };
}
