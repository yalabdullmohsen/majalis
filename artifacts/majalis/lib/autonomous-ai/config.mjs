/**
 * Autonomous AI Platform — configuration and pipeline stage definitions.
 */

export const PIPELINE_STAGES = [
  { id: "discover", label: "اكتشاف محتوى جديد", order: 1 },
  { id: "fetch", label: "جلب المحتوى", order: 2 },
  { id: "clean", label: "تنظيف البيانات", order: 3 },
  { id: "dedup", label: "إزالة التكرار", order: 4 },
  { id: "verify_source", label: "التحقق من المصدر", order: 5 },
  { id: "classify", label: "تصنيف المحتوى", order: 6 },
  { id: "keywords", label: "استخراج الكلمات المفتاحية", order: 7 },
  { id: "summarize", label: "إنشاء ملخص", order: 8 },
  { id: "relate", label: "ربط المحتوى المشابه", order: 9 },
  { id: "seo", label: "إنشاء بيانات SEO", order: 10 },
  { id: "store", label: "حفظ المحتوى", order: 11 },
  { id: "publish", label: "نشر المحتوى", order: 12 },
  { id: "index", label: "تحديث الفهرس", order: 13 },
  { id: "audit", label: "تسجيل العمليات", order: 14 },
];

export const AI_CONSTRAINTS = {
  allowGenerateReligiousText: false,
  allowGenerateFatwa: false,
  allowGenerateHadith: false,
  allowGenerateAyah: false,
  metadataOnly: true,
  requireSourceUrl: true,
  minTrustScore: 60,
  minQualityScore: 70,
  minCompleteness: 75,
};

export const DAILY_CONTENT_TYPES = [
  "hadith",
  "ayah",
  "dhikr",
  "dua",
  "faida",
  "question",
  "book_week",
  "scholar_week",
  "lesson_week",
];

export const CRON_SCHEDULE = {
  orchestrator: "0 */6 * * *",
  queueWorker: "0 * * * *",
  dailyContent: "0 5 * * *",
  securityAudit: "0 2 * * 0",
  reports: "0 6 * * *",
};

export const PERFORMANCE = {
  maxItemsPerRun: 25,
  maxDurationMs: 55_000,
  cacheTtlMs: 300_000,
  retryBackoffMs: [4_000, 16_000, 64_000],
};

export function getStageById(id) {
  return PIPELINE_STAGES.find((s) => s.id === id);
}
