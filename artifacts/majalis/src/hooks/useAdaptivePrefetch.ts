import { useCallback, useEffect, useState } from "react";
import {
  cancelScheduledPrefetch,
  getPrefetchStatus,
  runAdaptivePrefetch,
  scheduleAdaptivePrefetch,
  type PrefetchPosition,
  type PrefetchStatus,
} from "@/lib/adaptive-offline-prefetch";

/**
 * Predictive offline prefetch — watches reading position.
 * Logic only; call `watch(position)` from readers without UI changes.
 */
export function useAdaptivePrefetch(opts?: { autoWatch?: PrefetchPosition | null }) {
  const [status, setStatus] = useState<PrefetchStatus>(() => getPrefetchStatus());

  const refresh = useCallback(() => {
    setStatus(getPrefetchStatus());
  }, []);

  const watch = useCallback((position: PrefetchPosition) => {
    scheduleAdaptivePrefetch(position);
    // optimistic status
    setStatus((s) => ({ ...s, lastPosition: position }));
  }, []);

  const runNow = useCallback(async (position: PrefetchPosition) => {
    const next = await runAdaptivePrefetch(position);
    setStatus(next);
    return next;
  }, []);

  useEffect(() => {
    if (opts?.autoWatch?.surah) {
      watch(opts.autoWatch);
    }
    return () => cancelScheduledPrefetch();
  }, [opts?.autoWatch?.surah, opts?.autoWatch?.ayah, opts?.autoWatch?.page, watch]);

  return { status, watch, runNow, refresh };
}
