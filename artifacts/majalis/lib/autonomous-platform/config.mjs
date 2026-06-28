/**
 * Autonomous Knowledge Platform — Phase 2 configuration.
 */

export const PLATFORM_VERSION = "2.0.0";

/** Daily production quotas per content type. */
export const DAILY_QUOTAS = {
  benefits: 300,
  questions: 150,
  hadith: 150,
  rulings: 50,
  stories: 20,
  articles: 10, // weekly quota enforced separately
};

export const WEEKLY_QUOTAS = {
  articles: 10,
};

/** Independent pipeline definitions. */
export const CONTENT_PIPELINES = {
  benefits: {
    id: "benefits",
    label: "الفوائد",
    targetTable: "fawaid",
    importType: "benefits",
    quotaPeriod: "daily",
    quota: DAILY_QUOTAS.benefits,
    requiredFields: ["text"],
    cronMode: "benefits",
  },
  questions: {
    id: "questions",
    label: "الأسئلة",
    targetTable: "qa_questions",
    importType: "questions",
    quotaPeriod: "daily",
    quota: DAILY_QUOTAS.questions,
    requiredFields: ["question", "answer"],
    cronMode: "questions",
  },
  hadith: {
    id: "hadith",
    label: "الأحاديث",
    targetTable: "verified_hadith_items",
    importType: "hadith",
    quotaPeriod: "daily",
    quota: DAILY_QUOTAS.hadith,
    requiredFields: ["text", "source_name"],
    cronMode: "hadith",
  },
  rulings: {
    id: "rulings",
    label: "الأحكام",
    targetTable: "sharia_rulings",
    importType: "rulings",
    quotaPeriod: "daily",
    quota: DAILY_QUOTAS.rulings,
    requiredFields: ["title", "body"],
    cronMode: "rulings",
  },
  stories: {
    id: "stories",
    label: "القصص",
    targetTable: "akp_stories",
    importType: "stories",
    quotaPeriod: "daily",
    quota: DAILY_QUOTAS.stories,
    requiredFields: ["title", "body"],
    cronMode: "stories",
  },
  articles: {
    id: "articles",
    label: "المقالات",
    targetTable: "library_items",
    importType: "articles",
    quotaPeriod: "weekly",
    quota: WEEKLY_QUOTAS.articles,
    requiredFields: ["title", "content"],
    cronMode: "articles",
  },
};

/** Cron schedule definitions (mirrors vercel.json). */
export const CRON_SCHEDULES = {
  fetch: { schedule: "0 * * * *", mode: "fetch", label: "جلب المصادر" },
  validate: { schedule: "0 */2 * * *", mode: "validate", label: "التحقق" },
  questions: { schedule: "0 */3 * * *", mode: "questions", label: "الأسئلة" },
  benefits: { schedule: "0 */6 * * *", mode: "benefits", label: "الفوائد" },
  reindex: { schedule: "0 2 * * *", mode: "reindex", label: "إعادة الفهرسة" },
  audit: { schedule: "0 4 * * 0", mode: "audit", label: "تدقيق الجودة" },
  cleanup: { schedule: "0 3 1 * *", mode: "cleanup", label: "تنظيف عميق" },
  monitor: { schedule: "* * * * *", mode: "monitor", label: "مراقبة الصحة" },
  recovery: { schedule: "*/5 * * * *", mode: "recovery", label: "التعافي الذاتي" },
};

export const DEDUP_DEFAULTS = {
  hash: true,
  title_match: true,
  source_match: true,
  semantic_threshold: 0.85,
};

export const SIMILARITY_TOKEN_THRESHOLD = 0.72;

export const QUEUE_DEFAULTS = {
  maxRetries: 3,
  retryDelayMs: 5000,
  batchSize: 25,
};
