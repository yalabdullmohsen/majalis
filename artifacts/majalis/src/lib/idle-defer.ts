/**
 * Idle-time execution — requestIdleCallback with timeout fallback.
 * Respects page visibility + power-saver so background work never steals
 * scroll/interaction frames.
 */

export type IdleTaskOptions = {
  /** Max wait before forcing run (ms). Default 4000. */
  timeoutMs?: number;
  /** Skip while document.hidden unless force. */
  requireVisible?: boolean;
  /** Skip when power-saver says throttleBackground (best-effort dynamic import). */
  respectPowerSaver?: boolean;
  /** Label for diagnostics */
  label?: string;
};

export type IdleHandle = { cancel: () => void };

type IdleDeadlineLike = { didTimeout: boolean; timeRemaining: () => number };

function canRunBackground(opts: IdleTaskOptions): boolean {
  if (typeof document !== "undefined" && opts.requireVisible !== false) {
    if (document.visibilityState === "hidden") return false;
  }
  return true;
}

async function powerSaverBlocks(): Promise<boolean> {
  try {
    const { getPowerSaverState } = await import("@/lib/power-saver-engine");
    const s = getPowerSaverState();
    return Boolean(s.throttleBackground && s.documentHidden && s.mode === "aggressive");
  } catch {
    return false;
  }
}

/**
 * Schedule non-essential work for browser idle periods.
 * Returns a cancel handle.
 */
export function runWhenIdle(
  task: (deadline?: IdleDeadlineLike) => void,
  opts: IdleTaskOptions = {},
): IdleHandle {
  let cancelled = false;
  let ricId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const run = (deadline?: IdleDeadlineLike) => {
    if (cancelled) return;
    if (!canRunBackground(opts)) {
      // Re-arm when tab may become visible again
      timeoutId = setTimeout(() => {
        void (async () => {
          if (cancelled) return;
          if (opts.respectPowerSaver !== false && (await powerSaverBlocks())) {
            timeoutId = setTimeout(() => run(), 5_000);
            return;
          }
          if (!canRunBackground(opts)) {
            timeoutId = setTimeout(() => run(), 2_000);
            return;
          }
          task(deadline);
        })();
      }, 2_000);
      return;
    }
    void (async () => {
      if (opts.respectPowerSaver !== false && (await powerSaverBlocks())) {
        if (cancelled) return;
        timeoutId = setTimeout(() => run(), 5_000);
        return;
      }
      if (cancelled) return;
      try {
        task(deadline);
      } catch {
        /* never break idle loop */
      }
    })();
  };

  const timeoutMs = opts.timeoutMs ?? 4_000;

  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    ricId = window.requestIdleCallback((d) => run(d), { timeout: timeoutMs });
  } else {
    timeoutId = setTimeout(() => run({ didTimeout: true, timeRemaining: () => 0 }), Math.min(timeoutMs, 2_500));
  }

  return {
    cancel: () => {
      cancelled = true;
      if (ricId != null && typeof window !== "undefined" && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(ricId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    },
  };
}

/** Promise form — resolves after idle task completes (or cancel rejects). */
export function whenIdle(opts?: IdleTaskOptions): Promise<IdleDeadlineLike | undefined> {
  return new Promise((resolve, reject) => {
    const handle = runWhenIdle((d) => resolve(d), opts);
    // Expose cancel via rare path
    void handle;
    if (opts?.timeoutMs === 0) {
      handle.cancel();
      reject(new DOMException("Aborted", "AbortError"));
    }
  });
}

/**
 * Yield to the browser between heavy loop iterations.
 * Uses scheduler.yield when available, else setTimeout(0).
 */
export function yieldToMain(): Promise<void> {
  const sched = (globalThis as unknown as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (sched?.yield) return sched.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Process an array in idle slices — keeps scrolling responsive.
 */
export async function mapInIdleSlices<T, R>(
  items: T[],
  mapper: (item: T, index: number) => R,
  opts?: { sliceSize?: number; signal?: AbortSignal; timeoutMs?: number },
): Promise<R[]> {
  const sliceSize = Math.max(1, opts?.sliceSize ?? 32);
  const out: R[] = [];
  for (let i = 0; i < items.length; i += sliceSize) {
    if (opts?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    await new Promise<void>((resolve) => {
      runWhenIdle(
        () => {
          const end = Math.min(items.length, i + sliceSize);
          for (let j = i; j < end; j++) out.push(mapper(items[j], j));
          resolve();
        },
        { timeoutMs: opts?.timeoutMs ?? 1_000, requireVisible: true },
      );
    });
    await yieldToMain();
  }
  return out;
}
