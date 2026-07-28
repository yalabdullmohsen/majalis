import { useCallback, useEffect, useState } from "react";
import {
  buildReflectionPause,
  createIdleReflectionPause,
  dismissReflectionPause,
  isReadingTooFast,
  loadRecitationPaceStats,
  loadRecitationPaceStatsAsync,
  startRecitationTimer,
  stopRecitationTimer,
  type RecitationPaceStats,
  type RecitationTargetKind,
  type ReflectionPauseState,
} from "@/lib/recitation-pace-tracker";

/** Pace tracking + optional reflection pause — logic only. */
export function useRecitationPace(opts?: { reflectionEnabled?: boolean }) {
  const reflectionEnabled = opts?.reflectionEnabled !== false;
  const [stats, setStats] = useState<RecitationPaceStats>(() => loadRecitationPaceStats());
  const [pause, setPause] = useState<ReflectionPauseState>(() => createIdleReflectionPause());

  useEffect(() => {
    let cancelled = false;
    void loadRecitationPaceStatsAsync().then((s) => {
      if (!cancelled) setStats(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const begin = useCallback((kind: RecitationTargetKind, targetId: string) => {
    startRecitationTimer(kind, targetId);
  }, []);

  const end = useCallback((kind: RecitationTargetKind, targetId: string) => {
    const sample = stopRecitationTimer(kind, targetId);
    setStats(loadRecitationPaceStats());
    return sample;
  }, []);

  const completePage = useCallback(
    async (args: {
      page: number;
      focusSurah: number;
      focusAyah: number;
      summary?: string;
    }) => {
      const sample = stopRecitationTimer("page", String(args.page));
      setStats(loadRecitationPaceStats());
      if (!reflectionEnabled) return { sample, pause: createIdleReflectionPause() };
      const next = await buildReflectionPause({
        ...args,
        enabled: true,
      });
      setPause(next);
      return { sample, pause: next };
    },
    [reflectionEnabled],
  );

  const dismissPause = useCallback(() => {
    setPause(dismissReflectionPause());
  }, []);

  const tooFast = useCallback(
    (kind: RecitationTargetKind, durationMs: number) => isReadingTooFast(kind, durationMs, stats),
    [stats],
  );

  return {
    stats,
    pause,
    begin,
    end,
    completePage,
    dismissPause,
    tooFast,
    reflectionEnabled,
  };
}
