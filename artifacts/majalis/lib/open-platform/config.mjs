/**
 * Open Islamic Platform — configuration, API versions, resource registry.
 */

export const API_VERSIONS = {
  v1: { label: "Stable", deprecated: false, sunset: null },
  v2: { label: "Enhanced", deprecated: false, sunset: null, features: ["enriched_metadata", "global_ref", "verification_status"] },
  v3: { label: "Beta", deprecated: false, sunset: null, features: ["relations", "webhooks", "semantic_search", "field_selection"] },
};

export const DEFAULT_VERSION = "v1";
export const SUPPORTED_VERSIONS = ["v1", "v2", "v3"];

export const OPEN_RESOURCES = {
  quran: { table: null, kind: "quran", label: "القرآن", label_en: "Quran", source: "knowledge_engine" },
  hadith: { table: null, kind: "hadith", label: "الأحاديث", label_en: "Hadith", source: "knowledge_engine" },
  adhkar: { table: null, kind: "adhkar", label: "الأذكار", label_en: "Adhkar", source: "seed" },
  dua: { table: null, kind: "dua", label: "الأدعية", label_en: "Duas", source: "seed" },
  fawaid: { table: "fawaid", kind: "fawaid", label: "الفوائد", label_en: "Benefits", titleField: "text", authorField: "author_name" },
  book: { table: "library_items", kind: "book", label: "الكتب", label_en: "Books", filter: { category: "book" }, titleField: "title" },
  author: { table: "library_items", kind: "author", label: "المؤلفون", label_en: "Authors", filter: { category: "author" }, titleField: "title" },
  sheikh: { table: "sheikhs", kind: "sheikh", label: "المشايخ", label_en: "Scholars", titleField: "name", summaryField: "bio" },
  lesson: { table: "lessons", kind: "lesson", label: "الدروس", label_en: "Lessons", titleField: "title", filter: { activity_type: "درس" } },
  lecture: { table: "lessons", kind: "lecture", label: "المحاضرات", label_en: "Lectures", titleField: "title", filter: { activity_type: "محاضرة" } },
  course: { table: "lessons", kind: "course", label: "الدورات", label_en: "Courses", titleField: "title", filter: { is_course: true } },
  fatwa: { table: "fatwas", kind: "fatwa", label: "الفتاوى", label_en: "Fatwas", titleField: "question", bodyField: "answer" },
  fiqh_decision: { table: "fiqh_council_items", kind: "fiqh_decision", label: "قرارات المجامع الفقهية", label_en: "Fiqh Council Decisions", titleField: "title", bodyField: "content" },
  article: { table: "library_items", kind: "article", label: "المقالات", label_en: "Articles", filter: { category: "article" }, titleField: "title" },
  miracle: { table: "scientific_miracles", kind: "miracle", label: "الإعجاز العلمي", label_en: "Scientific Miracles", titleField: "title", bodyField: "body" },
  occasion: { table: "islamic_occasions_cache", kind: "occasion", label: "المناسبات الإسلامية", label_en: "Islamic Occasions", titleField: "title" },
  calendar: { table: "islamic_occasions_cache", kind: "calendar", label: "التقويم الإسلامي", label_en: "Islamic Calendar", titleField: "title" },
  qa: { table: "qa_questions", kind: "qa", label: "الأسئلة", label_en: "Q&A", titleField: "question", bodyField: "answer" },
  ruling: { table: "sharia_rulings", kind: "ruling", label: "الأحكام الشرعية", label_en: "Sharia Rulings", titleField: "title", bodyField: "body" },
  update: { table: "platform_updates", kind: "update", label: "التحديثات", label_en: "Updates", titleField: "title", bodyField: "body" },
  prayer_times: { table: "prayer_times", kind: "prayer_times", label: "مواقيت الصلاة", label_en: "Prayer Times", source: "prayer_times_core" },
  knowledge: { table: "auto_imported_content", kind: "knowledge", label: "المعرفة", label_en: "Knowledge", titleField: "ai_title" },
};

export const RESOURCE_IDS = Object.keys(OPEN_RESOURCES);

export const API_SCOPES = {
  read: { label: "قراءة", resources: RESOURCE_IDS },
  search: { label: "بحث", resources: ["*"] },
  webhooks: { label: "Webhooks", resources: ["webhooks"] },
  relations: { label: "علاقات", resources: ["relations", "topics"] },
  admin: { label: "إدارة", resources: ["*"] },
};

export const WEBHOOK_EVENTS = [
  "content.created",
  "content.updated",
  "content.deleted",
  "course.completed",
  "fatwa.published",
  "fiqh_decision.published",
  "lesson.published",
  "source.updated",
];

export const RATE_LIMITS = {
  free: { requests_per_minute: 60, requests_per_day: 5000 },
  standard: { requests_per_minute: 120, requests_per_day: 25000 },
  partner: { requests_per_minute: 300, requests_per_day: 100000 },
};

export const ERROR_CODES = {
  UNAUTHORIZED: { status: 401, message: "Invalid or missing API key" },
  FORBIDDEN: { status: 403, message: "Insufficient scope for this resource" },
  NOT_FOUND: { status: 404, message: "Resource or item not found" },
  RATE_LIMITED: { status: 429, message: "Rate limit exceeded" },
  BAD_REQUEST: { status: 400, message: "Invalid request parameters" },
  VERSION_DEPRECATED: { status: 410, message: "API version deprecated" },
  INTERNAL: { status: 500, message: "Internal server error" },
};

export const CACHE_TTL = {
  search: 60_000,
  list: 120_000,
  item: 300_000,
  static: 600_000,
};
