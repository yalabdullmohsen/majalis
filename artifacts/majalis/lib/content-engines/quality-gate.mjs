/**
 * Content Engines — quality gate (production-safe thresholds).
 */

import { mapCategory } from "./pipeline.mjs";
import { isQuizLikeFawaidText } from "../content-import/fawaid-quality.mjs";

const MIN_QUALITY = 60;
const MIN_CONFIDENCE = 50;

export function runEngineQualityGate(item, enrichment = {}) {
  const checks = {
    has_source: Boolean(item.source_url || item.source_name),
    has_title: Boolean(item.title?.trim()?.length >= 3),
    has_body: Boolean(item.body?.trim()?.length >= 20),
    has_category: Boolean(mapCategory(item.category || enrichment.category)),
    quality_score: (enrichment.quality_score ?? enrichment.confidence ?? 70) >= MIN_QUALITY,
    ai_confidence: (enrichment.confidence ?? 70) >= MIN_CONFIDENCE,
    no_review_flag: !enrichment.needs_human_review,
    not_disputed: !enrichment.disputed,
  };

  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  const passed = failed.length === 0;

  let reviewReason = null;
  if (!checks.has_source) reviewReason = "missing_source";
  else if (!checks.has_body && !checks.has_title) reviewReason = "weak_extraction";
  else if (!checks.has_category) reviewReason = "unclear_category";
  else if (!checks.quality_score || !checks.ai_confidence) reviewReason = "low_quality";
  else if (!checks.no_review_flag) reviewReason = "needs_manual_approval";

  return {
    passed,
    checks,
    failedChecks: failed,
    canPublish: passed,
    reviewReason,
    quality_score: enrichment.quality_score ?? enrichment.confidence ?? 70,
  };
}

export function scoreBenefit(text) {
  const t = String(text || "").trim();
  if (t.length < 15) return 0;
  if (isQuizLikeFawaidText(t)) return 0;
  if (t.length > 400) return 40;
  const vague = /^(من المهم|يجب|لا بد|ينبغي)$/i.test(t);
  if (vague) return 30;
  let score = 70;
  if (t.length >= 30 && t.length <= 200) score += 15;
  if (/[\u0600-\u06FF]/.test(t)) score += 5;
  return Math.min(100, score);
}

export function scoreQuizQuestion(q) {
  if (!q?.question || !Array.isArray(q?.options) || q.options.length < 2) return 0;
  if (q.options.some((o) => !String(o).trim())) return 20;
  if (q.correct_index < 0 || q.correct_index >= q.options.length) return 10;
  let score = 75;
  if (q.question.length >= 20) score += 10;
  if (q.difficulty) score += 5;
  return Math.min(100, score);
}
