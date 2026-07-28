/**
 * Web port of RN `searchVerses(query, quranDatabase)`.
 * Filters verses whose text includes the query; Arabic input also matches
 * after diacritic/hamza normalization so typing without tashkeel works.
 */

import { normalizeArabic } from "@/shared/arabic-normalize";
import { fetchSurahDetail, getSurahMeta } from "@/lib/quran-api";

export type QuranVerseSearchItem = {
  text: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  page: number;
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
  return quranDatabase.filter((item) => {
    if (item.text.includes(raw)) return true;
    if (!needleNorm) return false;
    return normalizeArabic(item.text).includes(needleNorm);
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
      const surahName = detail.name || getSurahMeta(detail.number).name;
      for (const ayah of detail.ayahs) {
        items.push({
          text: ayah.text,
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
  const hits = searchVerses(query, db);
  return limit > 0 ? hits.slice(0, limit) : hits;
}
