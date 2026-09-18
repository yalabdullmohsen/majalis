/**
 * تجهيز عربي للنطق فقط — لا يغيّر المعنى ولا يُستخدم للعرض.
 * يضيف فواصل نطقية خفيفة عبر تطبيع علامات الترقيم قبل التقسيم.
 */

/** يجهّز نصًا تحريريًا مسموحًا للسرد (بعد عزل المحمي). */
export function prepareArabicForNarration(raw: string): string {
  return raw
    .replace(/\u0640/g, "") // تطويل زائد يربك بعض المحركات
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s*([،؛:!?؟۔.])\s*/g, "$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * يحوّل مقياس الوقف إلى زمن SSML بالميلي ثانية.
 * القيمة الأساسية من مولّد SSML تُضرب في breakScale.
 */
export function scaleBreakMs(baseMs: number, breakScale: number): number {
  return Math.max(120, Math.round(baseMs * breakScale));
}
