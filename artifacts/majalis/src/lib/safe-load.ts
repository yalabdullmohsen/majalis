import { RequestManager } from "@/lib/request-manager";
import { userMessageFromLoadError } from "@/lib/load-failure";

type SafeLoadOptions = {
  label: string;
  timeoutMs?: number;
  /** إعادة محاولة صامتة واحدة قبل إبلاغ المستخدم (افتراضي: نعم) */
  silentRetry?: boolean;
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
  const silentRetry = opts.silentRetry !== false;

  const runOnce = () =>
    RequestManager.run(opts.label, () => loader(), { timeoutMs: opts.timeoutMs });

  void (async () => {
    try {
      const data = await runOnce();
      if (!cancelled) onSuccess(data);
    } catch (err) {
      if (cancelled) return;
      if (silentRetry) {
        try {
          const data = await runOnce();
          if (!cancelled) onSuccess(data);
          return;
        } catch (err2) {
          if (!cancelled) onError?.(userMessageFromLoadError(err2));
          return;
        }
      }
      onError?.(userMessageFromLoadError(err));
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => {
    cancelled = true;
    RequestManager.cancel(opts.label);
  };
}
