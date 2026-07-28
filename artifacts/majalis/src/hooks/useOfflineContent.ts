import { useCallback, useEffect, useRef, useState } from "react";
import { isOnline } from "@/lib/offline-db";
import { withOfflineFallback } from "@/lib/offline-content-store";
import { useAbortableEffect } from "@/hooks/useAbortableEffect";

/**
 * Generic offline-first reader for any content key.
 * Returns cached data when the network fails — never surfaces a thrown error.
 * Abort/generation-safe across remounts and rapid reload().
 */
export function useOfflineContent<T>(options: {
  enabled?: boolean;
  fetchOnline: () => Promise<T>;
  readCache: () => Promise<T | null>;
  writeCache?: (value: T) => Promise<void>;
}) {
  const enabled = options.enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [online, setOnline] = useState(isOnline());
  const genRef = useRef(0);
  const optsRef = useRef(options);
  optsRef.current = options;

  const reload = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) return;
    const myGen = ++genRef.current;
    setLoading(true);
    const o = optsRef.current;
    const result = await withOfflineFallback({
      fetchOnline: o.fetchOnline,
      readCache: o.readCache,
      writeCache: o.writeCache,
    });
    if (signal?.aborted || myGen !== genRef.current) return;
    setData(result.data);
    setFromCache(result.fromCache);
    setLoading(false);
  }, [enabled]);

  useAbortableEffect(
    (signal) => {
      void reload(signal);
    },
    [reload],
  );

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      void reload();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      genRef.current += 1; // invalidate in-flight on unmount
    };
  }, [reload]);

  return { data, fromCache, loading, online, reload };
}