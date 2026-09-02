/**
 * إعلان المنصة — banner داخل الهيدر (ليس فوق شريط النظام).
 *
 * سياسة المحتوى (إلزامي قبل التفعيل):
 * - إعلانات ورعايات متوافقة مع هوية سُنّة ومحتواه الشرعي التعليمي.
 * - لا إعلانات عشوائية، ولا سكربتات طرف ثالث (Google Ads وغيرها).
 * - لا محتوى يخالف الشريعة أو يسيء لسمعة المنصة.
 * - المراجعة البشرية مطلوبة قبل نشر أي راعٍ حقيقي.
 *
 * التعطيل: ضع `headerAd.enabled = false`.
 */
export type HeaderAdPlacement = "top" | "header" | "both";

export type HeaderAdConfig = {
  enabled: boolean;
  /**
   * top = شريط منفصل (مُهمَل — استخدم header)
   * header = banner داخل الهيدر
   * both = header + top (legacy)
   */
  placement: HeaderAdPlacement;
  /** شارة الشراكة داخل الإعلان */
  badgeLabel: string;
  title: string;
  /** سطر تسويقي */
  subtitle: string;
  /** CTA مدمج داخل البطاقة */
  ctaLabel: string;
  /** وجهة ثانوية (صفحة التواصل) — غير ظاهرة في الهيدر */
  ctaUrl: string;
  /** رابط إنستقرام الشركة */
  sponsorUrl: string;
  /** aria-label للإعلان */
  sponsorAriaLabel: string;
};

/** legacy — لم يعد يُفعَّل من TopSponsorBanner */
export const TOP_SPONSOR_STATUS = {
  light: { hex: "#F2F4F3", style: "dark" as const },
  dark: { hex: "#101614", style: "light" as const },
};

export const headerAdConfig: HeaderAdConfig = {
  enabled: false,
  placement: "header",
  badgeLabel: "شريك سُنّة",
  title: "شركة العبد المحسن للحج",
  subtitle: "الثقة • الجودة • المتعة",
  ctaLabel: "فتح إنستقرام",
  ctaUrl: "/contact",
  sponsorUrl: "https://instagram.com/Al_abdalmhsn",
  sponsorAriaLabel: "فتح حساب شركة العبد المحسن للحج في إنستقرام",
};

/** شكل مختصر كما في المواصفات */
export const headerAd = headerAdConfig;

export function shouldShowHeaderAd(_pathname?: string): boolean {
  if (!headerAdConfig.enabled) return false;
  return headerAdConfig.placement === "header" || headerAdConfig.placement === "both";
}

/** @deprecated — الإعلان داخل الهيدر فقط */
export function shouldShowTopSponsorBanner(): boolean {
  if (!headerAdConfig.enabled) return false;
  return headerAdConfig.placement === "top";
}
