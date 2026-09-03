/**
 * مطابقة التلاوة — Levenshtein + وضع متساهل/دقيق.
 * النص المعروض لا يُعدَّل؛ التطبيع في الذاكرة فقط للمقارنة.
 */
import { normalizeQuranWord } from "./quran-normalize";

/** عتبة التطابق في الوضع المتساهل (٪) */
export const TOLERANT_SIMILARITY_THRESHOLD_PCT = 75;

/** يزيل التشكيل ويوحّد أشكال الألف (عبر طبقة القرآن) */
export function normalizeArabicText(text: string): string {
  return normalizeQuranWord(text);
}

export function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i]![0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0]![j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + indicator,
      );
    }
  }
  return matrix[a.length]![b.length]!;
}

export function matchRecitationAdvanced(
  expectedWord: string,
  spokenText: string,
  isStrict: boolean,
): boolean {
  const normalizedExpected = normalizeArabicText(expectedWord);
  const normalizedSpoken = normalizeArabicText(spokenText);
  return matchNormalizedWords(normalizedExpected, normalizedSpoken, isStrict);
}

/** لمحرك المحاذاة — المدخلات مطبَّعة مسبقًا (normalizeQuranWord) */
export function matchNormalizedWords(
  expectedNorm: string,
  spokenNorm: string,
  isStrict: boolean,
): boolean {
  if (isStrict) return expectedNorm === spokenNorm;
  if (!expectedNorm && !spokenNorm) return true;
  if (!expectedNorm || !spokenNorm) return false;

  const distance = getLevenshteinDistance(expectedNorm, spokenNorm);
  const maxLength = Math.max(expectedNorm.length, spokenNorm.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return (
    similarity >= TOLERANT_SIMILARITY_THRESHOLD_PCT ||
    spokenNorm.includes(expectedNorm) ||
    expectedNorm.includes(spokenNorm)
  );
}
