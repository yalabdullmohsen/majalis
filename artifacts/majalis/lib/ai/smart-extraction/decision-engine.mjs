/**
 * Decision Engine — determines if AI should be invoked.
 */
import { DECISION_THRESHOLDS } from "./field-definitions.mjs";
import { detectImageComplexity } from "./image-preprocessing.mjs";

export function shouldInvokeAi({
  ruleResult,
  confidence,
  ocrOk,
  ocrTextLength = 0,
  lineCount = 0,
  urlCount = 0,
  forceAi = false,
}) {
  if (forceAi) {
    return { invoke: true, reason: "forced", skipAi: false };
  }

  const completeness = ruleResult?.completeness ?? 0;
  const overall = confidence?.overall ?? 0;

  if (completeness >= DECISION_THRESHOLDS.rule_skip_ai_completeness && overall >= DECISION_THRESHOLDS.quick_review) {
    return { invoke: false, reason: "rules_sufficient", skipAi: true, savings: "rules_only" };
  }

  if (completeness >= 0.8 && overall >= DECISION_THRESHOLDS.auto_publish) {
    return { invoke: false, reason: "high_confidence_complete", skipAi: true, savings: "rules_only" };
  }

  if (!ocrOk || ocrTextLength < 20) {
    return { invoke: true, reason: "ocr_failed_or_empty", skipAi: false };
  }

  if (overall < DECISION_THRESHOLDS.ai_required) {
    return { invoke: true, reason: "low_confidence", skipAi: false };
  }

  const complexity = detectImageComplexity({ textLength: ocrTextLength, lineCount, urlCount });
  if (complexity.complex && overall < DECISION_THRESHOLDS.auto_publish) {
    return { invoke: true, reason: "complex_layout", skipAi: false };
  }

  const missingCritical = !ruleResult?.fields?.title || !ruleResult?.fields?.speaker_name;
  if (missingCritical && overall < DECISION_THRESHOLDS.quick_review) {
    return { invoke: true, reason: "missing_critical_fields", skipAi: false };
  }

  return { invoke: false, reason: "confidence_acceptable", skipAi: true, savings: "no_ai_needed" };
}

export function estimateAiSavingsPercent(stats = {}) {
  const total = stats.totalImages || 0;
  if (!total) return 0;
  const noAi = stats.noAiCount || 0;
  return Math.round((noAi / total) * 100);
}
