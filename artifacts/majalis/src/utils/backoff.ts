/**
 * Exponential backoff with full jitter — shared by RequestManager and offline queue.
 * Pure functions; no UI / CSS.
 */

export type BackoffOptions = {
  /** Attempt index starting at 0 */
  attempt: number;
  /** Base delay in ms (default 200) */
  baseMs?: number;
  /** Cap delay in ms (default 8_000) */
  maxMs?: number;
  /** Multiplier per attempt (default 2) */
  factor?: number;
  /** 0 = no jitter, 1 = full jitter (default 1) */
  jitter?: number;
};

/** Compute delay for a given attempt. */
export function computeBackoffMs(opts: BackoffOptions): number {
  const base = Math.max(0, opts.baseMs ?? 200);
  const max = Math.max(base, opts.maxMs ?? 8_000);
  const factor = opts.factor ?? 2;
  const jitter = Math.min(1, Math.max(0, opts.jitter ?? 1));
  const exp = Math.min(max, base * Math.pow(factor, Math.max(0, opts.attempt)));
  if (jitter <= 0) return Math.round(exp);
  const randomized = exp * (1 - jitter) + Math.random() * exp * jitter;
  return Math.round(Math.min(max, Math.max(0, randomized)));
}

/** Sleep with optional AbortSignal. */
export function sleepWithBackoff(
  opts: BackoffOptions,
  signal?: AbortSignal,
): Promise<void> {
  const ms = computeBackoffMs(opts);
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    if (ms <= 0) {
      resolve();
      return;
    }
    const id = globalThis.setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      "abort",
      () => {
        globalThis.clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
