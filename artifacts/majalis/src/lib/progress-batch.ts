/**
 * Non-blocking micro-queue for reading progress / metrics updates.
 * Batches mutations and flushes on idle, visibility hidden, or unload.
 * Logic-only — no UI.
 */

import { scheduleIdle, supports } from "@/lib/feature-detect";
import { registerUnloadPersist } from "@/lib/unload-persist";

export type ProgressMetric =
  | { kind: "ayah-read"; surah: number; ayah: number; count?: number }
  | { kind: "surah-dwell"; surah: number; ms: number }
  | { kind: "khatmah-pct"; pct: number }
  | { kind: "scroll-section"; section: string; scrollY: number }
  | { kind: "custom"; key: string; value: unknown };

type FlushHandler = (batch: ProgressMetric[]) => void;

const queue: ProgressMetric[] = [];
const handlers = new Set<FlushHandler>();
let flushScheduled = false;
let unloadBound = false;
let lastFlushAt = 0;

const MAX_QUEUE = 64;
const MIN_FLUSH_GAP_MS = 400;

function scheduleFlush(): void {
  if (flushScheduled) return;
  flushScheduled = true;
  scheduleIdle(() => {
    flushScheduled = false;
    flushProgressBatch();
  }, 1_200);
}

export function enqueueProgress(metric: ProgressMetric): void {
  if (queue.length >= MAX_QUEUE) {
    // Drop oldest non-critical scroll noise
    const idx = queue.findIndex((m) => m.kind === "scroll-section");
    if (idx >= 0) queue.splice(idx, 1);
    else queue.shift();
  }
  queue.push(metric);
  scheduleFlush();
}

export function onProgressFlush(handler: FlushHandler): () => void {
  handlers.add(handler);
  ensureProgressUnload();
  return () => {
    handlers.delete(handler);
  };
}

export function flushProgressBatch(): void {
  const now = Date.now();
  if (queue.length === 0) return;
  if (now - lastFlushAt < MIN_FLUSH_GAP_MS && typeof document !== "undefined" && document.visibilityState === "visible") {
    scheduleFlush();
    return;
  }
  lastFlushAt = now;
  const batch = queue.splice(0, queue.length);
  for (const h of handlers) {
    try {
      h(batch);
    } catch {
      /* ignore */
    }
  }
}

function ensureProgressUnload(): void {
  if (unloadBound || typeof window === "undefined") return;
  unloadBound = true;
  registerUnloadPersist("progress-batch", () => {
    flushProgressBatch();
    return null;
  });
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushProgressBatch();
    });
  }
  // Network idle: when online and idle callback available, also flush
  if (supports("requestIdleCallback")) {
    const loop = () => {
      scheduleIdle(() => {
        if (queue.length) flushProgressBatch();
        // Re-arm only while page is alive — light cadence
        if (typeof document === "undefined" || document.visibilityState === "visible") {
          loop();
        }
      }, 8_000);
    };
    loop();
  }
}

export function pendingProgressCount(): number {
  return queue.length;
}

export function resetProgressBatchForTests(): void {
  queue.length = 0;
  handlers.clear();
  flushScheduled = false;
  unloadBound = false;
  lastFlushAt = 0;
}
