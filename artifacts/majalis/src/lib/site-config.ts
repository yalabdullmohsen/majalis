/**
 * هوية المنصة — المصدر الوحيد.
 * القيم من site.config.json، وهو نفسه ما تقرؤه سكربتات البناء، فلا يتفرّع الاسم أو النطاق.
 */
import config from "../../site.config.json";

export const SITE_NAME = config.siteName;
export const SITE_SHORT_NAME = config.siteShortName;
export const SITE_DESCRIPTION = config.siteDescription;
export const SITE_URL = config.siteUrl;
export const TITLE_SUFFIX = config.titleSuffix;
/** بريد التواصل الرسمي الوحيد للمنصة كاملةً — لا تكتب بريدًا آخر يدويًا في أي مكوّن. */
export const CONTACT_EMAIL = config.contactEmail;
export const DEFAULT_IMAGE = config.defaultImage;

/** رابط mailto: بموضوع محدَّد مسبقًا حسب نوع الطلب (استفسار عام، إبلاغ خطأ...). */
export function mailtoWithSubject(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/** صيغة العنوان المعتمدة: «[اسم الصفحة] | المجلس العلمي». الرئيسية وحدها بلا لاحقة. */
export function pageTitle(pageName?: string | null): string {
  const name = (pageName || "").trim();
  if (!name || name === SITE_NAME) return SITE_NAME;
  if (name.endsWith(TITLE_SUFFIX)) return name;
  return `${name}${TITLE_SUFFIX}`;
}

/** رابط مطلق على النطاق المعتمد. */
export function absoluteUrl(path: string): string {
  return new URL(path || "/", SITE_URL).toString();
}
