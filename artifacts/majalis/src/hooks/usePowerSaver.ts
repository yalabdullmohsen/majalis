import { useCallback, useEffect, useState } from "react";
import {
  beginPowerSaverSession,
  endPowerSaverSession,
  getPowerSaverState,
  loadPowerSaverPrefs,
  savePowerSaverPrefs,
  scaleIntervalMs,
  scheduleNonCriticalWork,
  setPowerSaverMode,
  setThrottledInterval,
  clearThrottledInterval,
  shouldThrottleUiRender,
  subscribePowerSaver,
  type PowerSaverMode,
  type PowerSaverPrefs,
  type PowerSaverState,
} from "@/lib/power-saver-engine";

/** Power saver & resource throttling — logic only. */
export function usePowerSaver(opts?: { autoBegin?: boolean }) {
  const [state, setState] = useState<PowerSaverState>(() => getPowerSaverState());
  const [prefs, setPrefs] = useState<PowerSaverPrefs>(() => loadPowerSaverPrefs());

  useEffect(() => subscribePowerSaver(setState), []);

  useEffect(() => {
    if (!opts?.autoBegin) return;
    beginPowerSaverSession();
    return () => {
      endPowerSaverSession();
    };
  }, [opts?.autoBegin]);

  const begin = useCallback((immediate?: boolean) => {
    setState(beginPowerSaverSession({ immediate }));
  }, []);

  const end = useCallback(() => {
    setState(endPowerSaverSession());
  }, []);

  const setMode = useCallback((mode: PowerSaverMode) => {
    setState(setPowerSaverMode(mode));
  }, []);

  const updatePrefs = useCallback((patch: Partial<PowerSaverPrefs>) => {
    const next = savePowerSaverPrefs({ ...loadPowerSaverPrefs(), ...patch });
    setPrefs(next);
    return next;
  }, []);

  return {
    state,
    prefs,
    begin,
    end,
    setMode,
    updatePrefs,
    shouldThrottleUiRender,
    scaleIntervalMs,
    scheduleNonCriticalWork,
    setThrottledInterval,
    clearThrottledInterval,
  };
}
