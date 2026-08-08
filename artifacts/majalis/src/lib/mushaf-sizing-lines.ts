/**
 * فصل صريح بين مفهومين لا يجوز خلطهما:
 *
 * 1) measurementExclusions — لاستثناءات مقياس انحراف الأسطر فقط
 *    (scripts/quran-import/measure-mushaf-line-deviation.mjs).
 *    لا تُستخدم أبدًا عند حساب حجم خط العرض.
 *
 * 2) sizingLines — كل الأسطر المرسومة على الصفحة: آيات QPC، بسملة،
 *    عنوان سورة، والسطر الأخير لأي سورة. حجم الخط الموحّد يُحسب من
 *    أعرض سطر مرسوم أيًا كان نوعه.
 */

export const MEASUREMENT_EXCLUSION_REASONS = [
  "surah_name|basmallah",
  "last_line_of_surah",
] as const;

export type MeasurementExclusionReason = (typeof MEASUREMENT_EXCLUSION_REASONS)[number];

/** أنواع الأسطر التي تدخل في حساب حجم الخط (عرض) */
export const SIZING_LINE_KINDS = ["ayah", "basmala", "surah_title"] as const;

export type SizingLineKind = (typeof SIZING_LINE_KINDS)[number];

/** نص البسملة المرسوم (Unicode) — يجب أن يدخل في sizingLines */
export const DRAWN_BASMALA_TEXT = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

/** تسمية عنوان السورة كما تُرسم في الواجهة */
export function drawnSurahTitleText(nameArabic: string): string {
  return `سُورَةُ ${nameArabic}`;
}

/**
 * ثابت صلب: بعد التحجيم، عرض أي سطر مرسوم ≤ عرض الحاوية.
 * أي تجاوز = قصّ محتمل لكلمة من القرآن — فشل اختبار.
 */
export const DRAWN_LINE_MAX_OVERFLOW_PX = 0;
