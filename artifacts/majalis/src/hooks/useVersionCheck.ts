import { useCallback, useEffect, useRef, useState } from "react";
import {
  VERSION_CHECK_INTERVAL_MS,
  getLoadedCommit,
  isNewVersionAvailable,
} from "@/lib/version-check";
import { safeLocationReload } from "@/lib/safe-reload";

/**
 * يفحص دوريًا (كل بضع دقائق + فور رجوع التبويب من الخلفية) هل صار هناك
 * نشر أحدث من الذي حُمِّلت به هذه الجلسة، بمقارنة commit الحيّ في
 * /version.json بما حُمِّل فعليًا عند بدء الجلسة. عند الاكتشاف يعرض شيتًا
 * هادئًا دون إعادة تحميل قسرية — `applyUpdate` يُعيد التحميل عند طلب المستخدم.
 */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [loadedCommit] = useState(() => getLoadedCommit());
  const checkingRef = useRef(false);
  const dismissedRef = useRef(false);

  const applyUpdate = useCallback(() => {
    safeLocationReload();
  }, []);

  const dismissUpdate = useCallback(() => {
    dismissedRef.current = true;
    setUpdateAvailable(false);
  }, []);

  const check = useCallback(async () => {
    if (!loadedCommit || checkingRef.current || dismissedRef.current) return;
    checkingRef.current = true;
    try {
      const found = await isNewVersionAvailable(loadedCommit);
      if (found && !dismissedRef.current) {
        setUpdateAvailable(true);
      }
    } finally {
      checkingRef.current = false;
    }
  }, [loadedCommit]);

  useEffect(() => {
    if (!loadedCommit || updateAvailable) return;

    const interval = window.setInterval(() => { void check(); }, VERSION_CHECK_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadedCommit, updateAvailable, check]);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
