import { useCallback, useEffect, useState } from "react";
import { isOnline } from "@/lib/offline-db";
import { withOfflineFallback } from "@/lib/offline-content-store";
import { useIsOnline } from "@/hooks/useNetworkStatus";

/**
 * Generic offline-first reader for any content key.
 * Returns cached data when the network fails — never surfaces a thrown error.
 * Online flag comes from the shared network store (no duplicate listeners).
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
  const online = useIsOnline();

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const result = await withOfflineFallback({
      fetchOnline: options.fetchOnline,
      readCache: options.readCache,
      writeCache: options.writeCache,
    });
    setData(result.data);
    setFromCache(result.fromCache);
    setLoading(false);
  }, [enabled, options.fetchOnline, options.readCache, options.writeCache]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (online) void reload();
  }, [online, reload]);

  return { data, fromCache, loading, online: online && isOnline(), reload };
}
