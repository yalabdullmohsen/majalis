/**
 * Private / Incognito storage guard — hybrid memory + sessionStorage fallback.
 * Prevents QuotaExceeded / SecurityError crashes when persistent storage is blocked.
 * Logic-only — no UI.
 */

export type StorageMode = "persistent" | "session-bridge" | "memory-only";

export type StorageProbeResult = {
  mode: StorageMode;
  localStorageOk: boolean;
  sessionStorageOk: boolean;
  idbOk: boolean;
  estimatedQuota: number | null;
  reasons: string[];
};

const memoryStore = new Map<string, string>();
let cachedProbe: StorageProbeResult | null = null;
let probing: Promise<StorageProbeResult> | null = null;

function tryWrite(storage: Storage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    const read = storage.getItem(key);
    storage.removeItem(key);
    return read === value;
  } catch {
    return false;
  }
}

async function probeIdb(): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  return new Promise((resolve) => {
    try {
      const name = `__majalis_idb_probe_${Date.now()}`;
      const req = indexedDB.open(name, 1);
      req.onerror = () => resolve(false);
      req.onblocked = () => resolve(false);
      req.onupgradeneeded = () => {
        try {
          req.result.createObjectStore("t");
        } catch {
          /* ignore */
        }
      };
      req.onsuccess = () => {
        try {
          req.result.close();
          indexedDB.deleteDatabase(name);
        } catch {
          /* ignore */
        }
        resolve(true);
      };
    } catch {
      resolve(false);
    }
  });
}

/**
 * Classify persistent vs private/restricted browsing.
 * Cached after first probe; call resetPrivateStorageProbeForTests() in tests.
 */
export async function probePrivateStorage(): Promise<StorageProbeResult> {
  if (cachedProbe) return cachedProbe;
  if (probing) return probing;

  probing = (async () => {
    const reasons: string[] = [];
    const probeKey = "__majalis_ls_probe__";
    const localStorageOk =
      typeof localStorage !== "undefined" && tryWrite(localStorage, probeKey, "1");
    const sessionStorageOk =
      typeof sessionStorage !== "undefined" && tryWrite(sessionStorage, probeKey, "1");

    if (!localStorageOk) reasons.push("localStorage-blocked");
    if (!sessionStorageOk) reasons.push("sessionStorage-blocked");

    let estimatedQuota: number | null = null;
    try {
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        estimatedQuota = est.quota ?? null;
        // Typical Chromium incognito quotas are tiny (often ≤ ~120MB, sometimes much less)
        if (estimatedQuota != null && estimatedQuota > 0 && estimatedQuota < 120_000_000) {
          reasons.push(`quota:${estimatedQuota}`);
        }
      }
    } catch {
      reasons.push("estimate-failed");
    }

    const idbOk = await probeIdb();
    if (!idbOk) reasons.push("idb-blocked");

    let mode: StorageMode = "persistent";
    if (!localStorageOk && sessionStorageOk) {
      mode = "session-bridge";
      reasons.push("incognito-session-bridge");
    } else if (!localStorageOk && !sessionStorageOk) {
      mode = "memory-only";
      reasons.push("incognito-memory-only");
    } else if (localStorageOk && !idbOk && estimatedQuota != null && estimatedQuota < 50_000_000) {
      // LS works but IDB/quota looks like restricted private session
      mode = "session-bridge";
      reasons.push("restricted-quota");
    }

    cachedProbe = {
      mode,
      localStorageOk,
      sessionStorageOk,
      idbOk,
      estimatedQuota,
      reasons,
    };
    return cachedProbe;
  })();

  try {
    return await probing;
  } finally {
    probing = null;
  }
}

/** Sync snapshot — may be stale until probePrivateStorage() has run. */
export function getStorageModeSync(): StorageMode {
  return cachedProbe?.mode ?? "persistent";
}

export function isPrivateBrowsingLikely(): boolean {
  const m = getStorageModeSync();
  return m === "session-bridge" || m === "memory-only";
}

/** Read with hybrid fallback: LS → session → memory. */
export function hybridGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem(key);
      if (v != null) return v;
    }
  } catch {
    /* blocked */
  }
  try {
    if (typeof sessionStorage !== "undefined") {
      const v = sessionStorage.getItem(key);
      if (v != null) {
        memoryStore.set(key, v);
        return v;
      }
    }
  } catch {
    /* blocked */
  }
  return memoryStore.get(key) ?? null;
}

/**
 * Write with seamless fallback — never throws.
 * Returns which tier accepted the write.
 */
export function hybridSetItem(key: string, value: string): StorageMode {
  // Always keep memory mirror for zero-exception runtime
  memoryStore.set(key, value);

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return cachedProbe?.mode === "session-bridge" ? "session-bridge" : "persistent";
    }
  } catch {
    /* quota / security */
  }

  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(key, value);
      if (!cachedProbe || cachedProbe.mode === "persistent") {
        cachedProbe = {
          mode: "session-bridge",
          localStorageOk: false,
          sessionStorageOk: true,
          idbOk: cachedProbe?.idbOk ?? false,
          estimatedQuota: cachedProbe?.estimatedQuota ?? null,
          reasons: [...(cachedProbe?.reasons ?? []), "ls-write-failed"],
        };
      }
      return "session-bridge";
    }
  } catch {
    /* blocked */
  }

  if (!cachedProbe || cachedProbe.mode !== "memory-only") {
    cachedProbe = {
      mode: "memory-only",
      localStorageOk: false,
      sessionStorageOk: false,
      idbOk: cachedProbe?.idbOk ?? false,
      estimatedQuota: cachedProbe?.estimatedQuota ?? null,
      reasons: [...(cachedProbe?.reasons ?? []), "all-persistent-failed"],
    };
  }
  return "memory-only";
}

export function hybridRemoveItem(key: string): void {
  memoryStore.delete(key);
  try {
    localStorage?.removeItem(key);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage?.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Kick probe once from app boot (non-blocking). */
export function startPrivateStorageGuard(): void {
  if (typeof window === "undefined") return;
  void probePrivateStorage();
}

export function resetPrivateStorageProbeForTests(): void {
  cachedProbe = null;
  probing = null;
  memoryStore.clear();
}
