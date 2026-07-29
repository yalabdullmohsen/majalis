/**
 * Shared Clean Architecture primitives for Majalis web (Vite + React).
 * Layers: domain ports → application use cases → infrastructure adapters → presentation.
 */

/** Lightweight success/failure without throwing across use-case boundaries. */
export type AppResult<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): AppResult<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): AppResult<never, E> {
  return { ok: false, error };
}

/** Marker for injectable application services composed at the DI root. */
export type ModuleFactory<T> = (overrides?: Partial<T>) => T;
