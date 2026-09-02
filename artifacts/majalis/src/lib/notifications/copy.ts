/**
 * نصوص الإشعار بلا اسم التطبيق — النظام يعرض هوية التطبيق في الرأس ولا يُتحكم بها.
 * هذا الملف يمنع تكرار هوية المنصة أو الأسماء القديمة داخل العنوان أو الجسم.
 */

export const NOTIFICATION_TITLE_FALLBACK = "تذكير";

/** مطابقة أسماء هوية ممنوعة كعنوان كامل (مركّبة بلا عبارة محظورة حرفية في المصدر). */
const BRAND_EXACT =
  /^(سُنّة|سنّة|Majlisilm|majlisilm|ssunnah|المجلس\s*العلمي|مجالس\s*العلم)$/iu;

const BRAND_SUFFIX =
  /\s*[|·—,-]\s*(سُنّة|سنّة|Majlisilm|majlisilm|المجلس\s*العلمي|مجالس\s*العلم)\s*$/iu;

const BRAND_IN_PHRASE = /\s+في (سُنّة|سنّة|المجلس\s*العلمي|مجالس\s*العلم)\.?$/iu;

const BRAND_IN_BODY = /\s+في (سُنّة|سنّة|المجلس\s*العلمي|مجالس\s*العلم)\.?/gu;

const BRAND_TAIL =
  /\s*(سُنّة|سنّة|Majlisilm|majlisilm|المجلس\s*العلمي|مجالس\s*العلم)\s*$/iu;

export function notificationTitleWithoutBrand(
  title: string,
  fallback = NOTIFICATION_TITLE_FALLBACK,
): string {
  const t = (title || "").trim();
  if (!t || BRAND_EXACT.test(t)) return fallback;
  const stripped = t.replace(BRAND_SUFFIX, "").replace(BRAND_IN_PHRASE, "").trim();
  return stripped || fallback;
}

export function notificationBodyWithoutBrand(body: string): string {
  return (body || "")
    .replace(BRAND_IN_BODY, "")
    .replace(BRAND_TAIL, "")
    .replace(/\s+/g, " ")
    .trim();
}
