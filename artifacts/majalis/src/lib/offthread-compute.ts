/**
 * Off-thread compute client — Web Worker with silent main-thread fallback.
 */
import {
  aggregateDayMetrics,
  filterDocsByNeedle,
  prepareNeedleVariants,
  type MatchDoc,
} from "@/lib/arabic-match-core";
import { canUseWebWorker } from "@/lib/browser-features";
import type { HeavyComputeRequest, HeavyComputeResponse } from "@/workers/heavy-compute.worker";

type Pending = {
  resolve: (v: HeavyComputeResponse) => void;
  reject: (e: Error) => void;
  timer: number;
};

const TIMEOUT_MS = 4_000;
let worker: Worker | null = null;
let workerFailed = false;
const pending = new Map<string, Pending>();
let seq = 0;

function nextId(): string {
  seq += 1;
  return `hc-${Date.now().toString(36)}-${seq}`;
}

function ensureWorker(): Worker | null {
  if (workerFailed || !canUseWebWorker()) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("../workers/heavy-compute.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (ev: MessageEvent<HeavyComputeResponse>) => {
      const msg = ev.data;
      if (!msg?.id) return;
      const p = pending.get(msg.id);
      if (!p) return;
      window.clearTimeout(p.timer);
      pending.delete(msg.id);
      p.resolve(msg);
    };
    worker.onerror = () => {
      workerFailed = true;
      try {
        worker?.terminate();
      } catch {
        /* ignore */
      }
      worker = null;
      for (const [id, p] of pending) {
        window.clearTimeout(p.timer);
        pending.delete(id);
        p.reject(new Error("worker_error"));
      }
    };
    return worker;
  } catch {
    workerFailed = true;
    worker = null;
    return null;
  }
}

function post<T extends HeavyComputeResponse>(
  req: HeavyComputeRequest,
): Promise<T> {
  const w = ensureWorker();
  if (!w) return Promise.reject(new Error("no_worker"));
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(req.id);
      reject(new Error("worker_timeout"));
    }, TIMEOUT_MS);
    pending.set(req.id, {
      resolve: (v) => resolve(v as T),
      reject,
      timer,
    });
    try {
      w.postMessage(req);
    } catch (err) {
      window.clearTimeout(timer);
      pending.delete(req.id);
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/** Terminate worker (tests / teardown). */
export function disposeHeavyComputeWorker(): void {
  for (const [, p] of pending) {
    window.clearTimeout(p.timer);
    p.reject(new Error("disposed"));
  }
  pending.clear();
  try {
    worker?.terminate();
  } catch {
    /* ignore */
  }
  worker = null;
}

/**
 * Filter docs by Arabic needle — prefers worker for large lists (≥ threshold).
 */
export async function filterDocsOffthread(
  docs: MatchDoc[],
  needles: string[],
  opts?: { forceMain?: boolean; threshold?: number },
): Promise<string[]> {
  const threshold = opts?.threshold ?? 40;
  const variants = prepareNeedleVariants(needles);
  if (opts?.forceMain || docs.length < threshold) {
    return filterDocsByNeedle(docs, variants);
  }
  try {
    const res = await post<Extract<HeavyComputeResponse, { type: "filter_docs" }>>({
      id: nextId(),
      type: "filter_docs",
      docs,
      needles,
    });
    if (res.type === "error") throw new Error(res.message);
    return res.ids;
  } catch {
    return filterDocsByNeedle(docs, variants);
  }
}

/** Aggregate weekly day metrics off-thread when beneficial. */
export async function aggregateDaysOffthread(
  days: Array<{
    tasksCompleted: number;
    tasksTotal: number;
    pagesRead: number;
    active: boolean;
  }>,
): Promise<{ completionRate: number; totalPages: number; activeDays: number }> {
  if (days.length < 7) return aggregateDayMetrics(days);
  try {
    const res = await post<Extract<HeavyComputeResponse, { type: "aggregate_days" }>>({
      id: nextId(),
      type: "aggregate_days",
      days,
    });
    if (res.type === "error") throw new Error(res.message);
    return res.result;
  } catch {
    return aggregateDayMetrics(days);
  }
}
