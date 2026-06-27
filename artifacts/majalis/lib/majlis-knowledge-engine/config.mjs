/**
 * Majlis Knowledge Engine — Autonomous Platform 1.0 configuration.
 * All content operations route through this engine.
 */

export const ENGINE_VERSION = "1.0.0";

/** Source types supported without code changes — mapped via adapters + DB config. */
export const SUPPORTED_SOURCE_TYPES = [
  "instagram", "x", "facebook", "telegram", "whatsapp",
  "youtube", "youtube_live", "youtube_community",
  "rss", "website", "wordpress", "drupal", "ghost", "blogger",
  "google_calendar", "ics", "pdf",
  "image", "png", "jpg", "jpeg", "webp", "manual",
  "mosque_announcement", "association_announcement", "university_announcement",
  "ministry_announcement", "scholar_website", "mosque_website",
];

export const PIPELINE_STAGES = [
  { id: "discover", label: "اكتشاف المحتوى" },
  { id: "fetch", label: "جلب البيانات" },
  { id: "vision", label: "تحليل الصور" },
  { id: "extract", label: "استخراج الحقول" },
  { id: "verify", label: "التحقق" },
  { id: "quality", label: "مراقبة الجودة" },
  { id: "dedup", label: "كشف التكرار" },
  { id: "decide", label: "قرار النشر" },
  { id: "publish", label: "النشر" },
  { id: "graph", label: "ربط Knowledge Graph" },
  { id: "index", label: "فهرسة البحث" },
  { id: "notify", label: "الإشعارات" },
  { id: "update", label: "تحديث التغييرات" },
  { id: "expire", label: "انتهاء الصلاحية" },
  { id: "audit", label: "التدقيق" },
];

export const DECISIONS = [
  "approved", "pending_review", "duplicate", "rejected", "archived", "expired",
];

export const AUTO_PUBLISH_MIN_CONFIDENCE = 0.95;
export const VISION_MIN_CONFIDENCE = 0.45;
export const OCR_MIN_CONFIDENCE = 0.35;

export const QUEUE_DEFAULTS = {
  maxRetries: 3,
  retryDelayMs: 5000,
  batchSize: 10,
  concurrency: 3,
};

export const PERFORMANCE = {
  fetchTimeoutMs: 20000,
  visionTimeoutMs: 45000,
  cronMaxSources: 25,
  cronMaxItemsPerSource: 15,
};
