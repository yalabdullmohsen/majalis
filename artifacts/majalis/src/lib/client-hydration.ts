/**
 * Client-only hydration helpers — avoid SSR/prerender mismatches from
 * localStorage, Date, random, and media queries on first paint.
 */

import { useEffect, useState } from "react";

/**
 * False on first render (matches prerender/SSR shell), true after mount.
 * Use to gate client-only reads without visible layout thrash when the
 * gated content is non-visual state (reciter id, page pos, etc.).
 */
export function useClientReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

/**
 * Lazy-hydrate a value from a client-only source after mount.
 * `serverDefault` is used for the first paint (must be deterministic).
 */
export function useHydratedValue<T>(serverDefault: T, readClient: () => T): T {
  const [value, setValue] = useState<T>(serverDefault);
  useEffect(() => {
    try {
      setValue(readClient());
    } catch {
      /* keep default */
    }
  }, [readClient]);
  return value;
}

/**
 * One-shot: run client reader after mount; never during render.
 */
export function useAfterMountEffect(effect: () => void | (() => void)): void {
  useEffect(() => {
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Deterministic empty snapshot for useSyncExternalStore getServerSnapshot. */
export function emptyServerSnapshot<T>(value: T): () => T {
  return () => value;
}
