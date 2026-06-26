/**
 * Verification gate — 90% confidence rule for auto-publish.
 */

import { runReviewGate } from "../scholarly-verification/review-gate.mjs";
import {
  MIN_CONFIDENCE_TO_AUTO_PUBLISH,
  MIN_TRUST_TO_AUTO_PUBLISH,
  MIN_QUALITY_TO_AUTO_PUBLISH,
  MIN_COMPLETENESS_TO_AUTO_PUBLISH,
  VERIFICATION_STATUS,
} from "./constants.mjs";

export function computeConfidenceScore(gateResult) {
  const trust = gateResult.trust_level ?? 0;
  const quality = gateResult.quality_score ?? 0;
  const completeness = gateResult.completeness_score ?? 0;
  const linkBonus = gateResult.checks?.find((c) => c.name === "source_link")?.passed ? 5 : 0;
  const provenanceBonus = gateResult.checks?.find((c) => c.name === "provenance")?.passed ? 5 : 0;
  return Math.min(100, Math.round((trust + quality + completeness) / 3 + linkBonus + provenanceBonus));
}

export async function runVerifiedKnowledgeGate(item, context = {}) {
  const gate = await runReviewGate(item, {
    ...context,
    defaults: {
      trust_level: context.defaults?.trust_level ?? MIN_TRUST_TO_AUTO_PUBLISH,
      source_type: context.defaults?.source_type ?? "official",
      ...context.defaults,
    },
  });

  const confidence = computeConfidenceScore(gate);
  const canAutoPublish =
    gate.errors.length === 0 &&
    !gate.checks?.find((c) => c.name === "duplicate" && !c.passed) &&
    confidence >= MIN_CONFIDENCE_TO_AUTO_PUBLISH &&
    gate.trust_level >= MIN_TRUST_TO_AUTO_PUBLISH &&
    gate.quality_score >= MIN_QUALITY_TO_AUTO_PUBLISH &&
    gate.completeness_score >= MIN_COMPLETENESS_TO_AUTO_PUBLISH;

  const verification_status = canAutoPublish
    ? VERIFICATION_STATUS.VERIFIED
    : gate.verification_status;

  return {
    ...gate,
    confidence_score: confidence,
    can_auto_publish: canAutoPublish,
    verification_status,
    requires_human_review: !canAutoPublish,
  };
}
