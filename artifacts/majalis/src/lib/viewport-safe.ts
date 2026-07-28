/**
 * Debounced viewport / orientation change safety for layout-dependent recalcs.
 * Avoids main-thread storms during rapid mobile rotate/resize. Logic-only — no UI.
 */

export type ViewportListener = (info: {
  width: number;
  height: number;
  orientation: string;
}) => void;

export type ViewportSubscription = {
  unsubscribe: () => void;
};

type Options = {
  /** Debounce ms (default 120). */
  debounceMs?: number;
  /** Also listen to visualViewport if available. */
  visualViewport?: boolean;
};

function readInfo() {
  const width = typeof window !== "undefined" ? window.innerWidth : 0;
  const height = typeof window !== "undefined" ? window.innerHeight : 0;
  let orientation = "unknown";
  try {
    orientation =
      (screen as Screen & { orientation?: { type?: string } }).orientation?.type ||
      (width >= height ? "landscape" : "portrait");
  } catch {
    orientation = width >= height ? "landscape" : "portrait";
  }
  return { width, height, orientation };
}

/**
 * Subscribe to debounced resize + orientationchange.
 * Callbacks coalesce to one invocation after the quiet window.
 */
export function subscribeViewportSafe(
  listener: ViewportListener,
  opts: Options = {},
): ViewportSubscription {
  if (typeof window === "undefined") {
    return { unsubscribe: () => undefined };
  }
  const debounceMs = opts.debounceMs ?? 120;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastEmitted = "";

  const emit = () => {
    timer = null;
    const info = readInfo();
    const key = `${info.width}x${info.height}:${info.orientation}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    try {
      listener(info);
    } catch {
      /* ignore */
    }
  };

  const schedule = () => {
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(emit, debounceMs);
  };

  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });

  let vv: VisualViewport | null = null;
  if (opts.visualViewport !== false && window.visualViewport) {
    vv = window.visualViewport;
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
  }

  return {
    unsubscribe: () => {
      if (timer != null) clearTimeout(timer);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      if (vv) {
        vv.removeEventListener("resize", schedule);
        vv.removeEventListener("scroll", schedule);
      }
    },
  };
}

/**
 * React-friendly: returns a stable subscribe helper for useEffect.
 * Does not import React — callers wire useState themselves.
 */
export function createDebouncedFlag(
  predicate: (width: number) => boolean,
  initial: boolean,
  opts?: Options,
): {
  get: () => boolean;
  subscribe: (onChange: (v: boolean) => void) => () => void;
} {
  let value = initial;
  return {
    get: () => value,
    subscribe: (onChange) => {
      const sub = subscribeViewportSafe((info) => {
        const next = predicate(info.width);
        if (next !== value) {
          value = next;
          onChange(next);
        }
      }, opts);
      return () => sub.unsubscribe();
    },
  };
}

/**
 * Pause a recurring visualizer/analyser tick during orientation storms,
 * then resume after debounce settles.
 */
export function createOrientationSafeTicker(
  tick: () => void,
  intervalMs: number,
  opts?: { stormMs?: number },
): { start: () => void; stop: () => void } {
  const stormMs = opts?.stormMs ?? 200;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let stormTimer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let pausedForStorm = false;

  const clearStorm = () => {
    if (stormTimer) clearTimeout(stormTimer);
    stormTimer = null;
  };

  const resume = () => {
    pausedForStorm = false;
    clearStorm();
    if (running && intervalId == null) {
      intervalId = setInterval(tick, intervalMs);
    }
  };

  const onStorm = () => {
    pausedForStorm = true;
    if (intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    clearStorm();
    stormTimer = setTimeout(resume, stormMs);
  };

  let viewportUnsub: (() => void) | null = null;

  return {
    start: () => {
      running = true;
      if (!pausedForStorm && intervalId == null) {
        intervalId = setInterval(tick, intervalMs);
      }
      if (!viewportUnsub) {
        const sub = subscribeViewportSafe(onStorm, { debounceMs: 0 });
        // debounceMs 0 still schedules via setTimeout(0) — use raw listeners for storm
        sub.unsubscribe();
        const scheduleStorm = () => onStorm();
        window.addEventListener("orientationchange", scheduleStorm, { passive: true });
        window.addEventListener("resize", scheduleStorm, { passive: true });
        viewportUnsub = () => {
          window.removeEventListener("orientationchange", scheduleStorm);
          window.removeEventListener("resize", scheduleStorm);
        };
      }
    },
    stop: () => {
      running = false;
      if (intervalId != null) clearInterval(intervalId);
      intervalId = null;
      clearStorm();
      viewportUnsub?.();
      viewportUnsub = null;
    },
  };
}
