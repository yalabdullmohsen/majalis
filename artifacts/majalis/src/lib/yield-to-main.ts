/**
 * Main-thread yielding for elite INP (Interaction to Next Paint).
 * Prefer `scheduler.yield()` when available; fall back to setTimeout(0).
 * Logic-only — no UI.
 */

type SchedulerWithYield = {
  yield?: () => Promise<void>;
  postTask?: <T>(fn: () => T, opts?: { priority?: string }) => Promise<T>;
};

function getScheduler(): SchedulerWithYield | undefined {
  if (typeof globalThis === "undefined") return undefined;
  return (globalThis as { scheduler?: SchedulerWithYield }).scheduler;
}

/** Yield so the browser can paint click/touch feedback within ~50ms. */
export function yieldToMain(): Promise<void> {
  const sched = getScheduler();
  if (sched?.yield) return sched.yield();
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Wait until after the next paint (double rAF), then optionally yield.
 * Use right after optimistic UI state updates so paint lands before heavy work.
 */
export function afterNextPaint(): Promise<void> {
  if (typeof requestAnimationFrame !== "function") return yieldToMain();
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void yieldToMain().then(resolve);
      });
    });
  });
}

/**
 * Process items in chunks, yielding between chunks so long loops
 * (tafseer maps, juz segments, search highlight) do not block INP.
 */
export async function mapInChunks<T, R>(
  items: readonly T[],
  chunkSize: number,
  mapper: (item: T, index: number) => R,
): Promise<R[]> {
  const size = Math.max(1, chunkSize | 0);
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    if (i > 0) await yieldToMain();
    const end = Math.min(i + size, items.length);
    for (let j = i; j < end; j++) {
      out.push(mapper(items[j]!, j));
    }
  }
  return out;
}

/** Run a heavy async task after yielding so the triggering interaction paints first. */
export async function runAfterInteraction<T>(task: () => Promise<T> | T): Promise<T> {
  await afterNextPaint();
  return task();
}

/** عمل غير مرئي بعد الرسم — تسجيل SW / تسخين.origin */
export function scheduleOnIdle(cb: () => void, timeout = 2000): void {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => cb(), { timeout });
    return;
  }
  setTimeout(cb, 1);
}
