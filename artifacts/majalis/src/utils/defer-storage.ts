/**
 * Defer non-critical storage / IDB work off the critical rendering path.
 * Prefer requestIdleCallback; fall back to setTimeout(0).
 */

export type DeferredHandle = { cancel: () => void };

export function deferIdleWork(fn: () => void, opts?: { timeoutMs?: number }): DeferredHandle {
  const timeoutMs = opts?.timeoutMs ?? 2_000;
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    try {
      fn();
    } catch {
      /* silent */
    }
  };

  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: timeoutMs });
    return {
      cancel: () => {
        cancelled = true;
        try {
          window.cancelIdleCallback(id);
        } catch {
          /* ignore */
        }
      },
    };
  }

  const tid = setTimeout(run, 0);
  return {
    cancel: () => {
      cancelled = true;
      clearTimeout(tid);
    },
  };
}

/** Coalesce rapid writes: latest payload wins; flush on idle or maxWait. */
export function createWriteCoalescer<T>(opts: {
  write: (value: T) => void;
  maxWaitMs?: number;
  idleTimeoutMs?: number;
}): {
  enqueue: (value: T) => void;
  flush: () => void;
  dispose: () => void;
} {
  let pending: T | null = null;
  let idleHandle: DeferredHandle | null = null;
  let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  const maxWaitMs = opts.maxWaitMs ?? 2_500;

  const flush = () => {
    if (idleHandle) {
      idleHandle.cancel();
      idleHandle = null;
    }
    if (maxWaitTimer) {
      clearTimeout(maxWaitTimer);
      maxWaitTimer = null;
    }
    if (pending == null) return;
    const value = pending;
    pending = null;
    try {
      opts.write(value);
    } catch {
      /* silent */
    }
  };

  const enqueue = (value: T) => {
    pending = value;
    if (!idleHandle) {
      idleHandle = deferIdleWork(flush, { timeoutMs: opts.idleTimeoutMs ?? 1_200 });
    }
    if (!maxWaitTimer) {
      maxWaitTimer = setTimeout(flush, maxWaitMs);
    }
  };

  const dispose = () => {
    flush();
  };

  return { enqueue, flush, dispose };
}

/** True when running in a browser document (not SSR/prerender worker without DOM). */
export function isBrowserClient(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
