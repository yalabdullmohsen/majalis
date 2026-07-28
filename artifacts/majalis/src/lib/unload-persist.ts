/**
 * Unload-safe persistence — flush critical local snapshots on pagehide / freeze.
 * Uses synchronous LocalStorage first (never dropped on tab close), plus optional
 * navigator.sendBeacon / fetch(keepalive) for server-side telemetry mirrors.
 */

type SnapshotFn = () => Record<string, string> | null;

const writers = new Map<string, SnapshotFn>();
let bound = false;

function flushLocal(snapshots: Record<string, string>): void {
  if (typeof localStorage === "undefined") return;
  for (const [key, value] of Object.entries(snapshots)) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* quota — best effort */
    }
  }
}

/**
 * Mirror a small JSON payload to the server with keepalive so the browser
 * does not cancel the request when the tab closes. Falls back to sendBeacon.
 * Silent no-op when offline or APIs unavailable.
 */
export function keepalivePost(url: string, body: unknown): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;

  const payload = typeof body === "string" ? body : JSON.stringify(body);
  const blob = new Blob([payload], { type: "application/json" });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      if (navigator.sendBeacon(url, blob)) return true;
    }
  } catch {
    /* fall through */
  }

  try {
    void fetch(url, {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      credentials: "same-origin",
    });
    return true;
  } catch {
    return false;
  }
}

/** Register a named snapshot producer (idempotent overwrite). */
export function registerUnloadPersist(id: string, fn: SnapshotFn): () => void {
  writers.set(id, fn);
  ensureUnloadBinding();
  return () => {
    writers.delete(id);
  };
}

/** Collect + write all registered snapshots synchronously. */
export function flushUnloadPersist(): void {
  const merged: Record<string, string> = {};
  for (const fn of writers.values()) {
    try {
      const part = fn();
      if (part) Object.assign(merged, part);
    } catch {
      /* ignore bad producers */
    }
  }
  flushLocal(merged);
  // Server mirror is opt-in via keepalivePost from callers — no unknown endpoints.
}

function ensureUnloadBinding(): void {
  if (bound || typeof window === "undefined") return;
  if (typeof window.addEventListener !== "function") return;
  bound = true;

  const onHide = () => flushUnloadPersist();
  window.addEventListener("pagehide", onHide);
  window.addEventListener("beforeunload", onHide);
  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });
    // Page Lifecycle API — guarded (silent no-op if unsupported)
    try {
      document.addEventListener("freeze", onHide as EventListener);
    } catch {
      /* legacy */
    }
    try {
      document.addEventListener("resume", onHide as EventListener);
    } catch {
      /* resume flush is optional; hibernate module owns restore */
    }
  }
}

/** Sync write a single LS key (safe wrapper). */
export function persistLocalSync(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
