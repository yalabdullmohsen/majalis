/**
 * React hook facade for intent-based speculative prefetch.
 * Logic-only — attaches document observers; no visual changes.
 */
import { useEffect } from "react";
import {
  startSpeculativePrefetchObserver,
  type SpeculativePrefetchOptions,
} from "@/lib/speculative-prefetch";

export function useSpeculativePrefetch(enabled = true, opts?: SpeculativePrefetchOptions): void {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    return startSpeculativePrefetchObserver(opts);
  }, [enabled, opts?.minIntentMs, opts?.maxIntentMs]);
}
