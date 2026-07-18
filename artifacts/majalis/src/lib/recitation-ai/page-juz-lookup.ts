/**
 * page-juz-lookup.ts
 * قراءة فهرس صفحات/أجزاء/أحزاب/أرباع المصحف المبني فعليًا عبر
 * scripts/build-page-juz-index.mjs من حقول page/juz/hizbQuarter الحقيقية
 * الموجودة في public/data/quran/*.json — يُستخدَم لأوضاع "بالصفحة"/
 * "بالجزء"/"بالحزب"/"بالربع" (القسم 2: توسعة أنماط دخول التسميع) في
 * RecitationTestPage.tsx.
 */

export type QuranSegment = { surah: number; ayahFrom: number; ayahTo: number };
type PageJuzIndexRaw = {
  byPage: Record<string, QuranSegment[]>;
  byJuz: Record<string, QuranSegment[]>;
  byHizb: Record<string, QuranSegment[]>;
  byRub: Record<string, QuranSegment[]>;
};

let cached: Promise<PageJuzIndexRaw> | null = null;

/** يُحمَّل مرة واحدة فقط لكل تحميل صفحة (~50 كيلوبايت) — فقط عند اختيار أحد هذه الأوضاع فعليًا. */
export async function loadPageJuzIndex(): Promise<PageJuzIndexRaw> {
  if (!cached) {
    cached = fetch("/data/quran/page-juz-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`تعذّر تحميل فهرس الصفحات/الأجزاء (HTTP ${res.status})`);
        return res.json() as Promise<PageJuzIndexRaw>;
      })
      .catch((err) => {
        cached = null;
        throw err;
      });
  }
  return cached;
}

/** مقاطع السور (سورة + من آية + إلى آية) المُكوِّنة لصفحة مصحف معيَّنة (1-604) — فارغة إن كان الرقم خارج النطاق. */
export function getSegmentsForPage(index: PageJuzIndexRaw, page: number): QuranSegment[] {
  return index.byPage[String(page)] ?? [];
}

/** مقاطع السور المُكوِّنة لجزء معيَّن (1-30) — فارغة إن كان الرقم خارج النطاق. */
export function getSegmentsForJuz(index: PageJuzIndexRaw, juz: number): QuranSegment[] {
  return index.byJuz[String(juz)] ?? [];
}

/** مقاطع السور المُكوِّنة لحزب معيَّن (1-60) — فارغة إن كان الرقم خارج النطاق. */
export function getSegmentsForHizb(index: PageJuzIndexRaw, hizb: number): QuranSegment[] {
  return index.byHizb[String(hizb)] ?? [];
}

/** مقاطع السور المُكوِّنة لربع حزب معيَّن (1-240) — فارغة إن كان الرقم خارج النطاق. */
export function getSegmentsForRub(index: PageJuzIndexRaw, rub: number): QuranSegment[] {
  return index.byRub[String(rub)] ?? [];
}
