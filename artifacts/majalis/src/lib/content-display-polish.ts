import { cleanDisplayText } from "./display-text";

/** تنظيف عرض الدورات السنوية — إزالة بقايا «**عن الدورة:**» المقطوعة. */
export function cleanAnnualCourseSummary(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/\s*\*\*عن الدورة:\*\*[^.]*\.?/gu, " ")
    .replace(/\s*عن الدورة:\s*[^.]*\.?/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** اقتصاص وصف SEO عند حدود الكلمة دون قطع منتصفها. */
export function truncateAtWord(text: string, maxLen: number): string {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  const slice = t.slice(0, maxLen);
  const cut = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("،"), slice.lastIndexOf("."), 0);
  const base = cut >= Math.floor(maxLen * 0.6) ? slice.slice(0, cut) : slice;
  return `${base.trim()}…`;
}

const LESSON_PUBLIC_NOISE_RE = [
  /@[\w.]+/gu,
  /\(\s*(?:إنستقرام|انستقرام|instagram)\s*\)/giu,
  /(?:^|\s)(?:للتواصل|للتسجيل|واتس(?:اب)?|واتساب|تواصل)[:\s]*/giu,
  /(?:^|\s)[٠-٩0-9]{7,12}(?=\s|$|[،,])/gu,
];

/** تنظيف وصف الدرس للعرض العام (مسار صفحات التفاصيل). */
export function cleanLessonPublicText(text: string | null | undefined): string {
  let value = cleanDisplayText(text);
  for (const pattern of LESSON_PUBLIC_NOISE_RE) {
    value = value.replace(pattern, " ").replace(/\s+/g, " ").trim();
  }
  return value.replace(/\s*(?:أو|:)\s*(?=\s|$)/gu, " ").replace(/\s+/g, " ").trim();
}
