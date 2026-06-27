import { useCallback, useEffect, useRef, useState } from "react";
import { RequestManager } from "@/lib/request-manager";

export type AsyncStatus = "loading" | "success" | "error" | "empty";

export type UseAsyncDataOptions<T> = {
  enabled?: boolean;
  initialData?: T;
  emptyWhen?: (data: T) => boolean;
  emptyMessage?: string;
  dedupeKey?: string;
  timeoutMs?: number;
};

export type UseAsyncDataResult<T> = {
  data: T | undefined;
  status: AsyncStatus;
  error: string | null;
  retry: () => void;
  isLoading: boolean;
};

/**
 * Guaranteed terminal state within timeout — never infinite loading.
 */
export function useAsyncData<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
  options: UseAsyncDataOptions<T> = {},
): UseAsyncDataResult<T> {
  const {
    enabled = true,
    initialData,
    emptyWhen,
    emptyMessage = "لا توجد بيانات حالياً",
    dedupeKey,
    timeoutMs,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [status, setStatus] = useState<AsyncStatus>(initialData !== undefined ? "success" : "loading");
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) {
      setStatus("success");
      return;
    }

    const gen = ++generation.current;
    setStatus("loading");
    setError(null);

    try {
      const result = await RequestManager.run(key, loader, { dedupeKey: dedupeKey ?? key, timeoutMs });
      if (gen !== generation.current) return;

      const isEmpty = emptyWhen ? emptyWhen(result) : Array.isArray(result) && result.length === 0;
      setData(result);
      setStatus(isEmpty ? "empty" : "success");
      if (isEmpty) setError(emptyMessage);
    } catch (err) {
      if (gen !== generation.current) return;
      setError(String((err as Error)?.message || err));
      setStatus("error");
    }
  }, [enabled, key, loader, dedupeKey, timeoutMs, emptyWhen, emptyMessage]);

  useEffect(() => {
    void load();
    return () => {
      generation.current++;
      if (dedupeKey ?? key) RequestManager.cancel(dedupeKey ?? key);
    };
  }, [load, key, dedupeKey]);

  const retry = useCallback(() => {
    void load();
  }, [load]);

  return {
    data,
    status,
    error,
    retry,
    isLoading: status === "loading",
  };
}
