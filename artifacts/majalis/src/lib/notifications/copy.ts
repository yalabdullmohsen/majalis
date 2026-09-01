/**
 * نصوص الإشعار بلا اسم التطبيق — النظام يعرض هوية التطبيق في الرأس ولا يُتحكم بها.
 * هذا الملف يمنع تكرار «سُنّة» داخل العنوان أو الجسم.
 */

export const NOTIFICATION_TITLE_FALLBACK = "تذكير";

const BRAND_EXACT = /^(سُنّة|سنّة|Majlisilm|majlisilm|ssunnah)$/iu;

export function notificationTitleWithoutBrand(
  title: string,
  fallback = NOTIFICATION_TITLE_FALLBACK,
): string {
  const t = (title || "").trim();
  if (!t || BRAND_EXACT.test(t)) return fallback;
  const stripped = t
    .replace(/\s*[|·—,-]\s*سُنّة\s*$/u, "")
    .replace(/\s+في سُنّة\.?$/u, "")
    .trim();
  return stripped || fallback;
}

export function notificationBodyWithoutBrand(body: string): string {
  return (body || "")
    .replace(/\s+في سُنّة\.?/gu, "")
    .replace(/\s*سُنّة\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}
