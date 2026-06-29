import {
  AUTO_SAFE_CONTENT_TYPES,
  MANDATORY_REVIEW_TYPES,
  AUTO_SAFE_TRUST_THRESHOLD,
} from "./types.mjs";

export function scoreQuality(source, item) {
  let score = 0;
  if (item.title) score += 15;
  if (item.description && item.description.length > 30) score += 15;
  if (item.original_url) score += 10;
  if (item.scholar_name || item.author_name) score += 10;
  if (item.event_date) score += 10;
  if (item.location || item.mosque_name) score += 10;
  if (item.content_type) score += 10;
  if (source.trust_score >= 85) score += 10;
  if (item.keywords?.length) score += 5;
  if (!item.needs_field_review?.length) score += 5;
  return Math.min(score, 100);
}

export function validateItem(source, item) {
  const errors = [];
  const reviewReasons = [...(item.needs_field_review || [])];

  if (!item.title?.trim()) errors.push("missing_title");
  if (!item.original_url) errors.push("missing_url");
  if (!item.content_type) errors.push("missing_content_type");

  if (MANDATORY_REVIEW_TYPES.has(item.content_type)) {
    reviewReasons.push("mandatory_review_type");
  }
  if (source.requires_human_review) reviewReasons.push("source_requires_review");
  if (source.trust_score < 70) reviewReasons.push("low_trust_source");
  if (item.conflict_flags?.length) reviewReasons.push("conflict_detected");

  const quality = scoreQuality(source, item);
  const canAutoPublish = canAutoPublishItem(source, item, quality, errors, reviewReasons);

  return {
    ok: errors.length === 0,
    errors,
    reviewReasons: [...new Set(reviewReasons)],
    quality_score: quality,
    canAutoPublish,
    needs_review: !canAutoPublish || reviewReasons.length > 0,
  };
}

export function canAutoPublishItem(source, item, quality, errors = [], reviewReasons = []) {
  if (errors.length) return false;
  if (MANDATORY_REVIEW_TYPES.has(item.content_type)) return false;
  if (source.publish_policy === "review" || source.publish_policy === "blocked") return false;
  if (source.trust_score < AUTO_SAFE_TRUST_THRESHOLD) return false;
  if (!AUTO_SAFE_CONTENT_TYPES.has(item.content_type)) return false;
  if (reviewReasons.some((r) => r.startsWith("missing_"))) return false;
  return quality >= 75;
}
