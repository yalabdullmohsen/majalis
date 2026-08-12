/**
 * Content Production — configuration, quotas, pipeline registry.
 */

export const PIPELINES = {
  questions: {
    id: "questions",
    labelAr: "الأسئلة",
    dailyQuota: 150,
    weeklyQuota: null,
    targetTable: "platform_quiz_questions",
    requiredFields: ["question", "options", "correct_index", "category", "source_name"],
  },
  fawaid: {
    id: "fawaid",
    labelAr: "الفوائد",
    dailyQuota: 300,
    weeklyQuota: null,
    targetTable: "fawaid",
    requiredFields: ["text", "source_name"],
  },
  hadith: {
    id: "hadith",
    labelAr: "الأحاديث",
    dailyQuota: 150,
    weeklyQuota: null,
    targetTable: "verified_hadith_items",
    requiredFields: ["text", "source_name", "source_url"],
  },
  rulings: {
    id: "rulings",
    labelAr: "الأحكام",
    dailyQuota: 50,
    weeklyQuota: null,
    targetTable: "sharia_rulings",
    requiredFields: ["title", "body", "category", "source_origin"],
  },
  stories: {
    id: "stories",
    labelAr: "القصص",
    dailyQuota: null,
    weeklyQuota: 20,
    targetTable: "surah_stories",
    requiredFields: ["title", "body", "source_name"],
  },
  articles: {
    id: "articles",
    labelAr: "المقالات",
    dailyQuota: null,
    weeklyQuota: 10,
    targetTable: "auto_imported_content",
    requiredFields: ["title", "body", "source_url"],
  },
};

export const SCHEDULER_JOBS = {
  "source-check": {
    id: "source-check",
    labelAr: "فحص المصادر",
    interval: "hourly",
    pipelines: ["all"],
  },
  "content-update": {
    id: "content-update",
    labelAr: "تحديث المحتوى",
    interval: "2h",
    pipelines: ["all"],
  },
  reindex: {
    id: "reindex",
    labelAr: "إعادة الفهرسة",
    interval: "6h",
    pipelines: [],
  },
  "daily-production": {
    id: "daily-production",
    labelAr: "إنتاج محتوى جديد",
    interval: "daily",
    pipelines: ["questions", "fawaid", "hadith", "rulings"],
  },
  "quality-review": {
    id: "quality-review",
    labelAr: "مراجعة الجودة",
    interval: "weekly",
    pipelines: ["all"],
  },
  cleanup: {
    id: "cleanup",
    labelAr: "تنظيف البيانات",
    interval: "monthly",
    pipelines: [],
  },
};

export const VALIDATION_STAGES = [
  "source",
  "metadata",
  "duplicate",
  "quality",
  "language",
  "formatting",
];

export const DEDUP_CONFIG = {
  hashAlgorithm: "sha256",
  similarityThreshold: 0.88,
  titleSimilarityThreshold: 0.92,
};

export const MONITORING_CONFIG = {
  maxRetries: 3,
  retryBackoffMs: [60_000, 300_000, 900_000],
  logRetentionDays: 90,
  dlqRetentionDays: 30,
  alertOnFailureCount: 3,
};

export const PRODUCTION_FLOW = [
  "Source",
  "Validation",
  "Deduplication",
  "Classification",
  "Quality Check",
  "Publishing",
  "Indexing",
  "Search",
  "Statistics",
];

export function getPipelineQuota(pipelineId, period = "daily") {
  const p = PIPELINES[pipelineId];
  if (!p) return 0;
  return period === "weekly" ? (p.weeklyQuota ?? 0) : (p.dailyQuota ?? 0);
}

export function listPipelineIds() {
  return Object.keys(PIPELINES);
}
