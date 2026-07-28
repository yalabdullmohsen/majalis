/**
 * Non-blocking indexing façade — prefers Web Workers, falls back to main-thread
 * idle callbacks when Workers are unavailable (SSR / tests / older browsers).
 */
import type {
  MutashabihatWorkerRequest,
  MutashabihatWorkerResponse,
  TajweedWorkerNote,
  TajweedWorkerRequest,
  TajweedWorkerResponse,
} from "@/core/quran/workers/protocol";
import { isQuranIndexingSuspended } from "@/lib/quran-offline/lifecycle-flags";

type Pending<T> = {
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `idx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function scheduleIdle<T>(work: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      try {
        resolve(work());
      } catch (err) {
        reject(err);
      }
    };
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => run(), { timeout: 2_500 });
    } else {
      setTimeout(run, 0);
    }
  });
}

function flattenMainThread(
  index: Record<string, Array<{ surah: number; ayah: number }>>,
  themes: Record<string, string[]>,
): MutashabihatWorkerResponse["rows"] {
  const similar: Record<string, string[]> = {};
  for (const [key, matches] of Object.entries(index)) {
    similar[key] = matches.map((m) => `${m.surah}:${m.ayah}`);
  }
  const keys = new Set([...Object.keys(similar), ...Object.keys(themes)]);
  const rows: MutashabihatWorkerResponse["rows"] = [];
  for (const ayah_key of keys) {
    rows.push({
      ayah_key,
      similar_ayah_keys: similar[ayah_key] ?? [],
      theme_ids: themes[ayah_key] ?? [],
    });
  }
  return rows;
}

export class IndexingService {
  private mutaWorker: Worker | null = null;
  private tajweedWorker: Worker | null = null;
  private mutaPending = new Map<string, Pending<MutashabihatWorkerResponse["rows"]>>();
  private tajweedPending = new Map<string, Pending<TajweedWorkerNote[]>>();
  private started = false;

  /** Lazy-spawn workers (never blocks constructor). */
  start(): void {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    try {
      if (typeof Worker !== "undefined") {
        this.mutaWorker = new Worker(
          new URL("./workers/mutashabihat.worker.ts", import.meta.url),
          { type: "module" },
        );
        this.mutaWorker.onmessage = (ev: MessageEvent<MutashabihatWorkerResponse>) => {
          const msg = ev.data;
          const p = this.mutaPending.get(msg.id);
          if (!p) return;
          this.mutaPending.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error));
          else p.resolve(msg.rows);
        };
        this.tajweedWorker = new Worker(
          new URL("./workers/tajweed.worker.ts", import.meta.url),
          { type: "module" },
        );
        this.tajweedWorker.onmessage = (ev: MessageEvent<TajweedWorkerResponse>) => {
          const msg = ev.data;
          const p = this.tajweedPending.get(msg.id);
          if (!p) return;
          this.tajweedPending.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error));
          else p.resolve(msg.notes);
        };
      }
    } catch {
      this.mutaWorker = null;
      this.tajweedWorker = null;
    }
  }

  stop(): void {
    this.mutaWorker?.terminate();
    this.tajweedWorker?.terminate();
    this.mutaWorker = null;
    this.tajweedWorker = null;
    for (const p of this.mutaPending.values()) p.reject(new Error("indexing-stopped"));
    for (const p of this.tajweedPending.values()) p.reject(new Error("indexing-stopped"));
    this.mutaPending.clear();
    this.tajweedPending.clear();
    this.started = false;
  }

  /**
   * Flatten mutashabihat JSON + optional theme map → knowledge rows.
   * Suspends under memory-pressure indexing flag.
   */
  async flattenMutashabihatIndex(
    index: Record<string, Array<{ surah: number; ayah: number }>>,
    themes: Record<string, string[]> = {},
  ): Promise<MutashabihatWorkerResponse["rows"]> {
    if (isQuranIndexingSuspended()) return [];
    this.start();
    if (this.mutaWorker) {
      const id = newId();
      const req: MutashabihatWorkerRequest = {
        id,
        type: "flatten-index",
        index,
        themes,
      };
      return new Promise((resolve, reject) => {
        this.mutaPending.set(id, { resolve, reject });
        this.mutaWorker!.postMessage(req);
      });
    }
    return scheduleIdle(() => flattenMainThread(index, themes));
  }

  /** Tajweed timing notes — worker preferred. */
  async analyzeTajweedTimings(
    pairs: TajweedWorkerRequest["pairs"],
  ): Promise<TajweedWorkerNote[]> {
    if (isQuranIndexingSuspended()) return [];
    this.start();
    if (this.tajweedWorker) {
      const id = newId();
      const req: TajweedWorkerRequest = { id, type: "analyze-timings", pairs };
      return new Promise((resolve, reject) => {
        this.tajweedPending.set(id, { resolve, reject });
        this.tajweedWorker!.postMessage(req);
      });
    }
    return scheduleIdle(() => analyzeTajweedMainThread(pairs));
  }
}

const MADD_BASE = new Set(["ا", "و", "ي", "ى", "ٱ"]);
const MADD_SUPERSCRIPT_ALIF = "\u0670";

function hasMaddLetter(raw: string): boolean {
  for (const ch of raw) {
    if (MADD_BASE.has(ch) || ch === MADD_SUPERSCRIPT_ALIF) return true;
  }
  return false;
}

function analyzeTajweedMainThread(
  pairs: TajweedWorkerRequest["pairs"],
): TajweedWorkerNote[] {
  const notes: TajweedWorkerNote[] = [];
  for (const pair of pairs ?? []) {
    const raw = pair.ref?.raw ?? "";
    const heard = pair.heard?.word ?? "";
    if (!hasMaddLetter(raw) && !hasMaddLetter(heard)) continue;
    const start = pair.heard?.startSec;
    const end = pair.heard?.endSec;
    if (start == null || end == null) continue;
    const dur = end - start;
    if (!(dur > 0)) continue;
    if (dur < 0.18) {
      notes.push({
        refIndex: pair.ref.index,
        rule: "madd_tabeei_short",
        confidencePct: 62,
        message: "قد يكون المدّ أقصر من المتوقع في هذه الكلمة — أعد سماعها من قارئ معتمد.",
      });
    } else if (dur > 0.95) {
      notes.push({
        refIndex: pair.ref.index,
        rule: "madd_tabeei_long",
        confidencePct: 58,
        message: "قد يكون المدّ أطول من المعتاد هنا — راجع حكم المد مع معلّم إن أمكن.",
      });
    }
  }
  return notes;
}

let singleton: IndexingService | null = null;

export function getIndexingService(): IndexingService {
  if (!singleton) singleton = new IndexingService();
  return singleton;
}
