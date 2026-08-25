/**
 * مركز Workers — يُبقي الحسابات الثقيلة بعيدًا عن الخيط الرئيسي.
 */
import { scheduleNonCriticalWork } from "@/lib/power-saver-engine";

type PlainItem = import("@/lib/quran-plain-text-index").PlainQuranVerseIndexItem;

type Pending = {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
};

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, Pending>();

function ensureWorker(): Worker | null {
  if (typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./sovereign-compute.worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", (event: MessageEvent<{ id: number; ok: boolean; result?: unknown; error?: string }>) => {
      const slot = pending.get(event.data.id);
      if (!slot) return;
      pending.delete(event.data.id);
      if (event.data.ok) slot.resolve(event.data.result);
      else slot.reject(new Error(event.data.error ?? "worker-error"));
    });
    worker.addEventListener("error", () => {
      for (const [, slot] of pending) slot.reject(new Error("worker-crash"));
      pending.clear();
      worker?.terminate();
      worker = null;
    });
    return worker;
  } catch {
    return null;
  }
}

function dispatch<T>(payload: Record<string, unknown>): Promise<T> {
  const w = ensureWorker();
  if (!w) return Promise.reject(new Error("worker-unavailable"));
  const id = ++seq;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    w.postMessage({ ...payload, id });
  });
}

/** تطبيع دفعي — fallback متزامن على الخيط الرئيسي عند غياب Worker */
export async function normalizeBatchOffMain(texts: readonly string[]): Promise<string[]> {
  if (texts.length === 0) return [];
  try {
    return await dispatch<string[]>({ kind: "normalize-batch", texts: [...texts] });
  } catch {
    const { normalizeArabic } = await import("@/shared/arabic-normalize");
    return texts.map((t) => normalizeArabic(t));
  }
}

export async function plainSearchOffMain(
  query: string,
  items: readonly PlainItem[],
  limit = 120,
): Promise<PlainItem[]> {
  if (!query.trim()) return [];
  try {
    return await dispatch<PlainItem[]>({ kind: "plain-search", query, items: [...items], limit });
  } catch {
    const { searchPlainQuranIndex, loadPlainQuranTextIndex } = await import("@/lib/quran-plain-text-index");
    const index = await loadPlainQuranTextIndex();
    return searchPlainQuranIndex(query, index, limit);
  }
}

export function formatHijriLabelOffMain(day: number, month: number, year: number): Promise<string> {
  return dispatch<string>({ kind: "hijri-label", day, month, year }).catch(async () => {
    const { formatHijriDate } = await import("@/lib/lesson-time");
    const d = new Date(Date.UTC(2000, 0, 1));
    return formatHijriDate(d);
  });
}

export function warmSovereignWorker(): void {
  scheduleNonCriticalWork(() => {
    void normalizeBatchOffMain(["بسم"]);
  });
}

export function terminateSovereignWorkerForTests(): void {
  worker?.terminate();
  worker = null;
  pending.clear();
  seq = 0;
}
