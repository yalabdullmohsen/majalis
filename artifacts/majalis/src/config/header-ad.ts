/**
 * إعلان منتصف الهيدر — يستبدل وردمارك «المجلس العلمي» في كل الصفحات غير الغامرة.
 *
 * سياسة المحتوى (إلزامي قبل التفعيل):
 * - إعلانات ورعايات متوافقة مع هوية المجلس العلمي ومحتواه الشرعي التعليمي.
 * - لا إعلانات عشوائية، ولا سكربتات طرف ثالث (Google Ads وغيرها).
 * - لا محتوى يخالف الشريعة أو يسيء لسمعة المنصة.
 * - المراجعة البشرية مطلوبة قبل نشر أي راعٍ حقيقي.
 *
 * التعطيل: ضع `headerAd.enabled = false` لإخفاء الكبسولة دون إرجاع نص العلامة في الهيدر.
 */
export type HeaderAdConfig = {
  enabled: boolean;
  title: string;
  /** سطر ثانٍ عند عدم وجود راعٍ فعلي */
  subtitle: string;
  ctaLabel: string;
  /** رابط الضغط — مسار داخلي أو mailto (بلا popup) */
  ctaUrl: string;
};

export const headerAdConfig: HeaderAdConfig = {
  enabled: true,
  title: "مساحة إعلانية مميزة",
  subtitle: "أعلن هنا للمهتمين بالمحتوى الشرعي والتعليمي",
  ctaLabel: "احجز",
  /** صفحة الدعم والتواصل — آمن داخل التطبيق؛ البريد يبقى في نص الرسالة هناك */
  ctaUrl: "/support",
};

/** شكل مختصر كما في المواصفات */
export const headerAd = headerAdConfig;

/**
 * هل يُعرض إعلان الهيدر؟
 * نعم في كل المسارات التي تظهر فيها الترويسة العامة (NavBar يخفي نفسه في المسارات الغامرة).
 */
export function shouldShowHeaderAd(_pathname?: string): boolean {
  return headerAdConfig.enabled;
}
