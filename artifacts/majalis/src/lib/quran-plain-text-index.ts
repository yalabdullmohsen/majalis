/**
 * فهرس نصّي مسطّح للبحث السريع — بلا إعادة تحليل تشكيل/خط على كل ضغطة.
 */
import { normalizeArabic, stripArabicDiacritics } from "@/shared/arabic-normalize";
import type { QuranVerseSearchItem } from "@/lib/quran-search-verses";
import { loadQuranVerseDatabase } from "@/lib/quran-search-verses";

export type PlainQuranVerseIndexItem = QuranVerseSearchItem & {
  /** نص بلا تشكيل — للبحث الخفيف */
  plainText: string;
};

let plainIndex: PlainQuranVerseIndexItem[] | null = null;
let plainLoadPromise: Promise<PlainQuranVerseIndexItem[]> | null = null;

export function buildPlainVerseIndex(db: readonly QuranVerseSearchItem[]): PlainQuranVerseIndexItem[] {
  return db.map((item) => ({
    ...item,
    plainText: stripArabicDiacritics(item.text),
  }));
}

export async function loadPlainQuranTextIndex(): Promise<PlainQuranVerseIndexItem[]> {
  if (plainIndex) return plainIndex;
  if (plainLoadPromise) return plainLoadPromise;
  plainLoadPromise = loadQuranVerseDatabase().then((db) => {
    plainIndex = buildPlainVerseIndex(db);
    return plainIndex;
  });
  try {
    return await plainLoadPromise;
  } catch (err) {
    plainLoadPromise = null;
    throw err;
  }
}

export function searchPlainQuranIndex(
  query: string,
  index: readonly PlainQuranVerseIndexItem[],
  limit = 120,
): PlainQuranVerseIndexItem[] {
  const raw = query.trim();
  if (!raw) return [];
  const needleNorm = normalizeArabic(raw);
  const needlePlain = stripArabicDiacritics(raw);
  if (!needleNorm && !needlePlain) return [];
  const hits: PlainQuranVerseIndexItem[] = [];
  for (const item of index) {
    if (raw && item.text.includes(raw)) {
      hits.push(item);
      continue;
    }
    if (needleNorm && item.textNorm.includes(needleNorm)) {
      hits.push(item);
      continue;
    }
    if (needlePlain && item.plainText.includes(needlePlain)) {
      hits.push(item);
    }
  }
  return limit > 0 ? hits.slice(0, limit) : hits;
}

export function clearPlainQuranTextIndex(): void {
  plainIndex = null;
  plainLoadPromise = null;
}
