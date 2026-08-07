/**
 * إعداد مصادر المصحف (مرحلة ١ — الطبقات الثلاث).
 * تبديل المصدر = تغيير هذا الملف فقط؛ لا تُخترع بيانات بلا مصدر موثَّق.
 */

export type MushafFeatureFlags = {
  /** صور صفحات مصحف المدينة (604) — غير موجودة محليًا بعد */
  pageImages: boolean;
  /** مضلعات/إحداثيات رسمية فوق صور المدينة — غير متوفرة؛ نستخدم مستطيلات مشتقّة من أسطر QPC */
  imagePolygons: boolean;
  /** توقيتات تلاوة (بداية/نهاية آية بالملي ثانية داخل ملف واحد) */
  ayahTimingsMs: boolean;
  /** حزم تفاسير محلية كاملة */
  offlineTafsirPacks: boolean;
  /** نص إملائي مجرّد مضمّن كطبعة منفصلة */
  imlaeiEditionLocal: boolean;
  /** طبقة تفاعل بالإحداثيات النسبية (مرحلة ١) */
  ayahHitLayer: boolean;
  /** طبقة نص مخفية للبحث/النسخ/قارئ الشاشة */
  ayahTextLayer: boolean;
};

/** أعلام الميزات — عطّل ما لا مصدر موثوق له */
export const MUSHAF_FEATURES: MushafFeatureFlags = {
  pageImages: false,
  imagePolygons: false,
  ayahTimingsMs: false,
  offlineTafsirPacks: false,
  imlaeiEditionLocal: false,
  ayahHitLayer: true,
  ayahTextLayer: true,
};

export type MushafSourceId =
  | "visual-qpc-v2"
  | "visual-page-images"
  | "coords-qpc-lines"
  | "coords-image-polygons"
  | "text-quran-v2"
  | "text-uthmani-surahs";

export type MushafSourceAdapter = {
  id: MushafSourceId;
  titleAr: string;
  /** مسار البيانات أو الوصف */
  path: string;
  licenseAr: string;
  enabled: boolean;
};

/**
 * سجل المصادر — الواجهة الموحّدة لتبديل الخلفية لاحقًا.
 * visual النشط الآن: خطوط QPC V2 (ليس صور المدينة).
 */
export const MUSHAF_SOURCES: readonly MushafSourceAdapter[] = [
  {
    id: "visual-qpc-v2",
    titleAr: "عرض بصري — خط QPC V2 لكل صفحة",
    path: "public/fonts/qpc-v2/p{n}.woff2 + public/data/quran-v2/pages/",
    licenseAr: "بيانات عبر api.qurancdn.com (منظومة QUL/Quran.com) — انظر docs/mushaf-phase1-ayah-layers.md",
    enabled: true,
  },
  {
    id: "visual-page-images",
    titleAr: "صور مصحف المدينة 604",
    path: "(غير مضمّنة محليًا)",
    licenseAr: "KFGQPC — معطّل حتى التوريد المرخَّص",
    enabled: MUSHAF_FEATURES.pageImages,
  },
  {
    id: "coords-qpc-lines",
    titleAr: "إحداثيات نسبية مشتقّة من أسطر QPC (line_number + position)",
    path: "public/data/quran-v2/pages/page-*.json",
    licenseAr: "نفس مصدر quran-v2 — ليست مضلعات صور المدينة الرسمية",
    enabled: MUSHAF_FEATURES.ayahHitLayer && !MUSHAF_FEATURES.imagePolygons,
  },
  {
    id: "coords-image-polygons",
    titleAr: "مضلعات فوق صور المدينة",
    path: "(غير متوفرة)",
    licenseAr: "—",
    enabled: MUSHAF_FEATURES.imagePolygons,
  },
  {
    id: "text-quran-v2",
    titleAr: "نص الكلمات/الآيات من quran-v2",
    path: "public/data/quran-v2/pages/",
    licenseAr: "api.qurancdn.com / QUL — انظر التوثيق",
    enabled: true,
  },
  {
    id: "text-uthmani-surahs",
    titleAr: "نص عثماني كامل (سور)",
    path: "public/data/quran/surah-*.json",
    licenseAr: "Tanzil عبر AlQuran Cloud — docs/quran-data-source.md",
    enabled: true,
  },
] as const;

export const MUSHAF_PAGE_LINE_SLOTS = 15;
export const AYAH_PRESS_DELAY_MS = 320;
