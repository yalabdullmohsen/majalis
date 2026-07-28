/**
 * Monotonic clocks for dwell / session duration / audio interpolation.
 * Prefer performance.now() so wall-clock jumps cannot create negative durations.
 * Logic-only — no UI.
 */

/** Monotonic milliseconds since navigation start (or Date.now fallback). */
export function monoNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

/** Elapsed ms since `start` (monoNow value). Never negative. */
export function monoElapsed(start: number, end: number = monoNow()): number {
  const d = end - start;
  return d > 0 && Number.isFinite(d) ? d : 0;
}

/**
 * Wall-clock stamps for persistence calendars.
 * Use only when a human-readable absolute time is required.
 */
export function wallNowMs(): number {
  return Date.now();
}
