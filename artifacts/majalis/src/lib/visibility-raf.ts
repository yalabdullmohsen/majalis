/**
 * Part 22 — Visibility-aware animation frame controller.
 * Freezes rAF instantly when document.hidden (cancelAnimationFrame),
 * resumes on visible. Used by throttled loops & waveform meters.
 * Logic-only — no UI.
 */

type FrameHandle = {
  cancel: () => void;
};

const loops = new Set<{
  resume: () => void;
  pause: () => void;
  cancelled: boolean;
}>();

let visibilityBound = false;

function ensureVisibilityBridge(): void {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      for (const loop of loops) {
        if (!loop.cancelled) loop.pause();
      }
    } else {
      for (const loop of loops) {
        if (!loop.cancelled) loop.resume();
      }
    }
  });
}

export function isDocumentHidden(): boolean {
  return typeof document !== "undefined" && document.hidden === true;
}

/**
 * Start an rAF loop that hard-pauses (cancelAnimationFrame) while hidden.
 * `tick` is never called in the background.
 */
export function startVisibilityAwareRafLoop(
  tick: (now: number) => void,
): FrameHandle {
  ensureVisibilityBridge();
  let raf = 0;
  let cancelled = false;
  let running = false;

  const frame = (now: number) => {
    if (cancelled || isDocumentHidden()) {
      running = false;
      raf = 0;
      return;
    }
    tick(now);
    raf = requestAnimationFrame(frame);
  };

  const resume = () => {
    if (cancelled || running || isDocumentHidden()) return;
    if (typeof requestAnimationFrame !== "function") return;
    running = true;
    raf = requestAnimationFrame(frame);
  };

  const pause = () => {
    running = false;
    if (raf && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const entry = { resume, pause, cancelled: false };
  loops.add(entry);

  if (!isDocumentHidden()) resume();

  return {
    cancel() {
      cancelled = true;
      entry.cancelled = true;
      pause();
      loops.delete(entry);
    },
  };
}

/**
 * Wrap setInterval so it clears while hidden and restarts when visible.
 */
export function startVisibilityAwareInterval(
  fn: () => void,
  ms: number,
): FrameHandle {
  ensureVisibilityBridge();
  let id: ReturnType<typeof setInterval> | null = null;
  let cancelled = false;

  const pause = () => {
    if (id != null) {
      clearInterval(id);
      id = null;
    }
  };

  const resume = () => {
    if (cancelled || id != null || isDocumentHidden()) return;
    id = setInterval(fn, ms);
  };

  const entry = { resume, pause, cancelled: false };
  loops.add(entry);
  if (!isDocumentHidden()) resume();

  return {
    cancel() {
      cancelled = true;
      entry.cancelled = true;
      pause();
      loops.delete(entry);
    },
  };
}

/** Test helper */
export function resetVisibilityRafForTests(): void {
  for (const loop of [...loops]) {
    loop.cancelled = true;
    loop.pause();
  }
  loops.clear();
  visibilityBound = false;
}
