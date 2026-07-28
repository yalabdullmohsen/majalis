import { useCallback, useEffect, useState } from "react";
import {
  applyContentDelta,
  loadDeltaSyncState,
  runDeltaSync,
  type ContentDeltaPack,
  type DeltaSyncState,
} from "@/lib/delta-content-sync";
import { useAbortableEffect } from "@/hooks/useAbortableEffect";
import { shouldDeferBackgroundWork } from "@/lib/battery-throttle";
import { scheduleNonCriticalWork } from "@/lib/power-saver-engine";

/** Delta offline sync — logic only. Abort-safe on unmount. */
export function useDeltaSync(opts?: { autoRunOnMount?: boolean; packIds?: string[] }) {
  const [state, setState] = useState<DeltaSyncState>(() => loadDeltaSyncState());
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<{ packs: number; ops: number } | null>(null);

  const refresh = useCallback(() => {
    setState(loadDeltaSyncState());
  }, []);

  const sync = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return null;
    setSyncing(true);
    try {
      const result = await runDeltaSync({ packIds: opts?.packIds });
      if (signal?.aborted) return null;
      setLastResult(result);
      refresh();
      return result;
    } finally {
      if (!signal?.aborted) setSyncing(false);
    }
  }, [opts?.packIds, refresh]);

  const applyLocal = useCallback(
    async (pack: ContentDeltaPack) => {
      const ops = await applyContentDelta(pack);
      refresh();
      return ops;
    },
    [refresh],
  );

  useAbortableEffect(
    (signal) => {
      if (!opts?.autoRunOnMount) return;
      const run = () => {
        void sync(signal);
      };
      if (shouldDeferBackgroundWork()) scheduleNonCriticalWork(run);
      else run();
    },
    [opts?.autoRunOnMount, sync],
  );

  // Keep syncing false if unmounted mid-flight without abort path
  useEffect(() => () => setSyncing(false), []);

  return { state, syncing, lastResult, sync, applyLocal, refresh };
}