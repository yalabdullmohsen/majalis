/**
 * إعلان منتصف الهيدر — يستبدل وردمارك «المجلس العلمي» عند التفعيل.
 *
 * سياسة المحتوى (إلزامي قبل التفعيل):
 * - إعلانات ورعايات متوافقة مع هوية المجلس العلمي ومحتواه الشرعي التعليمي.
 * - لا إعلانات عشوائية، ولا سكربتات طرف ثالث (Google Ads وغيرها).
 * - لا محتوى يخالف الشريعة أو يسيء لسمعة المنصة.
 * - المراجعة البشرية مطلوبة قبل نشر أي راعٍ حقيقي.
 *
 * التعطيل: ضع `headerAd.enabled = false` ليعود شعار المجلس العلمي بلا فراغ.
 */
export type HeaderAdConfig = {
  enabled: boolean;
  title: string;
  /** سطر ثانٍ عند عدم وجود راعٍ فعلي */
  subtitle: string;
  ctaLabel: string;
  /** رابط الضغط — بريد أو صفحة تواصل داخلية (بلا popup) */
  ctaUrl: string;
};

export const headerAdConfig: HeaderAdConfig = {
  enabled: true,
  title: "مساحة إعلانية مميزة",
  subtitle: "أعلن هنا للمهتمين بالمحتوى الشرعي والتعليمي",
  ctaLabel: "احجز",
  ctaUrl:
    "mailto:Majlisilm.app@gmail.com?subject=" +
    encodeURIComponent("طلب إعلان — المجلس العلمي") +
    "&body=" +
    encodeURIComponent(
      "السلام عليكم،\nأرغب في الاستفسار عن مساحة إعلانية / رعاية في المجلس العلمي.\n\n",
    ),
};

/** شكل مختصر كما في المواصفات */
export const headerAd = headerAdConfig;

/** جذور الأقسام الرئيسية — إعلان الهيدر يبقى ثابتًا عند التنقل بينها */
export const HEADER_AD_SECTION_PATHS = [
  "/",
  "/sections",
  "/fiqh",
  "/prayer-times",
  "/lessons",
  "/quran-hub",
  "/quran-circles",
  "/competitions",
  "/more",
] as const;

/**
 * أين يُعرض إعلان الهيدر؟
 * الرئيسية + جذور الأقسام الرئيسية.
 * المصحف/القراءة/التفسير/التلاوة/تفاصيل الدرس → شعار المجلس العلمي.
 */
export function shouldShowHeaderAd(pathname: string): boolean {
  if (!headerAdConfig.enabled) return false;
  if (typeof navigator !== "undefined" && navigator.webdriver) return false;

  const p = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";
  return (HEADER_AD_SECTION_PATHS as readonly string[]).includes(p);
}
