/**
 * Main-thread facade for the Arabic search Web Worker.
 * Falls back to sync main-thread processing when Workers are unavailable.
 */

import { normalizeArabic } from "@/shared/arabic-normalize";
import { arabicMatchAny } from "@/lib/arabic-search";
import type { SearchWorkerRequest, SearchWorkerResponse } from "@/lib/search.worker";

type Pending = {
  resolve: (v: SearchWorkerResponse) => void;
  reject: (e: Error) => void;
  signal?: AbortSignal;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();
let workerFailed = false;

function ensureWorker(): Worker | null {
  if (workerFailed) return null;
  if (typeof Worker === "undefined") {
    workerFailed = true;
    return null;
  }
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./search.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (ev: MessageEvent<SearchWorkerResponse>) => {
      const res = ev.data;
      const p = pending.get(res.id);
      if (!p) return;
      pending.delete(res.id);
      p.resolve(res);
    };
    worker.onerror = () => {
      workerFailed = true;
      for (const [, p] of pending) {
        p.reject(new Error("search_worker_failed"));
      }
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
    workerFailed = true;
    return null;
  }
}

function post(req: SearchWorkerRequest, signal?: AbortSignal): Promise<SearchWorkerResponse> {
  const w = ensureWorker();
  if (!w) {
    return Promise.resolve(runSync(req));
  }
  if (signal?.aborted) {
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      pending.delete(req.id);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
    pending.set(req.id, {
      resolve: (v) => {
        signal?.removeEventListener("abort", onAbort);
        resolve(v);
      },
      reject: (e) => {
        signal?.removeEventListener("abort", onAbort);
        reject(e);
      },
      signal,
    });
    w.postMessage(req);
  });
}

function runSync(req: SearchWorkerRequest): SearchWorkerResponse {
  switch (req.type) {
    case "normalize":
      return { id: req.id, type: "normalize", value: normalizeArabic(req.text) };
    case "normalizeMany":
      return {
        id: req.id,
        type: "normalizeMany",
        values: req.texts.map((t) => normalizeArabic(t)),
      };
    case "filterDocs": {
      const ids: string[] = [];
      const limit = req.limit ?? 40;
      for (const doc of req.docs) {
        if (arabicMatchAny(doc.fields, req.query)) {
          ids.push(doc.id);
          if (ids.length >= limit) break;
        }
      }
      return { id: req.id, type: "filterDocs", ids };
    }
    case "matchFields":
      return {
        id: req.id,
        type: "matchFields",
        matched: arabicMatchAny(req.fields, req.query),
      };
    default:
      return { id: (req as { id: number }).id, type: "error", error: "unknown" };
  }
}

export async function normalizeArabicOffthread(
  text: string,
  signal?: AbortSignal,
): Promise<string> {
  const id = nextId++;
  const res = await post({ id, type: "normalize", text }, signal);
  if (res.type === "normalize") return res.value;
  if (res.type === "error") return normalizeArabic(text);
  return normalizeArabic(text);
}

export async function normalizeArabicManyOffthread(
  texts: string[],
  signal?: AbortSignal,
): Promise<string[]> {
  const id = nextId++;
  const res = await post({ id, type: "normalizeMany", texts }, signal);
  if (res.type === "normalizeMany") return res.values;
  return texts.map((t) => normalizeArabic(t));
}

export async function filterDocsOffthread(
  query: string,
  docs: Array<{ id: string; fields: Array<string | null | undefined> }>,
  opts?: { limit?: number; signal?: AbortSignal },
): Promise<string[]> {
  const id = nextId++;
  try {
    const res = await post(
      { id, type: "filterDocs", query, docs, limit: opts?.limit },
      opts?.signal,
    );
    if (res.type === "filterDocs") return res.ids;
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
  }
  const fallback = runSync({ id, type: "filterDocs", query, docs, limit: opts?.limit });
  return fallback.type === "filterDocs" ? fallback.ids : [];
}

/** Terminate worker (tests / memory pressure). */
export function disposeSearchWorker(): void {
  for (const [, p] of pending) {
    p.reject(new DOMException("Aborted", "AbortError"));
  }
  pending.clear();
  try {
    worker?.terminate();
  } catch {
    /* ignore */
  }
  worker = null;
}
