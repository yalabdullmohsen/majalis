/**
 * High-frequency gesture helpers — passive listeners + rAF coalescing.
 * Logic-only; no layout/CSS.
 */

export type RafThrottleHandle = {
  /** Schedule work for next animation frame (coalesces). */
  schedule: (fn: () => void) => void;
  /** Cancel pending frame. */
  cancel: () => void;
};

/** Coalesce bursty input into one callback per animation frame. */
export function createRafThrottle(): RafThrottleHandle {
  let rafId: number | null = null;
  let pending: (() => void) | null = null;

  return {
    schedule(fn: () => void) {
      pending = fn;
      if (rafId != null) return;
      if (typeof requestAnimationFrame !== "function") {
        const run = pending;
        pending = null;
        run?.();
        return;
      }
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const run = pending;
        pending = null;
        run?.();
      });
    },
    cancel() {
      if (rafId != null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafId);
      }
      rafId = null;
      pending = null;
    },
  };
}

/**
 * Attach a passive scroll listener with rAF-throttled handler.
 * Returns unsubscribe.
 */
export function addPassiveScrollListener(
  target: Window | Document | HTMLElement,
  handler: () => void,
): () => void {
  const throttle = createRafThrottle();
  const onScroll = () => throttle.schedule(handler);
  target.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    target.removeEventListener("scroll", onScroll);
    throttle.cancel();
  };
}

export type SwipeAxis = "horizontal" | "vertical";

export type PassiveSwipeOptions = {
  axis?: SwipeAxis;
  /** Min delta in px to count as swipe. Default 55. */
  thresholdPx?: number;
  onSwipe: (dir: "next" | "prev") => void;
  /** RTL reading: finger left → next page. Default true. */
  rtl?: boolean;
};

/**
 * Passive touchstart/touchend swipe (no preventDefault — keeps scroll smooth).
 * Decision runs on rAF so the gesture paint is not blocked.
 */
export function addPassiveSwipeListener(
  el: HTMLElement,
  opts: PassiveSwipeOptions,
): () => void {
  const threshold = opts.thresholdPx ?? 55;
  const rtl = opts.rtl !== false;
  const axis = opts.axis ?? "horizontal";
  let startX = 0;
  let startY = 0;
  let active = false;
  const throttle = createRafThrottle();

  const onStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    startX = t.clientX;
    startY = t.clientY;
    active = true;
  };

  const onEnd = (e: TouchEvent) => {
    if (!active) return;
    active = false;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    throttle.schedule(() => {
      if (axis === "horizontal") {
        if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;
        const next = rtl ? dx < 0 : dx > 0;
        opts.onSwipe(next ? "next" : "prev");
      } else {
        if (Math.abs(dy) < threshold || Math.abs(dy) < Math.abs(dx)) return;
        opts.onSwipe(dy < 0 ? "next" : "prev");
      }
    });
  };

  el.addEventListener("touchstart", onStart, { passive: true });
  el.addEventListener("touchend", onEnd, { passive: true });
  el.addEventListener("touchcancel", () => {
    active = false;
  }, { passive: true });

  return () => {
    el.removeEventListener("touchstart", onStart);
    el.removeEventListener("touchend", onEnd);
    throttle.cancel();
  };
}
