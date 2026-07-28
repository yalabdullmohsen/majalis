import { useCallback, useEffect, useState } from "react";
import {
  evictLruCache,
  inspectStorage,
  maybeAutoEvictStorage,
  touchCacheAccess,
  type EvictionResult,
  type StorageInspectorReport,
} from "@/lib/smart-cache-eviction";

/** Storage inspector + LRU eviction — logic only. */
export function useStorageInspector(opts?: { autoInspect?: boolean; autoEvict?: boolean }) {
  const [report, setReport] = useState<StorageInspectorReport | null>(null);
  const [lastEviction, setLastEviction] = useState<EvictionResult | null>(null);
  const [busy, setBusy] = useState(false);

  const inspect = useCallback(async () => {
    setBusy(true);
    try {
      const next = await inspectStorage();
      setReport(next);
      return next;
    } finally {
      setBusy(false);
    }
  }, []);

  const evict = useCallback(async (force = false) => {
    setBusy(true);
    try {
      const result = await evictLruCache({ force, maxRemovals: 40 });
      setLastEviction(result);
      const next = await inspectStorage();
      setReport(next);
      return result;
    } finally {
      setBusy(false);
    }
  }, []);

  const touch = useCallback((key: string) => {
    touchCacheAccess(key);
  }, []);

  useEffect(() => {
    if (opts?.autoInspect === false) return;
    void inspect();
  }, [opts?.autoInspect, inspect]);

  useEffect(() => {
    if (!opts?.autoEvict) return;
    void maybeAutoEvictStorage().then((r) => {
      if (r) setLastEviction(r);
    });
  }, [opts?.autoEvict]);

  return { report, lastEviction, busy, inspect, evict, touch };
}
