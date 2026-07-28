/**
 * Resource Lifecycle & Memory Pressure Manager for the Quran Engine.
 * Runs entirely via idle callbacks + pressure events — no UI.
 *
 * Responsibilities:
 * 1. Suspend prefetch / warm on memory pressure
 * 2. Purge ephemeral canvases + audio object URLs
 * 3. Enforce 500MB (configurable) LRU/LFU asset budget
 * 4. Schedule idle compaction + silent schema migrations
 */
import type { MemoryPressureLevel, MemorySnapshot } from "@/lib/memory-pressure";
import { purgeEphemeralMediaResources } from "@/lib/quran-offline/ephemeral-registry";
import { enforceStorageBudget } from "@/lib/quran-offline/asset-eviction";
import { scheduleIdleCompaction } from "@/lib/quran-offline/compaction";
import { runSilentSchemaMigrations } from "@/lib/quran-offline/schema-migrate";
import {
  isQuranIndexingSuspended,
  isQuranPrefetchSuspended,
  setQuranIndexingSuspended,
  setQuranPrefetchSuspended,
} from "@/lib/quran-offline/lifecycle-flags";

let started = false;
let lifecycleAbort: AbortController | null = null;
let unsubPressure: (() => void) | null = null;
let compactCancel: (() => void) | null = null;
let maintenanceTimer: ReturnType<typeof setTimeout> | null = null;

const MAINTENANCE_EVERY_MS = 45 * 60 * 1000;

export { isQuranPrefetchSuspended, isQuranIndexingSuspended };

/** AbortSignal cancelled when pressure rises — warm loops should observe it. */
export function getLifecycleAbortSignal(): AbortSignal | null {
  return lifecycleAbort?.signal ?? null;
}

export function suspendQuranBackgroundWork(reason = "pressure"): void {
  setQuranPrefetchSuspended(true);
  setQuranIndexingSuspended(true);
  if (!lifecycleAbort) lifecycleAbort = new AbortController();
  try {
    lifecycleAbort.abort(reason);
  } catch {
    lifecycleAbort.abort();
  }
  // Fresh controller for subsequent work after resume
  lifecycleAbort = new AbortController();
}

export function resumeQuranBackgroundWork(): void {
  setQuranPrefetchSuspended(false);
  setQuranIndexingSuspended(false);
  if (!lifecycleAbort || lifecycleAbort.signal.aborted) {
    lifecycleAbort = new AbortController();
  }
}

async function onPressure(snap: MemorySnapshot): Promise<void> {
  if (snap.level === "normal") {
    resumeQuranBackgroundWork();
    return;
  }

  suspendQuranBackgroundWork(snap.level);

  // 1) Immediate ephemeral purge (canvas / audio URLs / decoding nodes)
  try {
    purgeEphemeralMediaResources();
  } catch {
    /* ignore */
  }
  try {
    const { releaseAyahObjectUrls } = await import("@/lib/ayah-audio-prefetch");
    releaseAyahObjectUrls();
  } catch {
    /* ignore */
  }

  // 2) Cancel in-flight engine warm via teardown disposables (idle handles)
  try {
    const { teardownQuranEngineSession } = await import("@/lib/quran-engine-teardown");
    // Do NOT full-teardown reading session — only abort warm phase via signal.
    // Warm loops already check AbortSignal; we rely on suspend flags for prefetch.
    void teardownQuranEngineSession;
  } catch {
    /* ignore */
  }

  // 3) Budget eviction under pressure (idle-chunked via await boundaries)
  if (snap.level === "moderate" || snap.level === "critical") {
    try {
      await enforceStorageBudget({ pressure: snap.level === "critical" });
    } catch {
      /* ignore */
    }
  }
}

function scheduleMaintenancePass(): void {
  compactCancel?.();
  const handle = scheduleIdleCompaction({
    timeoutMs: 30_000,
    signal: lifecycleAbort?.signal,
  });
  compactCancel = handle.cancel;

  const kickMigrate = () => {
    if (isQuranIndexingSuspended()) return;
    void runSilentSchemaMigrations({ signal: lifecycleAbort?.signal ?? undefined });
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(kickMigrate, { timeout: 25_000 });
  } else {
    globalThis.setTimeout(kickMigrate, 8_000);
  }

  // Soft budget enforcement when idle (non-pressure)
  const kickEvict = () => {
    if (isQuranPrefetchSuspended()) return;
    void enforceStorageBudget();
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(kickEvict, { timeout: 40_000 });
  } else {
    globalThis.setTimeout(kickEvict, 12_000);
  }
}

/**
 * Start once from platform / offline bootstrap.
 * Zero UI; work is deferred to idle + pressure events.
 */
export function startQuranResourceLifecycle(): void {
  if (typeof window === "undefined" || started) return;
  started = true;
  lifecycleAbort = new AbortController();

  // Subscribe to existing memory-pressure observer (does not start a second poller)
  void import("@/lib/memory-pressure").then(({ subscribeMemoryPressure, getLastMemoryPressureLevel }) => {
    unsubPressure = subscribeMemoryPressure((snap) => {
      void onPressure(snap);
    });
    const level = getLastMemoryPressureLevel();
    if (level !== "normal") {
      void onPressure({
        usedJsHeapSize: null,
        totalJsHeapSize: null,
        jsHeapSizeLimit: null,
        heapRatio: null,
        level,
        deviceMemoryGb: null,
        at: Date.now(),
      });
    }
  });

  // Initial idle maintenance
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => scheduleMaintenancePass(), { timeout: 15_000 });
  } else {
    globalThis.setTimeout(() => scheduleMaintenancePass(), 6_000);
  }

  // Periodic idle maintenance (not a tight interval — long cadence)
  maintenanceTimer = globalThis.setTimeout(function tick() {
    scheduleMaintenancePass();
    maintenanceTimer = globalThis.setTimeout(tick, MAINTENANCE_EVERY_MS);
  }, MAINTENANCE_EVERY_MS);

  // deviceMemory soft baseline — low-RAM devices start suspended for full warm
  try {
    const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (typeof dm === "number" && dm > 0 && dm <= 2) {
      // Don't fully suspend forever — just run an early eviction pass
      void enforceStorageBudget({ pressure: true });
    }
  } catch {
    /* ignore */
  }
}

export function stopQuranResourceLifecycle(): void {
  started = false;
  unsubPressure?.();
  unsubPressure = null;
  compactCancel?.();
  compactCancel = null;
  if (maintenanceTimer) {
    clearTimeout(maintenanceTimer);
    maintenanceTimer = null;
  }
  resumeQuranBackgroundWork();
}

/** Test / diagnostics */
export function getQuranLifecycleState(): {
  started: boolean;
  prefetchSuspended: boolean;
  indexingSuspended: boolean;
} {
  return {
    started,
    prefetchSuspended: isQuranPrefetchSuspended(),
    indexingSuspended: isQuranIndexingSuspended(),
  };
}

export function __resetQuranLifecycleForTests(): void {
  stopQuranResourceLifecycle();
  setQuranPrefetchSuspended(false);
  setQuranIndexingSuspended(false);
  lifecycleAbort = null;
}

/** Manual pressure hook used by memory-pressure purge pipeline. */
export async function handleQuranMemoryPressure(
  level: MemoryPressureLevel,
): Promise<{ actions: string[] }> {
  const actions: string[] = [];
  await onPressure({
    usedJsHeapSize: null,
    totalJsHeapSize: null,
    jsHeapSizeLimit: null,
    heapRatio: null,
    level,
    deviceMemoryGb: null,
    at: Date.now(),
  });
  actions.push("quran-lifecycle-pressure");
  if (level === "normal") actions.push("resumed");
  else actions.push("suspended-prefetch");
  return { actions };
}
