/**
 * Frame-budget helpers — coalesce work into requestAnimationFrame.
 * Prevents layout thrashing from rapid scroll/audio/highlight updates.
 * Logic-only; no UI coupling.
 */

type RafCallback = (now: number) => void;

let rafId: number | null = null;
const queue: RafCallback[] = [];

function flush(now: number): void {
  rafId = null;
  const batch = queue.splice(0, queue.length);
  for (const fn of batch) {
    try {
      fn(now);
    } catch {
      /* never break the frame */
    }
  }
}

/** Schedule work on the next animation frame (coalesced). */
export function scheduleFrame(fn: RafCallback): void {
  queue.push(fn);
  if (typeof requestAnimationFrame !== "function") {
    // Node / tests — run sync on next microtask
    queueMicrotask(() => flush(performance.now?.() ?? Date.now()));
    return;
  }
  if (rafId != null) return;
  rafId = requestAnimationFrame(flush);
}

/** Cancel all pending frame callbacks (tests / teardown). */
export function clearFrameQueue(): void {
  queue.length = 0;
  if (rafId != null && typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(rafId);
  }
  rafId = null;
}

/**
 * Throttle a high-frequency event (scroll, timeupdate) to at most one
 * callback per animation frame. Returns a disposer.
 */
export function onFrameThrottled(
  target: EventTarget,
  type: string,
  handler: (ev: Event) => void,
  options?: AddEventListenerOptions,
): () => void {
  let pending: Event | null = null;
  let scheduled = false;

  const onEvent = (ev: Event) => {
    pending = ev;
    if (scheduled) return;
    scheduled = true;
    scheduleFrame(() => {
      scheduled = false;
      const e = pending;
      pending = null;
      if (e) handler(e);
    });
  };

  target.addEventListener(type, onEvent, options);
  return () => {
    target.removeEventListener(type, onEvent, options);
  };
}

/**
 * Run DOM reads then writes in separate frames to avoid forced reflow.
 * `read` may return data consumed by `write`.
 */
export function scheduleReadWrite<T>(
  read: () => T,
  write: (value: T) => void,
): void {
  scheduleFrame(() => {
    let value: T;
    try {
      value = read();
    } catch {
      return;
    }
    scheduleFrame(() => {
      try {
        write(value);
      } catch {
        /* ignore */
      }
    });
  });
}

/**
 * Interval-like ticker that only fires while the tab is visible and
 * aligns callbacks to rAF (never mid-frame setState storms).
 */
export function createFrameAlignedTicker(
  intervalMs: number,
  onTick: () => void,
): () => void {
  const minMs = Math.max(250, intervalMs);
  let last = 0;
  let stopped = false;
  let raf: number | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const hasBrowserRaf =
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function" &&
    typeof window.cancelAnimationFrame === "function" &&
    typeof document !== "undefined" &&
    typeof document.visibilityState === "string";

  if (!hasBrowserRaf) {
    intervalId = setInterval(() => {
      if (stopped) return;
      try {
        onTick();
      } catch {
        /* ignore */
      }
    }, minMs);
    return () => {
      stopped = true;
      if (intervalId != null) clearInterval(intervalId);
    };
  }

  const loop = (now: number) => {
    if (stopped) return;
    if (document.visibilityState === "hidden") {
      raf = window.requestAnimationFrame(loop);
      return;
    }
    if (now - last >= minMs) {
      last = now;
      try {
        onTick();
      } catch {
        /* ignore */
      }
    }
    raf = window.requestAnimationFrame(loop);
  };

  raf = window.requestAnimationFrame(loop);

  return () => {
    stopped = true;
    if (raf != null) window.cancelAnimationFrame(raf);
  };
}
