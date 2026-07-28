import { useCallback, useEffect, useState } from "react";
import {
  applyContentDelta,
  loadDeltaSyncState,
  runDeltaSync,
  type ContentDeltaPack,
  type DeltaSyncState,
} from "@/lib/delta-content-sync";

/** Delta offline sync — logic only. */
export function useDeltaSync(opts?: { autoRunOnMount?: boolean; packIds?: string[] }) {
  const [state, setState] = useState<DeltaSyncState>(() => loadDeltaSyncState());
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<{ packs: number; ops: number } | null>(null);

  const refresh = useCallback(() => {
    setState(loadDeltaSyncState());
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await runDeltaSync({ packIds: opts?.packIds });
      setLastResult(result);
      refresh();
      return result;
    } finally {
      setSyncing(false);
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

  useEffect(() => {
    if (opts?.autoRunOnMount) void sync();
  }, [opts?.autoRunOnMount, sync]);

  return { state, syncing, lastResult, sync, applyLocal, refresh };
}
