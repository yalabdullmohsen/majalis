/**
 * Part 22 — Atomic progress mutation with transactional rollback.
 * Optimistic local apply + snapshot; if IndexedDB / secondary commit fails,
 * restore previous counters so rapid interactions leave no orphans/duplicates.
 * Logic-only — no UI.
 */

export type AtomicMutationResult<T> = {
  ok: boolean;
  rolledBack: boolean;
  value: T | null;
  error: string | null;
};

type Gate = {
  chain: Promise<void>;
};

const gates = new Map<string, Gate>();

function getGate(key: string): Gate {
  let g = gates.get(key);
  if (!g) {
    g = { chain: Promise.resolve() };
    gates.set(key, g);
  }
  return g;
}

/**
 * Serialize mutations on the same logical key (prevents double-count races).
 */
export async function withProgressGate<T>(
  key: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  const gate = getGate(key);
  let resolveNext!: () => void;
  const next = new Promise<void>((r) => {
    resolveNext = r;
  });
  const prev = gate.chain;
  gate.chain = prev.then(() => next);
  await prev;
  try {
    return await fn();
  } finally {
    resolveNext();
  }
}

/**
 * Snapshot → optimistic mutate → async commit. On commit failure, restore snapshot.
 */
export async function withAtomicProgressMutation<T>(opts: {
  key: string;
  snapshot: () => T;
  restore: (snap: T) => void;
  /** Optimistic apply (sync preferred). Returns the new value. */
  mutate: (snap: T) => T;
  /** Background persistence (IDB / secondary LS). Failure → rollback. */
  commit: (next: T, snap: T) => void | Promise<void>;
}): Promise<AtomicMutationResult<T>> {
  return withProgressGate(opts.key, async () => {
    const snap = opts.snapshot();
    let next: T;
    try {
      next = opts.mutate(snap);
    } catch (err) {
      return {
        ok: false,
        rolledBack: false,
        value: null,
        error: String((err as Error)?.message || err),
      };
    }

    try {
      await opts.commit(next, snap);
      return { ok: true, rolledBack: false, value: next, error: null };
    } catch (err) {
      try {
        opts.restore(snap);
      } catch {
        /* best-effort restore */
      }
      return {
        ok: false,
        rolledBack: true,
        value: null,
        error: String((err as Error)?.message || err),
      };
    }
  });
}

/** Deep-ish JSON clone for LS snapshots (progress counters are JSON-safe). */
export function cloneProgressSnapshot<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

/** Test helper */
export function resetProgressGatesForTests(): void {
  gates.clear();
}
