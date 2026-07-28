/**
 * Route-scoped AbortController map — cancel in-flight work on fast navigation.
 * Logic-only — no UI.
 */

type ScopeEntry = {
  controller: AbortController;
  generation: number;
};

const scopes = new Map<string, ScopeEntry>();
let globalGeneration = 0;

/** Begin (or replace) an abort scope for a route/key. Aborts the previous controller. */
export function beginAbortScope(scopeKey: string): AbortSignal {
  const prev = scopes.get(scopeKey);
  try {
    prev?.controller.abort();
  } catch {
    /* ignore */
  }
  const controller = new AbortController();
  const generation = ++globalGeneration;
  scopes.set(scopeKey, { controller, generation });
  return controller.signal;
}

/** Abort a scope without creating a new one. */
export function abortScope(scopeKey: string): void {
  const prev = scopes.get(scopeKey);
  if (!prev) return;
  try {
    prev.controller.abort();
  } catch {
    /* ignore */
  }
  scopes.delete(scopeKey);
}

/** Abort all scopes (hard navigation / app teardown). */
export function abortAllScopes(): void {
  for (const key of [...scopes.keys()]) abortScope(key);
}

export function getScopeSignal(scopeKey: string): AbortSignal | null {
  return scopes.get(scopeKey)?.controller.signal ?? null;
}

/**
 * Guard a promise so late resolution is ignored after abort / unmount.
 * Returns undefined when aborted or generation mismatch.
 */
export async function guardAsync<T>(
  signal: AbortSignal | null | undefined,
  work: (signal: AbortSignal) => Promise<T>,
): Promise<T | undefined> {
  if (signal?.aborted) return undefined;
  const local = signal ?? new AbortController().signal;
  try {
    const result = await work(local);
    if (local.aborted) return undefined;
    return result;
  } catch (err) {
    if (local.aborted || (err as { name?: string })?.name === "AbortError") return undefined;
    throw err;
  }
}

/**
 * React-friendly: create a mount generation token.
 * Call bump() on unmount; isCurrent() before setState.
 */
export function createMountGuard(): {
  signal: AbortSignal;
  isCurrent: () => boolean;
  abort: () => void;
} {
  const controller = new AbortController();
  let alive = true;
  return {
    signal: controller.signal,
    isCurrent: () => alive && !controller.signal.aborted,
    abort: () => {
      alive = false;
      try {
        controller.abort();
      } catch {
        /* ignore */
      }
    },
  };
}

export function resetAbortScopesForTests(): void {
  abortAllScopes();
  globalGeneration = 0;
}
