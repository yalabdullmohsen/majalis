/**
 * Main-thread yielding for elite INP (Interaction to Next Paint).
 * Prefer `scheduler.yield()` / `postTask` when available.
 * Part 20: sub-16ms input ack — defer state commits off the event handler.
 * Logic-only — no UI.
 */

type SchedulerWithYield = {
  yield?: () => Promise<void>;
  postTask?: <T>(
    fn: () => T,
    opts?: { priority?: "user-blocking" | "user-visible" | "background" },
  ) => Promise<T>;
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
 * Schedule work after the current input event is acknowledged (<1 frame / 16ms).
 * Uses scheduler.postTask(user-blocking) when available, else queueMicrotask + setTimeout(0).
 */
export function scheduleInputAck<T>(task: () => T | Promise<T>): Promise<T> {
  const sched = getScheduler();
  if (sched?.postTask) {
    return sched.postTask(() => Promise.resolve(task()).then((v) => v), {
      priority: "user-blocking",
    }) as Promise<T>;
  }
  return new Promise((resolve, reject) => {
    // Microtask lets the event handler return (INP start→end) before heavy work
    queueMicrotask(() => {
      setTimeout(() => {
        try {
          Promise.resolve(task()).then(resolve, reject);
        } catch (err) {
          reject(err);
        }
      }, 0);
    });
  });
}

/**
 * Optimistic UI commit first (sync), then run heavy persistence via scheduleInputAck.
 * Keeps INP under one frame budget for tap-to-read / bookmark / play controls.
 */
export function commitAfterInput<T>(
  syncOptimistic: () => void,
  heavy: () => T | Promise<T>,
): Promise<T> {
  syncOptimistic();
  return scheduleInputAck(heavy);
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
