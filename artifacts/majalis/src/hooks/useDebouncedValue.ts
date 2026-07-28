/**
 * Debounce / throttle helpers + AbortController-aware search effect hook.
 */
import { useEffect, useRef, useState } from "react";

/** قيمة مؤجَّلة لتأخير البحث/الفلترة أثناء الكتابة. */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Run an async effect after debounce; aborts previous run on change/unmount.
 * `fn` receives an AbortSignal — throw/return early when aborted.
 */
export function useDebouncedAbortableEffect(
  deps: unknown[],
  fn: (signal: AbortSignal) => void | Promise<void>,
  delayMs = 350,
): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void Promise.resolve(fnRef.current(controller.signal)).catch((err) => {
        if ((err as Error)?.name === "AbortError") return;
        /* swallow — callers handle their own UI errors */
      });
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps array
  }, deps);
}

/** Throttle a callback to at most once per `waitMs` (leading edge). */
export function throttleFn<T extends (...args: never[]) => void>(fn: T, waitMs: number): T {
  let last = 0;
  let timer: number | null = null;
  let pending: Parameters<T> | null = null;
  const wrapped = ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = waitMs - (now - last);
    if (remaining <= 0) {
      if (timer != null) {
        window.clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn(...args);
    } else {
      pending = args;
      if (timer == null) {
        timer = window.setTimeout(() => {
          last = Date.now();
          timer = null;
          if (pending) {
            const p = pending;
            pending = null;
            fn(...p);
          }
        }, remaining);
      }
    }
  }) as T;
  return wrapped;
}
