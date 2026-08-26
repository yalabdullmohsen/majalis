/**
 * جمع عربي للعدّادات المعروضة في الواجهة (مسائل، أبواب، …).
 * لا يُستخدم لتوليد محتوى شرعي — عرض أعداد فقط.
 */
import { formatCountBucket } from "@/lib/format-count-bucket";
import { toArabicIndicDigits } from "@/lib/numerals";

export type ArabicCountNoun = {
  zero: string;
  one: string;
  two: string;
  few: string; // 3–10
  many: string; // 11+
};

export const NOUN_MASAIL: ArabicCountNoun = {
  zero: "لا مسائل",
  one: "مسألة",
  two: "مسألتان",
  few: "مسائل",
  many: "مسألة",
};

export const NOUN_ABWAB: ArabicCountNoun = {
  zero: "لا أبواب",
  one: "باب",
  two: "بابان",
  few: "أبواب",
  many: "باباً",
};

/**
 * 0 → zero · 1 → one · 2 → two · 3–10 → N + few · 11+ → N + many
 */
export function arabicCountLabel(n: number, noun: ArabicCountNoun): string {
  const count = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  if (count === 0) return noun.zero;
  if (count === 1) return noun.one;
  if (count === 2) return noun.two;
  if (count >= 3 && count <= 10) return `${count} ${noun.few}`;
  return `${count} ${noun.many}`;
}

export function formatMasailCount(n: number): string {
  return arabicCountLabel(n, NOUN_MASAIL);
}

export function formatAbwabCount(n: number): string {
  return arabicCountLabel(n, NOUN_ABWAB);
}

/** جمع عربي عام للعدّادات الظاهرة (دروس، حلقات، …). */
export function pluralAr(n: number, noun: ArabicCountNoun): string {
  return arabicCountLabel(n, noun);
}

/**
 * جمع عربي مع تقريب عشري تنازلي لبطاقات الاختصارات (٩٠+ درساً).
 * الصفر والنادر (< ١٠) بلا «+»؛ الصفر يبقى نص zero المخصص.
 */
export function pluralArBucket(n: number, noun: ArabicCountNoun): string {
  const count = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  if (count === 0) return noun.zero;
  if (count === 1) return noun.one;
  if (count === 2) return noun.two;
  if (count < 10) return `${toArabicIndicDigits(count)} ${noun.few}`;
  return `${formatCountBucket(count)} ${noun.many}`;
}

export const NOUN_DURUS: ArabicCountNoun = {
  zero: "لا دروس",
  one: "درس",
  two: "درسان",
  few: "دروس",
  many: "درساً",
};

export const NOUN_HALAQAT: ArabicCountNoun = {
  zero: "لا حلقات",
  one: "حلقة",
  two: "حلقتان",
  few: "حلقات",
  many: "حلقة",
};

export const NOUN_MUNASABAT: ArabicCountNoun = {
  zero: "لا مناسبات",
  one: "مناسبة",
  two: "مناسبتان",
  few: "مناسبات",
  many: "مناسبة",
};

export const NOUN_ASILA: ArabicCountNoun = {
  zero: "لا أسئلة",
  one: "سؤال",
  two: "سؤالان",
  few: "أسئلة",
  many: "سؤالاً",
};

/** عدّادات إعلانات المسابقات الخارجية (ليست أسئلة). */
export const NOUN_MUSABAQAT: ArabicCountNoun = {
  zero: "لا مسابقات",
  one: "مسابقة",
  two: "مسابقتان",
  few: "مسابقات",
  many: "مسابقة",
};
