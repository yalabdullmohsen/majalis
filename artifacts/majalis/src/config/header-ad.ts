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
  title: string;
  /** سطر ثانٍ عند عدم وجود راعٍ فعلي */
  subtitle: string;
  ctaLabel: string;
  /** رابط الضغط — مسار داخلي أو mailto (بلا popup) */
  ctaUrl: string;
};

export const headerAdConfig: HeaderAdConfig = {
  enabled: true,
  placement: "top",
  title: "مساحة إعلانية مميزة",
  subtitle: "أعلن هنا للمهتمين بالمحتوى الشرعي والتعليمي",
  ctaLabel: "احجز",
  /** صفحة الدعم والتواصل — آمن داخل التطبيق */
  ctaUrl: "/support",
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
