/**
 * Part 22 — Native memory pressure observer.
 * Watches `performance.memory` heap ratios and optional Memory Pressure /
 * device Memory Status signals; triggers aggressive cache purges before
 * the OS kills the tab. Logic-only — no UI.
 */

export type MemoryPressureLevel = "normal" | "moderate" | "critical";

export type MemorySnapshot = {
  usedJsHeapSize: number | null;
  totalJsHeapSize: number | null;
  jsHeapSizeLimit: number | null;
  /** used / limit when available (0..1). */
  heapRatio: number | null;
  level: MemoryPressureLevel;
  deviceMemoryGb: number | null;
  at: number;
};

export type MemoryPressureListener = (snap: MemorySnapshot) => void;

type PerfMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

const MODERATE_RATIO = 0.7;
const CRITICAL_RATIO = 0.85;

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;
let lastLevel: MemoryPressureLevel = "normal";
const listeners = new Set<MemoryPressureListener>();
let lastPurgeAt = 0;

export function readMemorySnapshot(): MemorySnapshot {
  const at = Date.now();
  let used: number | null = null;
  let total: number | null = null;
  let limit: number | null = null;
  let ratio: number | null = null;

  try {
    const mem = (performance as Performance & { memory?: PerfMemory }).memory;
    if (mem && mem.jsHeapSizeLimit > 0) {
      used = mem.usedJSHeapSize;
      total = mem.totalJSHeapSize;
      limit = mem.jsHeapSizeLimit;
      ratio = used / limit;
    }
  } catch {
    /* unsupported */
  }

  let deviceMemoryGb: number | null = null;
  try {
    const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (typeof dm === "number" && dm > 0) deviceMemoryGb = dm;
  } catch {
    /* ignore */
  }

  let level: MemoryPressureLevel = "normal";
  if (ratio != null) {
    if (ratio >= CRITICAL_RATIO) level = "critical";
    else if (ratio >= MODERATE_RATIO) level = "moderate";
  } else if (deviceMemoryGb != null && deviceMemoryGb <= 2) {
    // Low-RAM devices: treat as moderate baseline when heap API missing
    level = "moderate";
  }

  return {
    usedJsHeapSize: used,
    totalJsHeapSize: total,
    jsHeapSizeLimit: limit,
    heapRatio: ratio,
    level,
    deviceMemoryGb,
    at,
  };
}

export function classifyHeapRatio(ratio: number | null): MemoryPressureLevel {
  if (ratio == null) return "normal";
  if (ratio >= CRITICAL_RATIO) return "critical";
  if (ratio >= MODERATE_RATIO) return "moderate";
  return "normal";
}

/**
 * Aggressive purge pipeline — inactive audio hints, normalize LRU,
 * fetch dedupe, ephemeral LS/IDB via smart eviction.
 */
export async function purgeUnderMemoryPressure(
  level: MemoryPressureLevel = "critical",
): Promise<{ actions: string[] }> {
  const actions: string[] = [];
  const now = Date.now();
  // Coalesce bursts (min 8s between full purges)
  if (now - lastPurgeAt < 8_000 && level !== "critical") {
    return { actions: ["coalesced"] };
  }
  lastPurgeAt = now;

  try {
    const { clearNormalizeArabicCache } = await import("@/shared/arabic-normalize");
    clearNormalizeArabicCache();
    actions.push("arabic-normalize-cache");
  } catch {
    /* ignore */
  }

  try {
    const { clearDedupePool } = await import("@/lib/lru-cache");
    clearDedupePool();
    actions.push("fetch-dedupe-pool");
  } catch {
    /* ignore */
  }

  try {
    const { clearQuranCache } = await import("@/lib/quran-api");
    clearQuranCache();
    actions.push("quran-ttl-cache");
  } catch {
    /* ignore */
  }

  try {
    const { clearPrewarmState } = await import("@/lib/resource-prewarm");
    clearPrewarmState();
    actions.push("prewarm-audio");
  } catch {
    /* ignore */
  }

  if (level === "critical" || level === "moderate") {
    try {
      const { maybeAutoEvictStorage } = await import("@/lib/smart-cache-eviction");
      await maybeAutoEvictStorage();
      actions.push("smart-cache-evict");
    } catch {
      /* ignore */
    }
  }

  if (level === "critical") {
    try {
      const { clearMemoryStorageCache } = await import("@/lib/storage-reconciler");
      clearMemoryStorageCache();
      actions.push("memory-storage-cache");
    } catch {
      /* ignore */
    }
  }

  // Quran Engine resource lifecycle — suspend prefetch, purge ephemeral media, budget eviction
  try {
    const { handleQuranMemoryPressure } = await import(
      "@/lib/quran-offline/resource-lifecycle"
    );
    const q = await handleQuranMemoryPressure(level);
    actions.push(...q.actions);
  } catch {
    /* ignore */
  }

  return { actions };
}

function emit(snap: MemorySnapshot): void {
  for (const fn of listeners) {
    try {
      fn(snap);
    } catch {
      /* ignore */
    }
  }
}

async function tick(): Promise<void> {
  const snap = readMemorySnapshot();
  if (snap.level !== lastLevel) {
    lastLevel = snap.level;
    emit(snap);
    if (snap.level === "moderate" || snap.level === "critical") {
      void purgeUnderMemoryPressure(snap.level);
    }
  } else if (snap.level === "critical") {
    // Re-purge periodically while stuck critical
    void purgeUnderMemoryPressure("critical");
    emit(snap);
  }
}

function onVisibility(): void {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    // Soft purge when backgrounded — OS may reclaim soon
    const snap = readMemorySnapshot();
    if (snap.level !== "normal" || (snap.deviceMemoryGb != null && snap.deviceMemoryGb <= 4)) {
      void purgeUnderMemoryPressure(snap.level === "normal" ? "moderate" : snap.level);
    }
  }
}

function bindPressureEvents(): void {
  if (typeof window === "undefined") return;
  // Experimental / Chromium: pressure observer may not exist — feature-detect
  try {
    const w = window as Window & {
      onmemorypressure?: ((ev: Event) => void) | null;
      addEventListener: Window["addEventListener"];
    };
    w.addEventListener("memorypressure", () => {
      lastLevel = "critical";
      const snap = { ...readMemorySnapshot(), level: "critical" as const };
      emit(snap);
      void purgeUnderMemoryPressure("critical");
    });
  } catch {
    /* ignore */
  }
  document.addEventListener("visibilitychange", onVisibility);
}

export function subscribeMemoryPressure(fn: MemoryPressureListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Start polling + event listeners once. */
export function startMemoryPressureObserver(opts?: {
  intervalMs?: number;
}): void {
  if (typeof window === "undefined" || started) return;
  started = true;
  bindPressureEvents();
  const ms = Math.max(5_000, opts?.intervalMs ?? 15_000);
  void tick();
  timer = setInterval(() => {
    void tick();
  }, ms);
}

export function stopMemoryPressureObserver(): void {
  started = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  lastLevel = "normal";
}

export function getLastMemoryPressureLevel(): MemoryPressureLevel {
  return lastLevel;
}

/** Test helpers */
export function resetMemoryPressureForTests(): void {
  stopMemoryPressureObserver();
  listeners.clear();
  lastPurgeAt = 0;
  lastLevel = "normal";
}
