/** @deprecated أُزيل الشريط العلوي — استخدم header-ad.ts */
/**
 * إعدادات شريط الإعلان في الصفحة الرئيسية فقط.
 *
 * سياسة المحتوى (إلزامي قبل التفعيل):
 * - إعلانات ورعايات متوافقة مع هوية سُنّة ومحتواه الشرعي التعليمي.
 * - لا إعلانات عشوائية، ولا سكربتات طرف ثالث (Google Ads وغيرها).
 * - لا محتوى يخالف الشريعة أو يسيء لسمعة المنصة.
 * - المراجعة البشرية مطلوبة قبل نشر أي راعٍ حقيقي.
 */
export type HomepageAdConfig = {
  /** false = لا يُعرض الشريط نهائيًا */
  enabled: boolean;
  /** شارة صغيرة أعلى النص — مثل «مساحة إعلانية مميزة» */
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  /** رابط الزر — بريد أو صفحة تواصل داخلية */
  ctaUrl: string;
  /** اسم الراعي عند تفعيل حملة حقيقية (اختياري) */
  sponsorName?: string;
  /** صورة شعار الراعي — تُحمَّل كسولاً فقط عند التعريف */
  image?: string;
};

export const homepageAdConfig: HomepageAdConfig = {
  enabled: false,
  label: "مساحة إعلانية مميزة",
  title: "أعلن لآلاف المهتمين بالمحتوى الشرعي والتعليمي",
  description: "مساحة مخصصة للرعايات والإعلانات المتوافقة مع هوية سُنّة.",
  ctaLabel: "احجز إعلانك",
  ctaUrl:
    "mailto:Majlisilm.app@gmail.com?subject=" +
    encodeURIComponent("طلب إعلان — سُنّة") +
    "&body=" +
    encodeURIComponent("السلام عليكم،\nأرغب في الاستفسار عن مساحة إعلانية / رعاية في سُنّة.\n\n"),
};
