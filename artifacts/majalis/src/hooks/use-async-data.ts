import { useCallback, useEffect, useRef, useState } from "react";
import { RequestManager } from "@/lib/request-manager";
import { beginAbortScope, abortScope } from "@/lib/route-abort";
import { logDiagnostic } from "@/lib/diagnostics";

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
 * Part 16: route-scoped abort + generation guard against unmounted setState.
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
  const scopeKey = dedupeKey ?? key;

  const load = useCallback(async () => {
    if (!enabled) {
      setStatus("success");
      return;
    }

    const gen = ++generation.current;
    setStatus("loading");
    setError(null);
    const signal = beginAbortScope(`async:${scopeKey}`);

    try {
      const result = await RequestManager.run(
        key,
        (sig) => {
          // Prefer route abort; also honor RequestManager signal
          const combined = signal.aborted ? signal : sig;
          return loader(combined);
        },
        { dedupeKey: scopeKey, timeoutMs },
      );
      if (gen !== generation.current || signal.aborted) return;

      const isEmpty = emptyWhen ? emptyWhen(result) : Array.isArray(result) && result.length === 0;
      setData(result);
      setStatus(isEmpty ? "empty" : "success");
      if (isEmpty) setError(emptyMessage);
    } catch (err) {
      if (gen !== generation.current) return;
      if ((err as { name?: string })?.name === "AbortError" || signal.aborted) {
        logDiagnostic("nav-abort", scopeKey);
        return;
      }
      setError(String((err as Error)?.message || err));
      setStatus("error");
    }
  }, [enabled, key, loader, scopeKey, timeoutMs, emptyWhen, emptyMessage]);

  useEffect(() => {
    void load();
    return () => {
      generation.current++;
      abortScope(`async:${scopeKey}`);
      RequestManager.cancel(scopeKey);
    };
  }, [load, scopeKey]);

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
