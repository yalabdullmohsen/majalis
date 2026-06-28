/**
 * Blocks test/mock/placeholder/e2e content from entering production tables.
 */

const BLOCKED_PATTERNS = [
  /\b(?:e2e|mock|placeholder|dummy|fixture|debug|sample|verification)\b/i,
  /\[import-\d+\]\s*$/i,
  /\[verify-/i,
  /^test[-_\s]/i,
  /\btest data\b/i,
];

const BLOCKED_SLUGS = new Set([
  "verify-production-lesson",
  "test-lesson",
  "demo-lesson",
  "e2e-lesson",
]);

/**
 * @param {string} text
 */
export function containsBlockedContentMarker(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  return BLOCKED_PATTERNS.some((re) => re.test(t));
}

/**
 * @param {Record<string, unknown>} record
 * @param {string[]} fields
 */
export function sanitizeProductionRecord(record, fields = ["title", "text", "question", "answer", "description", "name"]) {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" && containsBlockedContentMarker(value)) {
      return { ok: false, reason: `blocked_marker_in_${field}`, field, value: value.slice(0, 120) };
    }
  }
  const slug = String(record.slug || record.external_key || record.external_id || "").trim();
  if (slug && BLOCKED_SLUGS.has(slug.toLowerCase())) {
    return { ok: false, reason: "blocked_slug", slug };
  }
  return { ok: true };
}

/**
 * @param {Record<string, unknown>} record
 */
export function assertPublishable(record) {
  const check = sanitizeProductionRecord(record);
  if (!check.ok) {
    const err = new Error(`Production content blocked: ${check.reason}`);
    err.code = "CONTENT_BLOCKED";
    err.details = check;
    throw err;
  }
  return record;
}
