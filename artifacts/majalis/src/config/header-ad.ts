/**
 * إعلان المنصة — شريط أعلى الهيدر و/أو كبسولة منتصف الهيدر.
 *
 * سياسة المحتوى (إلزامي قبل التفعيل):
 * - إعلانات ورعايات متوافقة مع هوية المجلس العلمي ومحتواه الشرعي التعليمي.
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
   * top = شريط أعلى الهيدر (أوضح في التطبيق)
   * header = كبسولة منتصف الهيدر
   * both = الاثنان معًا
   */
  placement: HeaderAdPlacement;
  /** شارة/زر الشراكة (مثل: إعلان شراكة) */
  badgeLabel: string;
  title: string;
  /** سطر ثانٍ داعم */
  subtitle: string;
  /** نص زر الشراكة */
  ctaLabel: string;
  /** رابط زر الشراكة — مسار داخلي */
  ctaUrl: string;
  /** رابط الضغط على إعلان الشركة (خارجي آمن) */
  sponsorUrl: string;
  /** aria-label لرابط الشركة */
  sponsorAriaLabel: string;
};

/** ألوان شريط الحالة تحت الإعلان (تباين أيقونات الساعة/الشحن) */
export const TOP_SPONSOR_STATUS = {
  light: { hex: "#E8F0EC", style: "dark" as const },
  dark: { hex: "#121816", style: "light" as const },
};

export const headerAdConfig: HeaderAdConfig = {
  enabled: true,
  placement: "top",
  badgeLabel: "إعلان شراكة",
  title: "شركة العبد المحسن للحج",
  subtitle: "الثقة • الجودة • المتعة",
  ctaLabel: "إعلان شراكة",
  /** صفحة الدعم والتواصل — للإعلان معنا */
  ctaUrl: "/support",
  sponsorUrl: "https://instagram.com/Al_abdalmhsn",
  sponsorAriaLabel: "فتح حساب شركة العبد المحسن في إنستقرام",
};

/** شكل مختصر كما في المواصفات */
export const headerAd = headerAdConfig;

/**
 * هل تُعرض كبسولة منتصف الهيدر؟
 */
export function shouldShowHeaderAd(_pathname?: string): boolean {
  if (!headerAdConfig.enabled) return false;
  return headerAdConfig.placement === "header" || headerAdConfig.placement === "both";
}

/**
 * هل يُعرض شريط الراعي أعلى الهيدر؟
 */
export function shouldShowTopSponsorBanner(): boolean {
  if (!headerAdConfig.enabled) return false;
  return headerAdConfig.placement === "top" || headerAdConfig.placement === "both";
}
