import { useCallback, useEffect, useState } from "react";
import {
  incrementSmartAzkar,
  isAzkarTargetReached,
  loadSmartAzkarCounter,
  loadSmartAzkarCounterAsync,
  resetSmartAzkar,
  setSmartAzkarTarget,
  type SmartAzkarCounterState,
} from "@/lib/azkar-haptic-engine";

/** Smart azkar counter with haptics — no UI. */
export function useSmartAzkarCounter(id: string, initialTarget = 33, title?: string) {
  const [state, setState] = useState<SmartAzkarCounterState>(() =>
    loadSmartAzkarCounter(id, initialTarget, title),
  );

  useEffect(() => {
    let cancelled = false;
    void loadSmartAzkarCounterAsync(id, initialTarget, title).then((s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
    };
  }, [id, initialTarget, title]);

  const increment = useCallback((delta = 1) => {
    setState((prev) => incrementSmartAzkar(prev, delta));
  }, []);

  const undo = useCallback(() => {
    setState((prev) => incrementSmartAzkar(prev, -1));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => resetSmartAzkar(prev));
  }, []);

  const setTarget = useCallback((target: number) => {
    setState((prev) => setSmartAzkarTarget(prev, target));
  }, []);

  return {
    state,
    count: state.count,
    target: state.target,
    goalReached: isAzkarTargetReached(state),
    increment,
    undo,
    reset,
    setTarget,
  };
}
