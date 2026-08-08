/**
 * arabic-normalize.ts
 * وحدة التطبيع العربي المشتركة — للفهرسة والبحث فقط.
 *
 * ⚠️ قاعدة حرجة: هذه الوحدة للفهرسة والمقارنة الداخلية فقط.
 *    النص المعروض للمستخدم (آيات / أحاديث / أذكار) يُعرض دائماً
 *    بتشكيله الكامل بدون أي تعديل.
 *
 * Memoized via LRU (max 2k entries) — identical strings normalize once.
 */

import { toLatinDigits } from "@/lib/numerals";
import { LruStringCache } from "@/lib/lru-cache";
import { encodeUtf8, encodeUtf8Copy, utf8ByteLength } from "@/lib/text-codec";

const NORMALIZE_CACHE = new LruStringCache(2_048);

/** يحوّل أي أرقام هندية عربية أو فارسية داخل نص إلى أرقام لاتينية عادية،
 *  مع ترك بقية النص كما هو تمامًا. آمن للاستدعاء على نص لا يحوي أرقامًا
 *  إطلاقًا (يعيده دون تغيير). مصدر الحقيقة: lib/numerals.toLatinDigits.
 */
export function toWesternDigits(text: string): string {
  if (!text) return text ?? "";
  return toLatinDigits(text);
}

/** يزيل التشكيل الكامل بما يشمل حركات مدّ القرآن وعلامات الوقف */
function removeTashkeel(text: string): string {
  return text
    // ─── الحركات الأساسية U+064B–U+065F ─────────────────────────
    .replace(/[ً-ٟ]/g, "")
    // ─── ألف خنجرية U+0670 ───────────────────────────────────────
    .replace(/ٰ/g, "")
    // ─── مدّات قرآنية U+0653–U+0655 ──────────────────────────────
    .replace(/[ٓ-ٕ]/g, "")
    // ─── علامات تجويد/ترتيل إضافية U+0616–U+061A ────────────────
    .replace(/[ؖ-ؚ]/g, "")
    // ─── علامات وقف قرآنية U+06D6–U+06DC و U+06DF–U+06E4 و U+06E7–U+06ED ──
    .replace(/[ۖ-ۜ۟-ۤۧ-ۭ]/g, "")
    // ─── الحروف العالية U+0610–U+061A (تشمل ﷺ) ─
    .replace(/[ؐ-ؚ]/g, "")
    // ─── ممدودات قرآنية U+06E5–U+06E6 ───────────────────────────
    .replace(/[ۥ-ۦ]/g, "");
}

/** يزيل محارف غير مرئية (ZWSP/ZWNJ/BOM/علامات اتجاه) قبل المقارنة. */
function stripInvisible(text: string): string {
  return text
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g, "")
    .replace(/\u00A0/g, " ");
}

/** Uncached normalize core — used by memoized wrapper. */
function normalizeArabicUncached(text: string): string {
  // ─── توحيد الأرقام (لوحة مفاتيح عربية على iOS/Android تكتب ٢ لا 2) ──
  let s = toWesternDigits(stripInvisible(text));

  s = removeTashkeel(s);

  // ─── توحيد أشكال الألف ────────────────────────────────────────
  s = s.replace(/[أإآٱ]/g, "ا");

  // ─── ؤ → و ───────────────────────────────────────────────────
  s = s.replace(/ؤ/g, "و");

  // ─── ئ → ي ───────────────────────────────────────────────────
  s = s.replace(/ئ/g, "ي");

  // ─── ة → ه ───────────────────────────────────────────────────
  s = s.replace(/ة/g, "ه");

  // ─── ى → ي ───────────────────────────────────────────────────
  s = s.replace(/ى/g, "ي");

  // ─── إزالة الكشيدة ───────────────────────────────────────────
  s = s.replace(/ـ/g, "");

  // ─── إزالة علامات الترقيم الفاصلة ───────────────────────────
  // نحتفظ بالمسافات وبنقطتي مرجع الآية (2:255). نزيل: , . ; ! ? ، ؛ ؟ « » … — —
  s = s.replace(/[,.;!?،؛؟«»""''()[\]{}\-—]/g, " ");
  // نقطتان لستم بين رقمين → مسافة (تفادي كسر مراجع الآيات)
  s = s.replace(/(?<!\d):(?!\d)/g, " ");

  // ─── توحيد المسافات ──────────────────────────────────────────
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/**
 * يطبّع نصاً عربياً للفهرسة والبحث المقارن.
 * Cached (LRU) — repeated queries over Quran/Matn corpora hit memo.
 *
 * هذه هي دالة التطبيع المركزية الوحيدة للبحث في التطبيق:
 * أرقام هندية/فارسية/غربية + ألف/ياء/ة + إزالة تشكيل/تطويل/محارف خفية.
 * طبّقها على الاستعلام وعلى حقول الفهرس معًا.
 */
export function normalizeArabic(text: string): string {
  if (!text) return "";
  const hit = NORMALIZE_CACHE.get(text);
  if (hit !== undefined) return hit;
  const out = normalizeArabicUncached(text);
  NORMALIZE_CACHE.set(text, out);
  return out;
}

/** اسم صريح لنقطة الدخول المشتركة — مرادف لـ normalizeArabic. */
export const normalizeForSearch = normalizeArabic;

/** Clear normalize memo (tests / memory pressure). */
export function clearNormalizeArabicCache(): void {
  NORMALIZE_CACHE.clear();
}

export function getNormalizeArabicCacheSize(): number {
  return NORMALIZE_CACHE.size;
}

/**
 * Part 22: normalize → UTF-8 via shared TextEncoder scratch (view valid until next encode).
 * Use for ephemeral index comparisons; prefer `normalizeArabicUtf8Copy` for stored keys.
 */
export function normalizeArabicUtf8(text: string): Uint8Array {
  return encodeUtf8(normalizeArabic(text));
}

/** Durable UTF-8 bytes for search index keys / hashing. */
export function normalizeArabicUtf8Copy(text: string): Uint8Array {
  return encodeUtf8Copy(normalizeArabic(text));
}

/** Byte length of normalized form without retaining an allocation beyond scratch. */
export function normalizeArabicUtf8Length(text: string): number {
  return utf8ByteLength(normalizeArabic(text));
}

/**
 * يتحقق من وجود needle في haystack بعد تطبيع الطرفين.
 * مناسب للبحث الجانب-العميل.
 */
export function normalizedIncludes(
  haystack: string | null | undefined,
  needle: string,
): boolean {
  if (!needle.trim()) return true;
  if (!haystack) return false;
  return normalizeArabic(haystack).includes(normalizeArabic(needle));
}

/**
 * يتحقق من وجود needle في أي من الحقول بعد التطبيع.
 */
export function normalizedMatchAny(
  fields: Array<string | null | undefined>,
  needle: string,
): boolean {
  return fields.some((f) => normalizedIncludes(f ?? "", needle));
}
