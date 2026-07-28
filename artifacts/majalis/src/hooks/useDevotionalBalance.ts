import { useCallback, useEffect, useRef, useState } from "react";
import {
  dismissTimeAwarePrompt,
  generateTimeAwarePrompts,
  loadDevotionalBalance,
  loadDevotionalBalanceAsync,
  recordSectionTime,
  topTimeAwarePrompt,
  type DevotionalBalanceState,
  type DevotionalSection,
  type TimeAwarePrompt,
} from "@/lib/devotional-balance-engine";
import { monoElapsed, monoNow } from "@/lib/monotonic-time";

/** Devotional balance & time-awareness — logic only. */
export function useDevotionalBalance(section?: DevotionalSection) {
  const [state, setState] = useState<DevotionalBalanceState>(() => loadDevotionalBalance());
  const [prompts, setPrompts] = useState<TimeAwarePrompt[]>(() => generateTimeAwarePrompts());
  const startedAt = useRef<number>(monoNow());

  useEffect(() => {
    let cancelled = false;
    void loadDevotionalBalanceAsync().then((s) => {
      if (cancelled) return;
      setState(s);
      setPrompts(generateTimeAwarePrompts({ state: s }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!section || typeof document === "undefined") return;
    startedAt.current = monoNow();
    const flush = () => {
      const dwell = monoElapsed(startedAt.current);
      if (dwell < 1_000) return;
      const next = recordSectionTime(section, dwell);
      setState(next);
      setPrompts(generateTimeAwarePrompts({ state: next }));
      startedAt.current = monoNow();
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
      else startedAt.current = monoNow();
    };
    document.addEventListener("visibilitychange", onVis);
    const interval = window.setInterval(flush, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(interval);
      flush();
    };
  }, [section]);

  const record = useCallback((sec: DevotionalSection, ms: number) => {
    const next = recordSectionTime(sec, ms);
    setState(next);
    setPrompts(generateTimeAwarePrompts({ state: next }));
    return next;
  }, []);

  const dismiss = useCallback((kind: TimeAwarePrompt["kind"]) => {
    dismissTimeAwarePrompt(kind);
    setPrompts(generateTimeAwarePrompts({ state }));
  }, [state]);

  const top = topTimeAwarePrompt({ state });

  return { state, prompts, topPrompt: top, record, dismiss };
}
