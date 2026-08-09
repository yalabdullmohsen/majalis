/**
 * فصل صريح بين مفهومين لا يجوز خلطهما:
 *
 * 1) measurementExclusions — لاستثناءات مقياس انحراف الأسطر فقط
 *    (scripts/quran-import/measure-mushaf-line-deviation.mjs).
 *    لا تُستخدم أبدًا عند حساب حجم خط العرض.
 *
 * 2) sizingLines — أسطر التحجيم العرضي: آيات QPC + بسملة.
 *    عنوان الشارة يُرسم بخط قرآن عثماني منفصل ولا يُدخل في sizeByWidth.
 */

import { uthmaniSurahTitle } from "@/lib/surah-names-uthmani-full";

export const MEASUREMENT_EXCLUSION_REASONS = [
  "surah_name|basmallah",
  "last_line_of_surah",
] as const;

export type MeasurementExclusionReason = (typeof MEASUREMENT_EXCLUSION_REASONS)[number];

/**
 * أنواع الأسطر ذات الصلة بالعرض:
 * - ayah: وحدها تدخل في sizeByWidth (أعرض سطر آيات).
 * - basmala / surah_title: تُرسم فقط — خارج التحجيم العرضي.
 */
export const SIZING_LINE_KINDS = ["ayah", "basmala", "surah_title"] as const;

export type SizingLineKind = (typeof SIZING_LINE_KINDS)[number];

/** أنواع تدخل فعليًا في حساب حجم الخط الموحّد للصفحة */
export const WIDTH_SIZING_LINE_KINDS = ["ayah"] as const;

/** بسملة افتتاحية Unicode — خط رقعة/ثلث ممدود أخف من أسطر الآيات (ليست آية الفاتحة) */
export const DRAWN_BASMALA_TEXT = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

/**
 * تسمية عنوان السورة في الشارة: «سُورَةُ …» بالرسم العثماني المشكَّل.
 * يُفضَّل تمرير surahId؛ وإلا تُسبق nameArabic بـ «سُورَةُ».
 */
export function drawnSurahTitleText(nameArabic: string, surahId?: number): string {
  if (surahId != null && surahId >= 1 && surahId <= 114) {
    return uthmaniSurahTitle(surahId);
  }
  const bare = String(nameArabic ?? "").replace(/^(?:سُورَةُ|سورة)\s*/u, "").trim();
  return bare ? `سُورَةُ ${bare}` : "";
}

/**
 * ثابت صلب: بعد التحجيم، عرض أي سطر مرسوم ≤ عرض الحاوية.
 * أي تجاوز = قصّ محتمل لكلمة من القرآن — فشل اختبار.
 */
export const DRAWN_LINE_MAX_OVERFLOW_PX = 0;
