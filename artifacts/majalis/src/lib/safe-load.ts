/**
 * Safe load helper for legacy useEffect + setLoading patterns.
 * Guarantees setLoading(false) and timeout/retry via RequestManager.
 */

import { RequestManager } from "@/lib/request-manager";

type SafeLoadOptions = {
  label: string;
  timeoutMs?: number;
};

export function safeLoadEffect<T>(
  setLoading: (v: boolean) => void,
  loader: () => Promise<T>,
  onSuccess: (data: T) => void,
  onError?: (message: string) => void,
  opts: SafeLoadOptions = { label: "load" },
): () => void {
  let cancelled = false;
  setLoading(true);

  void RequestManager.run(opts.label, () => loader(), { timeoutMs: opts.timeoutMs })
    .then((data) => {
      if (!cancelled) onSuccess(data);
    })
    .catch((err) => {
      if (!cancelled) onError?.(String((err as Error)?.message || err));
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

  return () => {
    cancelled = true;
    RequestManager.cancel(opts.label);
  };
}
