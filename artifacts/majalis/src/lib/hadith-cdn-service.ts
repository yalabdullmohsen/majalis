/**
 * خدمة الأحاديث الكاملة عبر CDN
 *
 * المصدر: fawazahmed0/hadith-api (مرخّص MIT)
 * يوفّر النصوص العربية من: صحيح البخاري، صحيح مسلم، الأربعون النووية،
 * الأحاديث القدسية، سنن أبي داود، جامع الترمذي، وغيرها.
 *
 * ملاحظة: لا يُولَّد أي محتوى بالذكاء الاصطناعي — المحتوى من المصدر الخارجي.
 */

const CDN_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
const CACHE_PREFIX = "hadith_cdn_";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ساعة

export type HadithCollection =
  | "ara-bukhari"
  | "ara-muslim"
  | "nawawi"
  | "qudsi"
  | "ara-abudawud"
  | "ara-tirmidhi"
  | "ara-nasai"
  | "ara-ibnmajah"
  | "ara-malik";

export interface CdnHadith {
  hadithnumber: number;
  text: string;
  chapter?: string;
  grades?: { name: string; grade: string }[];
}

export interface CdnChapter {
  chapterno: number;
  chaptername: string;
}

export interface CdnCollectionMeta {
  id: HadithCollection;
  name: string;
  arabicName: string;
  authenticityClass: "sahih" | "daif" | "hasan";
  totalHadiths: number;
}

export const HADITH_COLLECTIONS: CdnCollectionMeta[] = [
  { id: "ara-bukhari",  name: "صحيح البخاري",     arabicName: "الإمام محمد بن إسماعيل البخاري", authenticityClass: "sahih", totalHadiths: 7563 },
  { id: "ara-muslim",   name: "صحيح مسلم",        arabicName: "الإمام مسلم بن الحجاج",          authenticityClass: "sahih", totalHadiths: 3033 },
  { id: "nawawi",       name: "الأربعون النووية",  arabicName: "الإمام يحيى بن شرف النووي",      authenticityClass: "sahih", totalHadiths: 42   },
  { id: "qudsi",        name: "الأحاديث القدسية",  arabicName: "أحاديث عن الله تعالى",           authenticityClass: "sahih", totalHadiths: 40   },
  { id: "ara-abudawud", name: "سنن أبي داود",      arabicName: "الإمام أبو داود السجستاني",       authenticityClass: "hasan", totalHadiths: 5274 },
  { id: "ara-tirmidhi", name: "جامع الترمذي",      arabicName: "الإمام محمد بن عيسى الترمذي",    authenticityClass: "hasan", totalHadiths: 3956 },
  { id: "ara-nasai",    name: "سنن النسائي",       arabicName: "الإمام أحمد بن شعيب النسائي",    authenticityClass: "hasan", totalHadiths: 5761 },
  { id: "ara-ibnmajah", name: "سنن ابن ماجه",      arabicName: "الإمام محمد بن يزيد ابن ماجه",   authenticityClass: "hasan", totalHadiths: 4341 },
  { id: "ara-malik",    name: "موطأ الإمام مالك",   arabicName: "الإمام مالك بن أنس",             authenticityClass: "sahih", totalHadiths: 1832 },
];

function cacheKey(collection: string, chapter?: number): string {
  return `${CACHE_PREFIX}${collection}${chapter != null ? `_ch${chapter}` : "_all"}`;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    return data as T;
  } catch { return null; }
}

function writeCache(key: string, data: unknown): void {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch { /* quota exceeded */ }
}

/** جلب حديث معيّن بالرقم من مجموعة */
export async function fetchHadithByNumber(
  collection: HadithCollection,
  number: number,
): Promise<CdnHadith | null> {
  const url = `${CDN_BASE}/${collection}/${number}.min.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.hadiths?.[0] ?? data ?? null;
  } catch { return null; }
}

/** جلب جميع أحاديث فصل/كتاب بعينه */
export async function fetchHadithsByChapter(
  collection: HadithCollection,
  chapter: number,
): Promise<CdnHadith[]> {
  const key = cacheKey(collection, chapter);
  const cached = readCache<CdnHadith[]>(key);
  if (cached) return cached;

  const url = `${CDN_BASE}/${collection}/${chapter}.min.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const hadiths: CdnHadith[] = data.hadiths ?? [];
    writeCache(key, hadiths);
    return hadiths;
  } catch { return []; }
}

/** جلب قائمة فصول/كتب المجموعة */
export async function fetchChapters(collection: HadithCollection): Promise<CdnChapter[]> {
  const key = cacheKey(collection) + "_chapters";
  const cached = readCache<CdnChapter[]>(key);
  if (cached) return cached;

  const url = `${CDN_BASE}/${collection}.min.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    // بناء قائمة الفصول من الأحاديث
    const chapMap = new Map<number, string>();
    for (const h of (data.hadiths ?? [])) {
      if (h.chapterno != null && !chapMap.has(h.chapterno)) {
        chapMap.set(h.chapterno, h.chapter ?? `الكتاب ${h.chapterno}`);
      }
    }
    const chapters: CdnChapter[] = Array.from(chapMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([no, name]) => ({ chapterno: no, chaptername: name }));

    writeCache(key + "_chapters", chapters);

    // خزّن الأحاديث الكاملة بالفصل
    const byChapter = new Map<number, CdnHadith[]>();
    for (const h of (data.hadiths ?? [])) {
      const ch = h.chapterno ?? 0;
      if (!byChapter.has(ch)) byChapter.set(ch, []);
      byChapter.get(ch)!.push(h);
    }
    for (const [ch, hs] of byChapter) {
      writeCache(cacheKey(collection, ch), hs);
    }

    return chapters;
  } catch { return []; }
}

/** جلب جميع الأحاديث دفعة واحدة (للمجموعات الصغيرة كالنووية والقدسية) */
export async function fetchAllHadiths(collection: HadithCollection): Promise<CdnHadith[]> {
  const key = cacheKey(collection);
  const cached = readCache<CdnHadith[]>(key);
  if (cached) return cached;

  const url = `${CDN_BASE}/${collection}.min.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const hadiths: CdnHadith[] = data.hadiths ?? [];
    writeCache(key, hadiths);
    return hadiths;
  } catch { return []; }
}

/** البحث في المجموعة الكاملة (يجلب الكل ويفلتر نصياً) */
export async function searchHadiths(
  collection: HadithCollection,
  query: string,
  limit = 50,
): Promise<CdnHadith[]> {
  const all = await fetchAllHadiths(collection);
  const q = query.trim();
  if (!q) return all.slice(0, limit);
  return all.filter((h) => h.text.includes(q)).slice(0, limit);
}
