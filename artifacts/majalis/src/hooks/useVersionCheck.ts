import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTO_RELOAD_GRACE_MS,
  VERSION_CHECK_INTERVAL_MS,
  getLoadedCommit,
  isNewVersionAvailable,
} from "@/lib/version-check";
import { safeLocationReload } from "@/lib/safe-reload";
import { scaleIntervalMs } from "@/lib/power-saver-engine";
import { getBatteryThrottleState } from "@/lib/battery-throttle";

/**
 * يفحص دوريًا (كل بضع دقائق + فور رجوع التبويب من الخلفية) هل صار هناك
 * نشر أحدث من الذي حُمِّلت به هذه الجلسة، بمقارنة commit الحيّ في
 * /version.json بما حُمِّل فعليًا عند بدء الجلسة. عند اكتشاف تحديث حقيقي:
 * يعرض إشعارًا لثوانٍ قليلة (`AUTO_RELOAD_GRACE_MS`) ثم **يُعيد التحميل
 * تلقائيًا بلا حاجة لضغطة المستخدم** — بأمر صريح من المالك لمنع أي
 * احتمال لبقاء مستخدم على إصدار قديم. `applyUpdate` يبقى متاحًا لتسريع
 * التحديث فورًا (تجاوز المهلة) لمن يضغط الزر يدويًا.
 */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [loadedCommit] = useState(() => getLoadedCommit());
  const checkingRef = useRef(false);
  const reloadTimerRef = useRef<number | null>(null);

  const applyUpdate = useCallback(() => {
    if (reloadTimerRef.current !== null) {
      window.clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = null;
    }
    safeLocationReload();
  }, []);

  const check = useCallback(async () => {
    if (!loadedCommit || checkingRef.current) return;
    checkingRef.current = true;
    try {
      const found = await isNewVersionAvailable(loadedCommit);
      if (found) {
        setUpdateAvailable(true);
        if (reloadTimerRef.current === null) {
          reloadTimerRef.current = window.setTimeout(applyUpdate, AUTO_RELOAD_GRACE_MS);
        }
      }
    } finally {
      checkingRef.current = false;
    }
  }, [loadedCommit, applyUpdate]);

  useEffect(() => {
    if (!loadedCommit || updateAvailable) return; // dev/local build أو تم الاكتشاف بالفعل

    const bat = getBatteryThrottleState();
    const base = bat.deferBackground ? VERSION_CHECK_INTERVAL_MS * 3 : VERSION_CHECK_INTERVAL_MS;
    const intervalMs = scaleIntervalMs(base);
    const interval = window.setInterval(() => { void check(); }, intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    const onThrottle = () => {
      /* interval rebuilt via effect deps if we listened — soft: next tick uses scaled ms on remount */
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("majalis-battery-throttle", onThrottle);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("majalis-battery-throttle", onThrottle);
    };
  }, [loadedCommit, updateAvailable, check]);

  useEffect(() => () => {
    if (reloadTimerRef.current !== null) window.clearTimeout(reloadTimerRef.current);
  }, []);

  return { updateAvailable, applyUpdate };
}
