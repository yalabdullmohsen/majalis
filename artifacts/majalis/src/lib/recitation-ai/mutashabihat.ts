/**
 * mutashabihat.ts
 * وحدة قراءة فهرس "الآيات المتشابهة" المُحسوب فعليًا عبر
 * scripts/build-mutashabihat-index.mjs (راجع تعليقات ذلك الملف للمنهجية
 * الكاملة — لا قائمة يدوية، تحليل نصي حقيقي لكامل المصحف).
 *
 * الفهرس ملف ثابت (public/data/quran/mutashabihat-index.json، ~90 كيلوبايت)
 * لا يُحمَّل إلا عند الحاجة الفعلية (شاشة التقرير فقط، لا أثناء الجلسة
 * الحيّة) — يُخزَّن مؤقتًا (module-level cache) بعد أول تحميل ناجح.
 */

export type MutashabihMatch = { surah: number; ayah: number; overlapRatio: number };
type MutashabihatIndexRaw = Record<string, MutashabihMatch[]>;

let cached: Promise<MutashabihatIndexRaw> | null = null;

/** يُحمَّل مرة واحدة فقط لكل تحميل صفحة، ويُخزَّن مؤقتًا لبقية الجلسة. */
export async function loadMutashabihatIndex(): Promise<MutashabihatIndexRaw> {
  if (!cached) {
    cached = fetch("/data/quran/mutashabihat-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`تعذّر تحميل فهرس المتشابهات (HTTP ${res.status})`);
        return res.json() as Promise<MutashabihatIndexRaw>;
      })
      .catch((err) => {
        cached = null; // السماح بإعادة المحاولة لاحقًا بدل تجميد فشل دائم
        throw err;
      });
  }
  return cached;
}

/** أعلى الآيات تشابهًا نصيًا مع (surah, ayah) — فارغة إن لم تكن مفهرَسة (لا تشابه محسوب فوق العتبة). */
export function getSimilarAyahs(index: MutashabihatIndexRaw, surah: number, ayah: number): MutashabihMatch[] {
  return index[`${surah}:${ayah}`] ?? [];
}
