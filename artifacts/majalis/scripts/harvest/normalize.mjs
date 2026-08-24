const DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;
const TATWEEL = /\u0640/g;
const EMOJI =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu;

/** تطبيع عربي للمقارنة والتصنيف */
export function normalizeArabic(input) {
  return String(input ?? "")
    .replace(EMOJI, "")
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripEmojiFromTitle(title) {
  return String(title ?? "")
    .replace(EMOJI, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** إزالة أرقام تسلسل الدروس/الحلقات من العناوين */
export function stripLessonSeriesNumbers(text) {
  return String(text ?? "")
    .replace(/[(\[]\s*[٠-٩0-9]{1,4}\s*[)\]]/gu, " ")
    .replace(
      /(?:^|\s)(?:ال)?(?:حلقة|حلقات|درس|دروس|محاضرة|محاضرات|لقاء|جلسة)\s*(?:رقم|#)?\s*[٠-٩0-9]{1,3}(?=\s|$|[،,.])/giu,
      " ",
    )
    .replace(/#\s*[٠-٩0-9]+\b/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function summaryFromText(text, max = 160) {
  const clean = normalizeArabic(text).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}
