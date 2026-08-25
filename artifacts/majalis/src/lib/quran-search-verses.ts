/**
 * Web port of RN `searchVerses(query, quranDatabase)`.
 * Filters verses whose text includes the query; Arabic input also matches
 * after diacritic/hamza normalization so typing without tashkeel works.
 */

import { normalizeArabic } from "@/shared/arabic-normalize";
import { tolerantIncludes } from "@/features/search/tolerant-match";
import { fetchSurahDetail, getSurahMeta } from "@/lib/quran-api";

export type QuranVerseSearchItem = {
  text: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  page: number;
  /** مطابقة داخلية فقط — لا يُعرض للمستخدم. */
  textNorm: string;
};

export const QURAN_SEARCH_RESULT_LIMIT = 120;

/**
 * RN sketch:
 * ```js
 * return quranDatabase.filter(item => item.text.includes(query));
 * ```
 */
export function searchVerses<T extends { text: string }>(
  query: string,
  quranDatabase: readonly T[],
): T[] {
  if (!query) return [];
  const raw = query.trim();
  if (!raw) return [];

  const needleNorm = normalizeArabic(raw);
  if (!needleNorm) return [];
  return quranDatabase.filter((item) => {
    if (item.text.includes(raw)) return true;
    const hay = "textNorm" in item && typeof item.textNorm === "string" ? item.textNorm : normalizeArabic(item.text);
    return hay.includes(needleNorm) || tolerantIncludes(item.text, raw);
  });
}

let cachedDb: QuranVerseSearchItem[] | null = null;
let loadPromise: Promise<QuranVerseSearchItem[]> | null = null;

/** Load all 114 surahs (local-first via fetchSurahDetail) into a flat verse list. */
export async function loadQuranVerseDatabase(): Promise<QuranVerseSearchItem[]> {
  if (cachedDb) return cachedDb;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const details = await Promise.all(
      Array.from({ length: 114 }, (_, i) => fetchSurahDetail(i + 1)),
    );
    const items: QuranVerseSearchItem[] = [];
    for (const detail of details) {
      // اسم العرض الموحّد بلا تشكيل — النص الخام للآية يبقى كما في المصدر
      const surahName = getSurahMeta(detail.number).name;
      for (const ayah of detail.ayahs) {
        items.push({
          text: ayah.text,
          textNorm: normalizeArabic(ayah.text),
          surahNumber: detail.number,
          surahName,
          ayahNumber: ayah.numberInSurah,
          page: ayah.page,
        });
      }
    }
    cachedDb = items;
    return items;
  })();

  try {
    return await loadPromise;
  } catch (err) {
    loadPromise = null;
    throw err;
  }
}

/** Convenience: load DB (if needed) then search, capped for UI. */
export async function searchVersesInCorpus(
  query: string,
  limit = QURAN_SEARCH_RESULT_LIMIT,
): Promise<QuranVerseSearchItem[]> {
  const db = await loadQuranVerseDatabase();
  const viaWorker = await searchVersesViaWorker(query, db, limit);
  if (viaWorker) return viaWorker;
  const hits = await searchVersesIdle(query, db, limit);
  return hits;
}

function searchVersesIdle(
  query: string,
  db: QuranVerseSearchItem[],
  limit: number,
): Promise<QuranVerseSearchItem[]> {
  return new Promise((resolve) => {
    const run = () => {
      const hits = searchVerses(query, db);
      resolve(limit > 0 ? hits.slice(0, limit) : hits);
    };
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => run(), { timeout: 120 });
    } else {
      setTimeout(run, 0);
    }
  });
}

let sharedWorker: Worker | null = null;
let workerDbReady = false;
let workerId = 0;
let workerInitPromise: Promise<boolean> | null = null;

function getVerseSearchWorker(): Worker | null {
  if (typeof Worker === "undefined") return null;
  if (sharedWorker) return sharedWorker;
  try {
    sharedWorker = new Worker(new URL("./quran-verse-search.worker.ts", import.meta.url), {
      type: "module",
    });
    sharedWorker.addEventListener("error", () => {
      sharedWorker?.terminate();
      sharedWorker = null;
      workerDbReady = false;
      workerInitPromise = null;
    });
    return sharedWorker;
  } catch {
    return null;
  }
}

function ensureWorkerDb(db: QuranVerseSearchItem[]): Promise<boolean> {
  const worker = getVerseSearchWorker();
  if (!worker) return Promise.resolve(false);
  if (workerDbReady) return Promise.resolve(true);
  if (workerInitPromise) return workerInitPromise;
  workerInitPromise = new Promise((resolve) => {
    const onMsg = (ev: MessageEvent<{ ok?: boolean }>) => {
      worker.removeEventListener("message", onMsg);
      workerDbReady = Boolean(ev.data?.ok);
      resolve(workerDbReady);
    };
    worker.addEventListener("message", onMsg);
    worker.postMessage({
      type: "init",
      items: db.map((v) => ({ text: v.text, textNorm: v.textNorm })),
    });
    window.setTimeout(() => {
      worker.removeEventListener("message", onMsg);
      resolve(false);
    }, 8_000);
  });
  return workerInitPromise;
}

/**
 * بحث في Web Worker بعد تهيئة القاعدة مرة واحدة.
 * عند الفشل يُرجع null ليعمل مسار idle على الخيط الرئيسي.
 */
async function searchVersesViaWorker(
  query: string,
  db: QuranVerseSearchItem[],
  limit: number,
): Promise<QuranVerseSearchItem[] | null> {
  const raw = query.trim();
  if (!raw) return [];
  const queryNorm = normalizeArabic(raw);
  if (!queryNorm) return [];

  const ready = await ensureWorkerDb(db);
  const worker = getVerseSearchWorker();
  if (!ready || !worker) return null;

  const id = ++workerId;
  try {
    const result = await new Promise<{ ok: boolean; indices?: number[] }>((resolve) => {
      const timer = window.setTimeout(() => resolve({ ok: false }), 3_000);
      const onMsg = (ev: MessageEvent<{ id: number; ok: boolean; indices?: number[] }>) => {
        if (ev.data?.id !== id) return;
        window.clearTimeout(timer);
        worker.removeEventListener("message", onMsg);
        resolve(ev.data);
      };
      worker.addEventListener("message", onMsg);
      worker.postMessage({
        type: "search",
        id,
        query: raw,
        queryNorm,
        limit: limit > 0 ? limit : db.length,
      });
    });
    if (!result.ok || !result.indices) return null;
    return result.indices.map((i) => db[i]!).filter(Boolean);
  } catch {
    return null;
  }
}
