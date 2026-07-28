/**
 * Abort / generation helpers for watertight hook cleanups.
 * Logic-only — no UI / layout.
 */
import { useEffect, useRef, type DependencyList } from "react";

/**
 * Runs an async effect with AbortSignal; aborted on unmount or dep change.
 * Callers must check `signal.aborted` before setState.
 */
export function useAbortableEffect(
  effect: (signal: AbortSignal) => void | Promise<void>,
  deps: DependencyList,
): void {
  useEffect(() => {
    const ac = new AbortController();
    void Promise.resolve(effect(ac.signal)).catch((err: unknown) => {
      if (ac.signal.aborted) return;
      if (err && typeof err === "object" && (err as { name?: string }).name === "AbortError") return;
    });
    return () => ac.abort();
    // deps intentionally controlled by caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Monotonic generation — ignore stale async results after remount/dep change. */
export function useGenerationToken(): {
  next: () => number;
  isCurrent: (gen: number) => boolean;
} {
  const genRef = useRef(0);
  return {
    next: () => {
      genRef.current += 1;
      return genRef.current;
    },
    isCurrent: (gen: number) => gen === genRef.current,
  };
}
