/**
 * Unified confidence scoring for auto-publish decisions.
 * Thresholds: ≥95 publish | 90-94 fast review | 70-89 manual | <70 reject
 */

const THRESHOLDS = {
  publish: 95,
  fastReview: 90,
  manualReview: 70,
};

const SOURCE_TRUST = {
  official_manifest: 12,
  instagram_graph: 10,
  telegram_bot: 9,
  rss: 8,
  website: 7,
  og_preview: 4,
  manual_assist: 6,
};

/**
 * @param {object} input
 */
export function computeConfidenceScore(input = {}) {
  let score = Number(input.baseScore ?? input.ai_confidence ?? 50);
  const signals = [];

  const source = String(input.sourceType || input.connectorType || "").toLowerCase();
  if (SOURCE_TRUST[source]) {
    score += SOURCE_TRUST[source];
    signals.push(`source:${source}`);
  }

  if (input.dateMatch) { score += 8; signals.push("date_match"); }
  if (input.sheikhMatch) { score += 10; signals.push("sheikh_match"); }
  if (input.mosqueMatch) { score += 6; signals.push("mosque_match"); }
  if (input.cityMatch) { score += 5; signals.push("city_match"); }
  if (input.urlMatch) { score += 7; signals.push("url_match"); }
  if (input.logoMatch) { score += 4; signals.push("logo_match"); }
  if (input.ocrConfidence >= 0.7) { score += 6; signals.push("ocr"); }
  if (input.visionConfidence >= 0.7) { score += 6; signals.push("vision"); }
  if (input.metadataComplete) { score += 5; signals.push("metadata"); }
  if (input.multiSourceAgreement) { score += 12; signals.push("fusion"); }

  if (input.hasConflict) score -= 15;
  if (input.missingRequiredFields?.length) score -= input.missingRequiredFields.length * 8;
  if (input.quizLike) score = 0;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let action = "reject";
  if (score >= THRESHOLDS.publish) action = "publish";
  else if (score >= THRESHOLDS.fastReview) action = "fast_review";
  else if (score >= THRESHOLDS.manualReview) action = "manual_review";

  return { score, action, signals, thresholds: THRESHOLDS };
}

export { THRESHOLDS };
