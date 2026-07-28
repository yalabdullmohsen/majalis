/**
 * Feature detection — silent fallbacks for restricted WebViews / legacy browsers.
 * Logic-only — no UI.
 */

const cache = new Map<string, boolean>();

function memo(key: string, fn: () => boolean): boolean {
  const hit = cache.get(key);
  if (hit != null) return hit;
  let ok = false;
  try {
    ok = fn();
  } catch {
    ok = false;
  }
  cache.set(key, ok);
  return ok;
}

export function hasServiceWorker(): boolean {
  return memo("sw", () => typeof navigator !== "undefined" && "serviceWorker" in navigator);
}

export function hasStoragePersist(): boolean {
  return memo("persist", () =>
    typeof navigator !== "undefined" &&
    !!navigator.storage &&
    typeof navigator.storage.persist === "function",
  );
}

export function hasIndexedDB(): boolean {
  return memo("idb", () => typeof indexedDB !== "undefined");
}

export function hasLocalStorage(): boolean {
  return memo("ls", () => {
    if (typeof localStorage === "undefined") return false;
    const k = "__mj_ls_probe__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  });
}

export function hasWebCryptoSubtle(): boolean {
  return memo("subtle", () =>
    typeof crypto !== "undefined" && !!crypto.subtle && typeof crypto.subtle.digest === "function",
  );
}

export function hasIntersectionObserver(): boolean {
  return memo("io", () => typeof IntersectionObserver !== "undefined");
}

export function hasAbortSignalTimeout(): boolean {
  return memo("ast", () => typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function");
}

export function hasRandomUUID(): boolean {
  return memo("uuid", () => typeof crypto !== "undefined" && typeof crypto.randomUUID === "function");
}

/** AbortSignal.timeout polyfill — never throws on missing API. */
export function abortTimeout(ms: number): AbortSignal {
  if (hasAbortSignalTimeout()) return AbortSignal.timeout(ms);
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  // Prevent unhandled timer if aborted early — best effort
  c.signal.addEventListener("abort", () => clearTimeout(t), { once: true });
  return c.signal;
}

/** crypto.randomUUID fallback. */
export function safeRandomUUID(): string {
  if (hasRandomUUID()) return crypto.randomUUID();
  return `mj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createIntersectionObserverSafe(
  cb: IntersectionObserverCallback,
  opts?: IntersectionObserverInit,
): IntersectionObserver | null {
  if (!hasIntersectionObserver()) return null;
  try {
    return new IntersectionObserver(cb, opts);
  } catch {
    return null;
  }
}

export function resetFeatureDetectForTests(): void {
  cache.clear();
}
