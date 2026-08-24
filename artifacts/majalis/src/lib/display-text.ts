import { stripMarkdown } from "./strip-markdown";
import { cleanTimeText } from "./lesson-time";
import { stripEmojiFromTitle } from "../../scripts/harvest/normalize.mjs";

/** إزالة الإيموجي من النص المعروض */
export function stripEmoji(text: string | null | undefined): string {
  return stripEmojiFromTitle(text);
}

const EXTRACTION_PHRASES = [
  /إعلانات\s+رسمية/giu,
  /تم\s+استخراج(?:ها|ه)?\s+من\s+الإعلانات/giu,
  /تم\s+جمع\s+البيانات/giu,
  /تم\s+استخراج\s+المعلومات/giu,
  /بيانات\s+أولية/giu,
  /مصدر\s+الإعلان/giu,
  /مستخرج(?:ة)?\s+من/giu,
  /قائمة\s+المشايخ/giu,
  /أحدث\s+المشايخ/giu,
  /بيانات\s+تجريبية/giu,
  /نص\s+تجريبي/giu,
];

/** إزالة أرقام تسلسل الدروس/الحلقات من العناوين المعروضة */
export function stripLessonSeriesNumbers(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/[([]\s*[٠-٩0-9]{1,4}\s*[)\]]/gu, " ")
    .replace(
      /(?:^|\s)(?:ال)?(?:حلقة|حلقات|درس|دروس|محاضرة|محاضرات|لقاء|جلسة)\s*(?:رقم|#)?\s*[٠-٩0-9]{1,3}(?=\s|$|[،,.])/giu,
      " ",
    )
    .replace(/#\s*[٠-٩0-9]+\b/gu, " ")
    .replace(/\s*[—–\-|]\s*[٠-٩0-9]{1,3}\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Clean user-visible text from markdown artifacts. */
export function displayText(text: string | null | undefined): string {
  if (!text) return "";
  return stripMarkdown(text);
}

/** Strip markdown, extraction phrases, and decorative dashes. */
export function cleanDisplayText(text: string | null | undefined): string {
  if (!text) return "";
  let value = displayText(text)
    .replace(/\s*[—–\-_]{1,}\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const pattern of EXTRACTION_PHRASES) {
    value = value.replace(pattern, " ").replace(/\s+/g, " ").trim();
  }

  return stripLessonSeriesNumbers(stripEmoji(cleanTimeText(value)));
}
