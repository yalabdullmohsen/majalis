/**
 * Central feature detection — silent fallbacks, zero console noise.
 * Logic-only — no UI.
 */

export type FeatureName =
  | "compressionStream"
  | "performanceObserver"
  | "webLocks"
  | "intersectionObserver"
  | "requestIdleCallback"
  | "broadcastChannel"
  | "indexedDB"
  | "pageLifecycle";

const cache = new Map<FeatureName, boolean>();

export function supports(feature: FeatureName): boolean {
  const hit = cache.get(feature);
  if (hit != null) return hit;
  let ok = false;
  try {
    switch (feature) {
      case "compressionStream":
        ok =
          typeof CompressionStream !== "undefined" &&
          typeof DecompressionStream !== "undefined";
        break;
      case "performanceObserver":
        ok = typeof PerformanceObserver !== "undefined";
        break;
      case "webLocks":
        ok = typeof navigator !== "undefined" && !!navigator.locks?.request;
        break;
      case "intersectionObserver":
        ok = typeof IntersectionObserver !== "undefined";
        break;
      case "requestIdleCallback":
        ok = typeof requestIdleCallback === "function";
        break;
      case "broadcastChannel":
        ok = typeof BroadcastChannel !== "undefined";
        break;
      case "indexedDB":
        ok = typeof indexedDB !== "undefined";
        break;
      case "pageLifecycle":
        ok =
          typeof document !== "undefined" &&
          ("onfreeze" in document || "onresume" in document);
        break;
      default:
        ok = false;
    }
  } catch {
    ok = false;
  }
  cache.set(feature, ok);
  return ok;
}

/** Safe IntersectionObserver factory — returns null when unsupported. */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
): IntersectionObserver | null {
  if (!supports("intersectionObserver")) return null;
  try {
    return new IntersectionObserver(callback, options);
  } catch {
    return null;
  }
}

/** Safe PerformanceObserver — returns null when unsupported. */
export function createPerformanceObserver(
  callback: PerformanceObserverCallback,
  entryTypes: string[],
): PerformanceObserver | null {
  if (!supports("performanceObserver")) return null;
  try {
    const po = new PerformanceObserver(callback);
    po.observe({ entryTypes, buffered: true } as PerformanceObserverInit);
    return po;
  } catch {
    try {
      const po = new PerformanceObserver(callback);
      po.observe({ type: entryTypes[0]!, buffered: true } as PerformanceObserverInit);
      return po;
    } catch {
      return null;
    }
  }
}

/** requestIdleCallback with setTimeout fallback. */
export function scheduleIdle(cb: () => void, timeoutMs = 2_000): void {
  if (supports("requestIdleCallback")) {
    requestIdleCallback(() => cb(), { timeout: timeoutMs });
  } else {
    setTimeout(cb, Math.min(timeoutMs, 64));
  }
}

export function resetFeatureDetectForTests(): void {
  cache.clear();
}
