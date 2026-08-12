import { stripMarkdown } from "./strip-markdown";
import { cleanTimeText } from "./lesson-time";

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

  return cleanTimeText(value);
}
