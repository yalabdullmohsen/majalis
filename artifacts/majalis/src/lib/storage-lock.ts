/**
 * Concurrent state mutex — serializes rapid async actions (bookmarks, reciter, page skip).
 * Uses navigator.locks when available; falls back to per-key in-tab promise chains.
 */

type Release = () => void;

const localChains = new Map<string, Promise<unknown>>();

async function acquireLocal(key: string): Promise<Release> {
  const prev = localChains.get(key) ?? Promise.resolve();
  let release!: Release;
  const gate = new Promise<void>((resolve) => {
    release = () => resolve();
  });
  const next = prev.then(() => gate);
  localChains.set(
    key,
    next.catch(() => undefined).then(() => {
      if (localChains.get(key) === next) localChains.delete(key);
    }),
  );
  await prev.catch(() => undefined);
  return release;
}

/**
 * Run `fn` exclusively for `key`. Out-of-order callers wait their turn so the
 * latest intended write still lands in FIFO order (no lost updates).
 */
export async function withStorageLock<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
  const lockName = `majalis:${key}`;

  if (typeof navigator !== "undefined" && typeof navigator.locks?.request === "function") {
    try {
      return await navigator.locks.request(lockName, { mode: "exclusive" }, async () => fn());
    } catch {
      /* fall through to local chain */
    }
  }

  const release = await acquireLocal(lockName);
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * Generation-token helper for race-prone async loads.
 * Increment on each new request; ignore results from stale generations.
 */
export function createGenerationGuard() {
  let gen = 0;
  return {
    next(): number {
      gen += 1;
      return gen;
    },
    isCurrent(token: number): boolean {
      return token === gen;
    },
    get current(): number {
      return gen;
    },
  };
}

/**
 * Mutex for sync critical sections (toggle bookmark in same tick).
 */
const syncGates = new Map<string, boolean>();

export function withSyncMutex<T>(key: string, fn: () => T): T {
  if (syncGates.get(key)) {
    // Nested/re-entrant: run anyway but do not nest-lock
    return fn();
  }
  syncGates.set(key, true);
  try {
    return fn();
  } finally {
    syncGates.delete(key);
  }
}

/** Test helper */
export function _clearLocalLockChains(): void {
  localChains.clear();
  syncGates.clear();
}
