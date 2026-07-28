/**
 * Main-thread yielding for elite INP (Interaction to Next Paint).
 * Prefer `scheduler.yield()` when available; fall back to setTimeout(0).
 * Part 18: budget-aware slicing so long transforms stay under ~50ms.
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

/**
 * Time-budgeted transform — yields whenever a slice exceeds `budgetMs` (default 50).
 * Keeps long array work (roots, flashcard queues, tafseer refs) off long tasks.
 */
export async function mapWithTimeBudget<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => R,
  budgetMs = 50,
): Promise<R[]> {
  const out: R[] = [];
  let sliceStart = typeof performance !== "undefined" ? performance.now() : Date.now();
  for (let i = 0; i < items.length; i++) {
    out.push(mapper(items[i]!, i));
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - sliceStart >= budgetMs) {
      await yieldToMain();
      sliceStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    }
  }
  return out;
}

/** Side-effecting variant of mapWithTimeBudget. */
export async function forEachWithTimeBudget<T>(
  items: readonly T[],
  fn: (item: T, index: number) => void,
  budgetMs = 50,
): Promise<void> {
  await mapWithTimeBudget(
    items,
    (item, i) => {
      fn(item, i);
      return undefined;
    },
    budgetMs,
  );
}

/** Run a heavy async task after yielding so the triggering interaction paints first. */
export async function runAfterInteraction<T>(task: () => Promise<T> | T): Promise<T> {
  await afterNextPaint();
  return task();
}
