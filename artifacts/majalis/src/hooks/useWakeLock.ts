/**
 * React hook for Screen Wake Lock during audio playback / continuous reading.
 * Releases on pause, unmount, or tab blur — prevents battery drain.
 * Logic-only — no UI.
 */
import { useEffect, useRef } from "react";
import { createWakeLockController, type WakeLockHandle } from "@/lib/wake-lock";

/**
 * @param active — true while audio playing or continuous reading mode is on
 */
export function useWakeLock(active: boolean): {
  isHeld: boolean;
  supported: boolean;
} {
  const ctrlRef = useRef<WakeLockHandle | null>(null);
  const heldRef = useRef(false);

  useEffect(() => {
    const ctrl = createWakeLockController();
    ctrlRef.current = ctrl;
    return () => {
      ctrl.dispose();
      ctrlRef.current = null;
      heldRef.current = false;
    };
  }, []);

  useEffect(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    ctrl.setSessionActive(active);
    heldRef.current = ctrl.isHeld();
  }, [active]);

  return {
    isHeld: heldRef.current,
    supported: typeof navigator !== "undefined" && "wakeLock" in navigator,
  };
}
