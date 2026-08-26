/**
 * تقريب عدّادات البطاقات إلى مضاعف عشرة تنازلي مع «+» وأرقام عربية مشرقية.
 * للعرض فقط — لا يُستخدم على نصوص شرعية مخزّنة.
 */
import { toArabicIndicDigits } from "@/lib/numerals";

/**
 * 97 → «٩٠+» · 28 → «٢٠+» · 9 → «٩» · 0 → «٠»
 */
export function formatCountBucket(count: number): string {
  const n = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  if (n < 10) {
    return toArabicIndicDigits(n);
  }
  const bucket = Math.floor(n / 10) * 10;
  return `${toArabicIndicDigits(bucket)}+`;
}
