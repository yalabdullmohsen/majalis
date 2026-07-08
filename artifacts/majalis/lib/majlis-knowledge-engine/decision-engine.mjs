/**
 * AI Decision Engine — determines approved / pending / duplicate / rejected / archived / expired.
 */
import { evaluateAutoPublish } from "../cms/auto-publish-engine.mjs";
import { findIntelligenceDuplicate } from "../cms/lesson-intelligence/dedup-engine.mjs";
import { computeSourceTrustScore, computeExtractionConfidence } from "../cms/lesson-intelligence/trust-scorer.mjs";
import { fieldCompletenessScore } from "../cms/lesson-intelligence/dedup-engine.mjs";
import { runQualityChecks } from "./quality-control.mjs";
import { AUTO_PUBLISH_MIN_CONFIDENCE, DECISIONS } from "./config.mjs";

export async function makeContentDecision({
  source,
  parsed,
  confidenceScore,
  sourceUrl,
  imageUrl,
  imageHash,
  perceptualHash,
  sheikhMatch,
  mosqueMatch,
  visionMetrics,
}) {
  const t0 = Date.now();
  const reasons = [];
  const quality = await runQualityChecks({ parsed, sourceUrl, imageHash });

  if (!quality.ok) {
    for (const issue of quality.blockers) reasons.push(issue);
    return buildDecision({
      decision: quality.severity === "reject" ? "rejected" : "pending_review",
      autoPublish: false,
      reasons,
      quality,
      confidenceScore,
      durationMs: Date.now() - t0,
    });
  }

  let duplicate = null;
  try {
    duplicate = await findIntelligenceDuplicate({
      parsed,
      sourceUrl,
      imageHash,
      perceptualHash,
    });
  } catch {
    /* optional */
  }

  if (duplicate?.isDuplicate) {
    return buildDecision({
      decision: "duplicate",
      autoPublish: false,
      reasons: [duplicate.reason || "محتوى مكرر"],
      duplicate,
      quality,
      confidenceScore,
      durationMs: Date.now() - t0,
    });
  }

  const connectorSource = source ? {
    ...source,
    trust_level: source.trust_score >= 95 ? "official" : source.trust_score >= 80 ? "trusted" : "community",
    auto_publish_allowed: source.auto_publish,
  } : null;

  const autoEval = evaluateAutoPublish({
    source: connectorSource,
    parsed,
    confidenceScore,
    duplicate: duplicate?.isDuplicate,
    sheikhMatch,
    sourceUrl,
    imageUrl,
  });

  const completeness = fieldCompletenessScore(parsed);
  const trustScore = source ? computeSourceTrustScore(source) : 0;

  // خُفِّفت شروط القبول لزيادة استيعاب البيانات الجزئية
  const checks = {
    isAuthenticAnnouncement: completeness >= 0.15 && Boolean(parsed.title),
    isIslamicLesson: !isNonLessonContent(parsed),
    sheikhKnown: Boolean(sheikhMatch?.id || parsed.speaker_name),
    mosqueKnown: Boolean(mosqueMatch?.id || parsed.mosque),
    hasConflict: false,
    isDuplicate: false,
    dataComplete: completeness >= 0.30,
    trustHigh: trustScore >= 40,
    canAutoPublish: autoEval.autoPublish,
    needsReview: !autoEval.autoPublish,
  };

  if (autoEval.autoPublish && (confidenceScore ?? 0) >= AUTO_PUBLISH_MIN_CONFIDENCE) {
    return buildDecision({
      decision: "approved",
      autoPublish: true,
      reasons: autoEval.reasons?.length ? autoEval.reasons : ["ثقة عالية + مصدر موثوق + حقول مكتملة"],
      checks,
      quality,
      confidenceScore,
      completeness,
      trustScore,
      durationMs: Date.now() - t0,
    });
  }

  const decision = autoEval.decision === "rejected" ? "rejected" : "pending_review";
  return buildDecision({
    decision,
    autoPublish: false,
    reasons: autoEval.reasons?.length ? autoEval.reasons : ["يتطلب مراجعة بشرية"],
    checks,
    quality,
    confidenceScore,
    completeness,
    trustScore,
    durationMs: Date.now() - t0,
  });
}

function isNonLessonContent(parsed) {
  const title = String(parsed.title || "").toLowerCase();
  const block = ["إعلان وظيف", "خصم", "تخفيض", "مطعم", "sale", "promo"];
  return block.some((w) => title.includes(w));
}

function buildDecision(payload) {
  const decision = DECISIONS.includes(payload.decision) ? payload.decision : "pending_review";
  return {
    ok: true,
    decision,
    autoPublish: Boolean(payload.autoPublish),
    reasons: payload.reasons || [],
    checks: payload.checks || {},
    quality: payload.quality || {},
    duplicate: payload.duplicate || null,
    confidenceScore: payload.confidenceScore ?? 0,
    completeness: payload.completeness ?? 0,
    trustScore: payload.trustScore ?? 0,
    durationMs: payload.durationMs ?? 0,
  };
}

export async function logDecision(admin, record) {
  if (!admin) return;
  try {
    await admin.from("mke_decisions").insert({
      source_id: record.sourceId || null,
      source_url: record.sourceUrl || null,
      draft_id: record.draftId || null,
      lesson_id: record.lessonId || null,
      decision: record.decision,
      confidence_score: record.confidenceScore,
      reasons: record.reasons || [],
      checks: record.checks || {},
      metadata: record.metadata || {},
    });
  } catch {
    /* optional table */
  }
}
