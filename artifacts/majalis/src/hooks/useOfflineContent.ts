import { useCallback, useEffect, useState } from "react";
import { isOnline } from "@/lib/offline-db";
import { withOfflineFallback, withOfflineFirst } from "@/lib/offline-content-store";

/**
 * Generic offline-first reader for any content key.
 * Default: IndexedDB أولًا ثم الشبكة إن كان الكاش فارغًا.
 */
export function useOfflineContent<T>(options: {
  enabled?: boolean;
  /** cache-first (افتراضي) أو network-first */
  strategy?: "cache-first" | "network-first";
  fetchOnline: () => Promise<T>;
  readCache: () => Promise<T | null>;
  writeCache?: (value: T) => Promise<void>;
}) {
  const enabled = options.enabled !== false;
  const strategy = options.strategy ?? "cache-first";
  const [data, setData] = useState<T | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [online, setOnline] = useState(isOnline());

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const runner = strategy === "network-first" ? withOfflineFallback : withOfflineFirst;
    const result = await runner({
      fetchOnline: options.fetchOnline,
      readCache: options.readCache,
      writeCache: options.writeCache,
    });
    setData(result.data);
    setFromCache(result.fromCache);
    setLoading(false);
  }, [enabled, strategy, options.fetchOnline, options.readCache, options.writeCache]);

  useEffect(() => {
    void reload();
  }, [reload]);

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
    };
  }, [reload]);

  return { data, fromCache, loading, online, reload };
}
