/** Data Acquisition Engine — types and constants */

export const SOURCE_TYPES = [
  "rss", "web", "youtube_playlist", "telegram", "instagram", "pdf",
  "csv", "excel", "json", "google_drive", "official", "university", "journal", "mosque",
];

export const CONTENT_TYPES = [
  "lessons", "lectures", "quran_circles", "mutoon_circles", "courses",
  "scholars", "mosques", "books", "articles", "research", "benefits",
  "questions", "fatwas", "opportunities", "calendar", "announcements",
];

export const PIPELINE_STAGES = [
  "fetch", "parse", "extract", "normalize", "classify",
  "deduplicate", "validate", "score", "review_queue", "publish",
];

/** Auto-safe when source trust >= threshold and content type is low-risk */
export const AUTO_SAFE_CONTENT_TYPES = new Set([
  "lessons", "lectures", "quran_circles", "mutoon_circles", "courses",
  "calendar", "announcements",
]);

export const MANDATORY_REVIEW_TYPES = new Set([
  "fatwas", "questions", "research", "scholars", "books", "articles",
]);

export const AUTO_SAFE_TRUST_THRESHOLD = 85;

export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
