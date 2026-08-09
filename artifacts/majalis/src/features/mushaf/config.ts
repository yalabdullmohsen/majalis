/**
 * إعداد مصادر المصحف (مراحل ١–٢).
 * تبديل المصدر = تغيير هذا الملف فقط؛ لا تُخترع بيانات بلا مصدر موثَّق.
 * العرض البصري ثابت على QPC V2 — لا مسار صور مدينة / مضلعات صور.
 */

export type MushafFeatureFlags = {
  /** توقيتات تلاوة (بداية/نهاية آية بالملي ثانية داخل ملف واحد) */
  ayahTimingsMs: boolean;
  /** حزم تفاسير محلية كاملة (مرحلة ٢ تستخدم جلبًا كسولًا حيًا + كاش) */
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
  ayahTimingsMs: false,
  /** حزمة الميسّر في IndexedDB + جلب مسبق للصفحة ±1 */
  offlineTafsirPacks: true,
  imlaeiEditionLocal: false,
  ayahHitLayer: true,
  ayahTextLayer: true,
};

export type MushafSourceId =
  | "visual-qpc-v2"
  | "coords-qpc-lines"
  | "text-quran-v2"
  | "text-uthmani-surahs"
  | "tafsir-qurancom"
  | "translation-alquran";

export type MushafSourceAdapter = {
  id: MushafSourceId;
  titleAr: string;
  /** مسار البيانات أو الوصف */
  path: string;
  licenseAr: string;
  enabled: boolean;
};

/**
 * سجل المصادر — الواجهة الموحّدة لتبديل الخلفية/المحتوى لاحقًا.
 * visual النشط: خطوط QPC V2 فقط.
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
    id: "coords-qpc-lines",
    titleAr: "إحداثيات نسبية مشتقّة من أسطر QPC (line_number + position)",
    path: "public/data/quran-v2/pages/page-*.json",
    licenseAr: "نفس مصدر quran-v2 — ليست مضلعات صور المدينة الرسمية",
    enabled: MUSHAF_FEATURES.ayahHitLayer,
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
  {
    id: "tafsir-qurancom",
    titleAr: "تفاسير الآية (كسول) — Quran.com API v4",
    path: "https://api.quran.com/api/v4/tafsirs/{slug}/by_ayah/{s}:{a}",
    licenseAr: "نصوص عبر Quran.com / QUL — انظر docs/mushaf-phase2-tafsir-translation.md",
    enabled: true,
  },
  {
    id: "translation-alquran",
    titleAr: "ترجمات الآية (اختيارية، كسولة) — AlQuran Cloud",
    path: "https://api.alquran.cloud/v1/ayah/{s}:{a}/{edition}",
    licenseAr: "طبعات الترجمة عبر AlQuran Cloud — انظر توثيق المرحلة ٢",
    enabled: true,
  },
] as const;

export const MUSHAF_PAGE_LINE_SLOTS = 15;
export const AYAH_PRESS_DELAY_MS = 320;
