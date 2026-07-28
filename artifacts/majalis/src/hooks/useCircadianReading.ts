import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadCircadianPrefs,
  saveCircadianPrefs,
  syncCircadianLighting,
  tickCircadianSchedule,
  type CircadianLightingState,
  type CircadianPrefs,
} from "@/lib/circadian-reading-schedule";

/** Circadian reading lighting — background state only. */
export function useCircadianReading(opts?: { intervalMs?: number; enabled?: boolean }) {
  const [state, setState] = useState<CircadianLightingState>(() =>
    syncCircadianLighting({ apply: false }),
  );
  const [prefs, setPrefs] = useState<CircadianPrefs>(() => loadCircadianPrefs());
  const timerRef = useRef<number | null>(null);

  const refresh = useCallback(() => {
    const next = tickCircadianSchedule();
    setState(next);
    return next;
  }, []);

  const updatePrefs = useCallback((patch: Partial<CircadianPrefs>) => {
    const next = saveCircadianPrefs({ ...loadCircadianPrefs(), ...patch });
    setPrefs(next);
    setState(syncCircadianLighting({ apply: true, prefs: next }));
    return next;
  }, []);

  useEffect(() => {
    if (opts?.enabled === false || !prefs.enabled) return;
    refresh();
    const ms = opts?.intervalMs ?? 60_000;
    timerRef.current = window.setInterval(refresh, ms);
    return () => {
      if (timerRef.current != null) window.clearInterval(timerRef.current);
    };
  }, [opts?.enabled, opts?.intervalMs, prefs.enabled, refresh]);

  return { state, prefs, refresh, updatePrefs };
}
