/**
 * Memory pressure & Page Lifecycle guard.
 * Uses performance.memory (Chrome), navigator.deviceMemory, freeze/resume,
 * and storage pressure to purge non-active caches on low-RAM devices.
 * Logic-only — never touches UI.
 */

import { maybeAutoEvictStorage, evictLruCache } from "@/lib/smart-cache-eviction";
import { clearNormalizeArabicCache } from "@/shared/arabic-normalize";

export type MemoryPressureLevel = "ok" | "moderate" | "critical";

export type MemorySnapshot = {
  level: MemoryPressureLevel;
  jsHeapUsed?: number;
  jsHeapLimit?: number;
  heapRatio?: number;
  deviceMemoryGb?: number;
  frozen: boolean;
  at: string;
};

type PressureListener = (snap: MemorySnapshot) => void;

const listeners = new Set<PressureListener>();
let frozen = false;
let bound = false;
let lastSnap: MemorySnapshot = {
  level: "ok",
  frozen: false,
  at: new Date().toISOString(),
};

type PerfMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

function readPerfMemory(): PerfMemory | null {
  try {
    const perf = performance as Performance & { memory?: PerfMemory };
    if (perf?.memory && typeof perf.memory.usedJSHeapSize === "number") {
      return perf.memory;
    }
  } catch {
    /* unsupported */
  }
  return null;
}

export function getMemorySnapshot(): MemorySnapshot {
  const mem = readPerfMemory();
  const deviceMemoryGb =
    typeof navigator !== "undefined" && typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number"
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
      : undefined;

  let level: MemoryPressureLevel = "ok";
  let heapRatio: number | undefined;
  let jsHeapUsed: number | undefined;
  let jsHeapLimit: number | undefined;

  if (mem) {
    jsHeapUsed = mem.usedJSHeapSize;
    jsHeapLimit = mem.jsHeapSizeLimit;
    heapRatio = mem.jsHeapSizeLimit > 0 ? mem.usedJSHeapSize / mem.jsHeapSizeLimit : 0;
    if (heapRatio >= 0.9) level = "critical";
    else if (heapRatio >= 0.75) level = "moderate";
  }

  // Low-RAM phones (≤2GB) start at moderate when tab is frozen/hidden long
  if (deviceMemoryGb != null && deviceMemoryGb <= 2 && (frozen || level === "ok")) {
    if (frozen) level = level === "critical" ? "critical" : "moderate";
  }

  lastSnap = {
    level,
    jsHeapUsed,
    jsHeapLimit,
    heapRatio,
    deviceMemoryGb,
    frozen,
    at: new Date().toISOString(),
  };
  return lastSnap;
}

function emit(snap: MemorySnapshot): void {
  lastSnap = snap;
  for (const l of listeners) {
    try {
      l(snap);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Purge non-active ephemeral state under pressure.
 * Never touches protected user data (streaks, bookmarks, khatmah, SM-2).
 */
export async function relieveMemoryPressure(level: MemoryPressureLevel = "moderate"): Promise<void> {
  try {
    // Drop Arabic normalize memo (rebuildable)
    clearNormalizeArabicCache();
  } catch {
    /* ignore */
  }

  try {
    // Clear session-only search / transient caches
    if (typeof sessionStorage !== "undefined") {
      const doomed: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (!k) continue;
        if (
          k.startsWith("hadith_cdn_") ||
          k.startsWith("mj-tmp-") ||
          k.startsWith("majalis-search-") ||
          k.includes("prefetch")
        ) {
          doomed.push(k);
        }
      }
      for (const k of doomed) {
        try {
          sessionStorage.removeItem(k);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }

  try {
    if (level === "critical") {
      await evictLruCache({ targetUsageRatio: 0.55, maxRemovals: 60, force: true });
    } else {
      await maybeAutoEvictStorage();
      await evictLruCache({ targetUsageRatio: 0.7, maxRemovals: 25 });
    }
  } catch {
    /* ignore */
  }

  // Hint GC when available (non-standard)
  try {
    const g = globalThis as unknown as { gc?: () => void };
    g.gc?.();
  } catch {
    /* ignore */
  }
}

function onFreeze(): void {
  frozen = true;
  const snap = getMemorySnapshot();
  emit(snap);
  void relieveMemoryPressure(snap.level === "ok" ? "moderate" : snap.level);
}

function onResume(): void {
  frozen = false;
  emit(getMemorySnapshot());
}

function onVisibility(): void {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "hidden") {
    const snap = getMemorySnapshot();
    if (snap.level !== "ok" || (snap.deviceMemoryGb != null && snap.deviceMemoryGb <= 2)) {
      void relieveMemoryPressure(snap.level === "critical" ? "critical" : "moderate");
    }
  }
}

/** Subscribe to pressure changes. Returns unsubscribe. */
export function subscribeMemoryPressure(listener: PressureListener): () => void {
  listeners.add(listener);
  ensureMemoryPressureBinding();
  return () => {
    listeners.delete(listener);
  };
}

export function getLastMemorySnapshot(): MemorySnapshot {
  return lastSnap;
}

export function ensureMemoryPressureBinding(): void {
  if (bound || typeof window === "undefined") return;
  if (typeof window.addEventListener !== "function") return;
  bound = true;

  document.addEventListener("freeze", onFreeze as EventListener);
  document.addEventListener("resume", onResume as EventListener);
  document.addEventListener("visibilitychange", onVisibility);

  // Periodic soft check (cheap) — every 90s while visible
  const intervalId = window.setInterval(() => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    const snap = getMemorySnapshot();
    if (snap.level !== lastSnap.level) emit(snap);
    if (snap.level === "critical") void relieveMemoryPressure("critical");
  }, 90_000);
  // Allow Node test process to exit
  try {
    const t = intervalId as unknown as { unref?: () => void };
    t.unref?.();
  } catch {
    /* ignore */
  }

  emit(getMemorySnapshot());
}
