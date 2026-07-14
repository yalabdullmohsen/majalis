/**
 * الإعداد المركزي لهوية المنصة — مصدر واحد لاسم المنصة ونطاقها وبريدها الرسمي.
 * لا تكتب اسم المنصة أو بريدها يدويًا في ملفات متفرقة؛ استورد من هنا.
 *
 * قيم SITE_NAME و SITE_URL تُقرأ من seo-routes.json حتى تبقى متطابقة مع مولّد
 * الـ prerender والـ sitemap (مصدر واحد لا يتباعد).
 */
import seoData from "./seo-routes.json";

/** الاسم الرسمي الوحيد للمنصة. */
export const SITE_NAME: string = seoData.siteName; // "المجلس العلمي"
/** الاسم المختصر (للأيقونات/العناوين القصيرة). */
export const SITE_SHORT_NAME = "المجلس العلمي";
/** الوصف الرسمي المختصر. */
export const SITE_DESCRIPTION =
  "منصة علمية شرعية تجمع الدروس والدورات والقرآن الكريم والأذكار والفتاوى والمكتبة لطالب العلم.";
/** النطاق الرسمي الوحيد (بدون www) — يطابق canonical والـ sitemap. */
export const SITE_URL: string = seoData.siteUrl; // "https://majlisilm.com"
export const SITE_DOMAIN = new URL(SITE_URL).host; // "majlisilm.com"

/** البريد الرسمي من النطاق — لا بريد شخصي. */
export const SITE_EMAIL = {
  info: "info@majlisilm.com",
  support: "support@majlisilm.com",
  content: "content@majlisilm.com",
  review: "review@majlisilm.com",
  privacy: "privacy@majlisilm.com",
} as const;

/** أسماء تجارية قديمة يجب ألا تظهر (تُستخدم في اختبار الهوية لمنع الرجوع). */
export const FORBIDDEN_BRAND_NAMES = [
  "مجالس العلم",
  "منصة المجالس",
  "فريق المجالس",
  "مجتمع المجالس",
  "مجالس العلمية",
] as const;

/** صيغة عنوان الصفحة الموحدة: [اسم الصفحة] | [الاسم الرسمي]. */
export function pageTitle(pageName: string): string {
  return `${pageName} | ${SITE_NAME}`;
}
