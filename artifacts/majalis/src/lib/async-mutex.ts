/**
 * Named async mutex — serializes critical lanes without blocking unrelated work.
 * Prefer navigator.locks when available; fall back to in-process queue.
 * Logic-only — no UI.
 */

type Lane =
  | "audio-resume"
  | "flashcard-sync"
  | "offline-pack"
  | "reading-pos"
  | "quota-evict"
  | "generic";

type Waiter = {
  resolve: () => void;
};

const queues = new Map<string, Waiter[]>();
const held = new Set<string>();

async function acquireLocal(name: string): Promise<() => void> {
  if (!held.has(name)) {
    held.add(name);
    return () => releaseLocal(name);
  }
  await new Promise<void>((resolve) => {
    const q = queues.get(name) ?? [];
    q.push({ resolve });
    queues.set(name, q);
  });
  held.add(name);
  return () => releaseLocal(name);
}

function releaseLocal(name: string): void {
  held.delete(name);
  const q = queues.get(name);
  if (!q || q.length === 0) return;
  const next = q.shift()!;
  if (q.length === 0) queues.delete(name);
  else queues.set(name, q);
  next.resolve();
}

/**
 * Run `fn` exclusively on `lane`. Concurrent callers on the same lane queue;
 * different lanes run in parallel (audio resume does not block flashcard sync).
 */
export async function withMutex<T>(lane: Lane | string, fn: () => Promise<T> | T): Promise<T> {
  const name = String(lane);

  // Cross-tab coordination when supported (Safari/Chrome). Same-origin only.
  const locksApi = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (locksApi && typeof locksApi.request === "function") {
    return locksApi.request(`majalis:${name}`, { mode: "exclusive" }, async () => fn());
  }

  const release = await acquireLocal(name);
  try {
    return await fn();
  } finally {
    release();
  }
}

/** Test helper — clears in-process queues (does not affect navigator.locks). */
export function resetMutexStateForTests(): void {
  queues.clear();
  held.clear();
}
