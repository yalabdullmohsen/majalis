/**
 * React hook for Screen Wake Lock during audio playback / continuous reading.
 * Releases on pause, unmount, or tab blur — prevents battery drain.
 * Logic-only — no UI.
 */
import { useEffect, useRef, useState } from "react";
import { createWakeLockController, type WakeLockHandle } from "@/lib/wake-lock";
import { shouldAttemptWakeLock } from "@/lib/webview-guard";

/**
 * @param active — true while audio playing or continuous reading mode is on
 */
export function useWakeLock(active: boolean): {
  isHeld: boolean;
  supported: boolean;
} {
  const ctrlRef = useRef<WakeLockHandle | null>(null);
  const [isHeld, setIsHeld] = useState(false);
  const supported =
    typeof navigator !== "undefined" && "wakeLock" in navigator && shouldAttemptWakeLock();

  useEffect(() => {
    if (!supported) return;
    const ctrl = createWakeLockController();
    ctrlRef.current = ctrl;
    return () => {
      ctrl.dispose();
      ctrlRef.current = null;
      setIsHeld(false);
    };
  }, [supported]);

  useEffect(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    ctrl.setSessionActive(active);
    void (active ? ctrl.request() : ctrl.release()).finally(() => {
      setIsHeld(ctrl.isHeld());
    });
  }, [active]);

  return { isHeld, supported };
}
