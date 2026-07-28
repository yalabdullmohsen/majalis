/**
 * Single passive scroll + rAF bus — one listener, zero per-event allocations
 * for shared scroll metrics. Logic-only — no UI.
 */

export type ScrollSample = {
  scrollY: number;
  /** 0–100 document reading progress */
  progressPct: number;
  pastThreshold: boolean;
};

type Listener = (sample: ScrollSample) => void;

/** Shared mutable sample — listeners must not retain references across frames. */
const sample: ScrollSample = { scrollY: 0, progressPct: 0, pastThreshold: false };

const listeners = new Set<Listener>();
let bound = false;
let rafId: number | null = null;
let thresholdPx = 120;

function readIntoSample(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const el = document.documentElement;
  const y = window.scrollY || el.scrollTop || 0;
  const total = el.scrollHeight - el.clientHeight;
  sample.scrollY = y;
  sample.progressPct =
    total <= 0 ? 0 : Math.min(100, Math.round((y / Math.max(1, total)) * 100));
  sample.pastThreshold = y > thresholdPx;
}

function flush(): void {
  rafId = null;
  readIntoSample();
  for (const fn of listeners) {
    try {
      fn(sample);
    } catch {
      /* ignore */
    }
  }
}

function onScroll(): void {
  if (rafId != null) return;
  if (typeof requestAnimationFrame === "function") {
    rafId = requestAnimationFrame(flush);
  } else {
    rafId = setTimeout(flush, 16) as unknown as number;
  }
}

function ensureBound(): void {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener("scroll", onScroll, { passive: true });
  readIntoSample();
}

/** Subscribe to coalesced scroll samples (rAF). */
export function subscribeScrollBus(listener: Listener): () => void {
  ensureBound();
  listeners.add(listener);
  // Immediate sync sample (same object — copy fields if storing)
  try {
    listener(sample);
  } catch {
    /* ignore */
  }
  return () => {
    listeners.delete(listener);
  };
}

export function getScrollSample(): Readonly<ScrollSample> {
  readIntoSample();
  return sample;
}

export function setScrollThreshold(px: number): void {
  thresholdPx = Math.max(0, px);
}

/** Test helper */
export function resetScrollBusForTests(): void {
  listeners.clear();
  if (rafId != null) {
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(rafId);
    else clearTimeout(rafId);
    rafId = null;
  }
  bound = false;
}
