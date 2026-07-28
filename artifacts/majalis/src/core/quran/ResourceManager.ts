/**
 * ResourceManager — LRU/LFU eviction + memory-pressure orchestration.
 * All work is idle/event driven; never synchronous on the caller's stack
 * beyond flag flips.
 */
import {
  startQuranResourceLifecycle,
  stopQuranResourceLifecycle,
  suspendQuranBackgroundWork,
  resumeQuranBackgroundWork,
  handleQuranMemoryPressure,
  isQuranPrefetchSuspended,
  isQuranIndexingSuspended,
  getQuranLifecycleState,
} from "@/lib/quran-offline/resource-lifecycle";
import {
  enforceStorageBudget,
  evictOfflineAssetsLru,
  estimateOfflineAssetBytes,
} from "@/lib/quran-offline/asset-eviction";
import {
  getLifecycleBudgetConfig,
  setLifecycleBudgetBytes,
  setLifecycleInactiveDays,
  DEFAULT_STORAGE_BUDGET_BYTES,
} from "@/lib/quran-offline/lifecycle-config";
import {
  registerEphemeralCanvas,
  registerAudioContext,
  registerAudioDisposer,
  purgeEphemeralMediaResources,
} from "@/lib/quran-offline/ephemeral-registry";
import { scheduleIdleCompaction } from "@/lib/quran-offline/compaction";
import { getIndexingService } from "@/core/quran/IndexingService";
import type { MemoryPressureLevel } from "@/lib/memory-pressure";

export class ResourceManager {
  private started = false;

  /** Bind pressure listeners + idle maintenance (idempotent). */
  start(): void {
    if (this.started) return;
    this.started = true;
    startQuranResourceLifecycle();
    getIndexingService().start();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    stopQuranResourceLifecycle();
    getIndexingService().stop();
  }

  /** Soft suspend background warm/prefetch (e.g. before heavy audio). */
  suspendBackgroundWork(reason = "manual"): void {
    suspendQuranBackgroundWork(reason);
  }

  resumeBackgroundWork(): void {
    resumeQuranBackgroundWork();
  }

  isPrefetchSuspended(): boolean {
    return isQuranPrefetchSuspended();
  }

  isIndexingSuspended(): boolean {
    return isQuranIndexingSuspended();
  }

  getState() {
    return getQuranLifecycleState();
  }

  getBudgetConfig() {
    return getLifecycleBudgetConfig();
  }

  setBudgetBytes(bytes: number): void {
    setLifecycleBudgetBytes(bytes);
  }

  setInactiveDays(days: number): void {
    setLifecycleInactiveDays(days);
  }

  /** Async budget enforcement — schedule via microtask so callers stay free. */
  enforceBudget(opts?: { pressure?: boolean }): Promise<ReturnType<typeof enforceStorageBudget>> {
    return Promise.resolve().then(() => enforceStorageBudget(opts));
  }

  evictAssets(opts?: { pressure?: boolean; force?: boolean }) {
    return Promise.resolve().then(() => evictOfflineAssetsLru(opts));
  }

  estimateBytes(): Promise<number> {
    return estimateOfflineAssetBytes();
  }

  /** Forward OS / heap pressure into Quran lifecycle pipeline. */
  onMemoryPressure(level: MemoryPressureLevel): Promise<{ actions: string[] }> {
    return handleQuranMemoryPressure(level);
  }

  purgeEphemeral() {
    return purgeEphemeralMediaResources();
  }

  registerCanvas(canvas: HTMLCanvasElement): () => void {
    return registerEphemeralCanvas(canvas);
  }

  registerAudioContext(ctx: AudioContext): () => void {
    return registerAudioContext(ctx);
  }

  registerAudioDisposer(dispose: () => void): () => void {
    return registerAudioDisposer(dispose);
  }

  /** Idle compaction handle. */
  scheduleCompaction(opts?: { timeoutMs?: number; signal?: AbortSignal }) {
    return scheduleIdleCompaction(opts);
  }

  get defaultBudgetBytes(): number {
    return DEFAULT_STORAGE_BUDGET_BYTES;
  }
}

let resourceSingleton: ResourceManager | null = null;

export function getResourceManager(): ResourceManager {
  if (!resourceSingleton) resourceSingleton = new ResourceManager();
  return resourceSingleton;
}
