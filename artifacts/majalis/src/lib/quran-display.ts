/**
 * مساعدات عرض قرآن — طبقة واجهة فقط.
 * لا تُعدّل بيانات النص المخزَّنة ولا بصمة المصحف.
 */
import {
  getSurahMeta,
  stripEmbeddedBismillah,
} from "@/lib/quran-api";
import { normalizeArabic } from "@/shared/arabic-normalize";

const SURAH_PREFIX_RE = /^(?:سُورَةُ|سورة|سوره)\s*/u;
const TASHKEEL_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

/** اسم سورة بلا تشكيل للواجهة — مصدر الحقيقة: SURAH_NAMES_AR. */
export function displaySurahName(surahNumber: number): string {
  return getSurahMeta(surahNumber).name;
}

/**
 * يحوّل أي تسمية خام (من manifest مشكَّل أو سُورَةُ…) إلى الاسم الموحّد بلا تشكيل.
 */
export function displaySurahNameFromLabel(
  raw: string,
  surahNumber?: number,
): string {
  if (surahNumber && surahNumber >= 1 && surahNumber <= 114) {
    return displaySurahName(surahNumber);
  }
  const cleaned = String(raw ?? "").replace(SURAH_PREFIX_RE, "").trim();
  if (!cleaned) return "";
  const needle = normalizeArabic(cleaned);
  for (let i = 1; i <= 114; i++) {
    if (normalizeArabic(getSurahMeta(i).name) === needle) {
      return getSurahMeta(i).name;
    }
  }
  return cleaned.replace(TASHKEEL_RE, "");
}

/**
 * مقتطف آية للعرض: يفصل البسملة المدموجة عن الآية ١
 * (عدا الفاتحة؛ التوبة بلا بسملة أصلًا).
 */
export function displayAyahSnippet(
  surahNumber: number,
  ayahNumber: number,
  text: string,
): string {
  return stripEmbeddedBismillah(surahNumber, ayahNumber, text);
}

/** هل يبدأ المقتطف المعروض بالبسملة؟ (للاختبارات / الحراسة) */
export function displaySnippetStartsWithBismillah(snippet: string): boolean {
  const n = normalizeArabic(snippet);
  return n.startsWith("بسم الله الرحمن الرحيم") || n.startsWith("بسم الله");
}
