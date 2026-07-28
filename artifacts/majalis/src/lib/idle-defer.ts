/**
 * Schedule non-critical work after first paint — requestIdleCallback with timeout fallback.
 */

export type IdleHandle = { cancel: () => void };

export function scheduleIdle(fn: () => void, opts?: { timeoutMs?: number; delayMs?: number }): IdleHandle {
  const timeoutMs = opts?.timeoutMs ?? 4_000;
  const delayMs = opts?.delayMs ?? 0;
  let idleId: number | null = null;
  let timeoutId: number | null = null;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;
    try {
      fn();
    } catch {
      /* never throw into idle path */
    }
  };

  const start = () => {
    if (cancelled) return;
    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run, { timeout: timeoutMs });
    } else {
      timeoutId = window.setTimeout(run, Math.min(timeoutMs, 2_500));
    }
  };

  if (delayMs > 0) {
    timeoutId = window.setTimeout(start, delayMs);
  } else {
    start();
  }

  return {
    cancel: () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    },
  };
}

/** True after first animation frame (paint) — useful to gate hydrations. */
export function afterFirstPaint(fn: () => void): IdleHandle {
  let raf = 0;
  let cancelled = false;
  if (typeof window === "undefined") {
    return { cancel: () => undefined };
  }
  raf = window.requestAnimationFrame(() => {
    raf = window.requestAnimationFrame(() => {
      if (!cancelled) scheduleIdle(fn, { timeoutMs: 3_000 });
    });
  });
  return {
    cancel: () => {
      cancelled = true;
      if (raf) window.cancelAnimationFrame(raf);
    },
  };
}
