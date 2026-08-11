/**
 * Offload Arabic normalize batches to a dedicated Web Worker when available.
 * Falls back to main-thread normalizeArabic for small lists / unsupported envs.
 */

import { normalizeArabic } from "@/shared/arabic-normalize";

type WorkerReply = { id: number; results: string[] };

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<
  number,
  { resolve: (v: string[]) => void; reject: (e: unknown) => void }
>();

function ensureWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./arabic-normalize.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (ev: MessageEvent<WorkerReply>) => {
      const job = pending.get(ev.data.id);
      if (!job) return;
      pending.delete(ev.data.id);
      job.resolve(ev.data.results);
    };
    worker.onerror = () => {
      for (const [, job] of pending) job.reject(new Error("normalize-worker-failed"));
      pending.clear();
      try {
        worker?.terminate();
      } catch {
        /* ignore */
      }
      worker = null;
    };
    return worker;
  } catch {
    worker = null;
    return null;
  }
}

/** Normalize many strings without blocking the UI for large batches. */
export async function normalizeArabicBatch(texts: string[]): Promise<string[]> {
  if (!texts.length) return [];
  if (texts.length < 8) return texts.map((t) => normalizeArabic(t));

  const w = ensureWorker();
  if (!w) return texts.map((t) => normalizeArabic(t));

  const id = ++seq;
  return new Promise<string[]>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, texts });
  });
}
