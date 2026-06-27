/**
 * Trusted Knowledge Network — Phase 5 configuration defaults.
 * Runtime quotas load from tkn_platform_settings (DB), not hardcoded here.
 */

export const TKN_VERSION = "5.0.0";

export const DEFAULT_DAILY_QUOTAS = {
  benefits: 300,
  questions: 150,
  hadith: 150,
  rulings: 50,
  stories: 20,
  articles: 10,
};

export const DEFAULT_WEEKLY_QUOTAS = {
  articles: 10,
};

/** Supported source connector types — add new types via connector registry only. */
export const SUPPORTED_SOURCE_TYPES = [
  "rss",
  "json",
  "xml",
  "rest",
  "csv",
  "markdown",
  "html",
  "database",
];

export const SOURCE_TYPE_LABELS = {
  rss: "RSS Feed",
  json: "JSON Feed",
  xml: "XML Feed",
  rest: "REST API",
  csv: "CSV File",
  markdown: "Markdown",
  html: "HTML Parser",
  database: "Local Database",
};

/** Full content pipeline stages (Phase 5). */
export const PIPELINE_STAGES = [
  { id: "fetch", label: "جلب" },
  { id: "normalize", label: "تطبيع" },
  { id: "validate", label: "تحقق" },
  { id: "scientific_verification", label: "تحقق علمي" },
  { id: "deduplication", label: "منع التكرار" },
  { id: "classification", label: "تصنيف" },
  { id: "keyword_extraction", label: "استخراج كلمات" },
  { id: "quality_score", label: "درجة الجودة" },
  { id: "publish", label: "نشر" },
  { id: "search_index", label: "فهرسة البحث" },
];

/** Cron schedules for TKN background jobs (vercel.json). */
export const TKN_CRON_SCHEDULES = {
  "tkn-retry-queue": "*/10 * * * *",
  "tkn-health": "0 */6 * * *",
  "tkn-fetch": "15 * * * *",
};

export const RELATED_SEARCH_SECTIONS = {
  quran: { label: "الآيات", kinds: ["quran"] },
  hadith: { label: "الأحاديث", kinds: ["hadith"] },
  rulings: { label: "الأحكام", kinds: ["ruling", "rulings", "fatwa", "fatwas", "fiqh_decision"] },
  fawaid: { label: "الفوائد", kinds: ["fawaid", "benefit", "benefits"] },
  lessons: { label: "الدروس", kinds: ["lesson", "lessons"] },
  library: { label: "الكتب", kinds: ["library", "book"] },
  stories: { label: "القصص", kinds: ["story", "stories", "akp_stories"] },
  qa: { label: "الأسئلة", kinds: ["qa", "questions"] },
  adhkar: { label: "الأذكار", kinds: ["adhkar"] },
};
