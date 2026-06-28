import { REJECT_REASONS } from "./config.mjs";

const ARABIC_RE = /[\u0600-\u06FF]/;
const PLACEHOLDER_RE = /^(test|e2e|mock|placeholder|xxx|lorem)/i;

export function validateStructure(candidate) {
  const errors = [];
  if (!candidate?.question?.trim()) errors.push("missing_question");
  if (!ARABIC_RE.test(candidate.question || "")) errors.push("not_arabic");
  if (PLACEHOLDER_RE.test(candidate.question || "")) errors.push("placeholder");

  const opts = candidate.options;
  if (!Array.isArray(opts) || opts.length < 2) errors.push("invalid_options");
  if (opts?.length >= 2 && new Set(opts.map((o) => String(o).trim())).size < opts.length) {
    errors.push("duplicate_options");
  }

  const ci = candidate.correct_index;
  if (ci == null || ci < 0 || ci >= (opts?.length || 0)) errors.push("invalid_correct_index");
  if (!candidate.explanation?.trim()) errors.push("missing_explanation");
  if (!candidate.source_reference?.trim()) errors.push("missing_reference");
  if (!candidate.source_type?.trim()) errors.push("missing_source_type");

  if ((candidate.question?.length || 0) > 400) errors.push("too_long");
  if ((candidate.question?.length || 0) < 12) errors.push("too_short");

  return { ok: errors.length === 0, errors };
}

export function qualityFilter(candidate, verifyResult) {
  const reasons = [];

  if (!verifyResult?.reference_valid) reasons.push(REJECT_REASONS.MISSING_REFERENCE);
  if ((verifyResult?.confidence || 0) < 0.95) reasons.push(REJECT_REASONS.LOW_CONFIDENCE);

  const q = candidate.question || "";
  if (/(\?\?|؟؟|\.\.\.)/.test(q)) reasons.push(REJECT_REASONS.AMBIGUOUS);
  if (/(maybe|perhaps|ربما ي|قد ي)/i.test(q)) reasons.push(REJECT_REASONS.AMBIGUOUS);

  const trivialPatterns = [/كم عدد أركان/, /ما هو أول/];
  if (candidate.difficulty === "متقدم" && trivialPatterns.some((p) => p.test(q))) {
    reasons.push(REJECT_REASONS.QUALITY);
  }

  if (verifyResult?.issues?.length) {
    const critical = verifyResult.issues.filter((i) =>
      /incorrect|wrong|hallucin|ضعيف|خطأ|غير صحيح/i.test(String(i)),
    );
    if (critical.length) reasons.push(REJECT_REASONS.QUALITY);
  }

  return { ok: reasons.length === 0, reasons };
}

export function resolvePipelineStatus(confidence, autoPublishThreshold) {
  if (confidence >= autoPublishThreshold) {
    return { pipeline_status: "published", status: "published", review_status: "approved" };
  }
  if (confidence >= 0.95) {
    return { pipeline_status: "pending_review", status: "draft", review_status: "pending" };
  }
  return { pipeline_status: "ai_verified", status: "draft", review_status: "pending" };
}
