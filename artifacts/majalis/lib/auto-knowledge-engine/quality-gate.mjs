/**
 * Quality Gate — all checks must pass before auto-publish
 */

import { scoreQuality } from "../knowledge-engine/quality.mjs";
import { normalizeContentKind } from "./content-kind.mjs";
import { applyConfidenceToGate } from "./confidence-publish.mjs";
import { computeConfidenceScore, THRESHOLDS } from "../production/confidence-engine.mjs";
import { containsBlockedContentMarker } from "../production/content-sanitizer.mjs";

export function runQualityGate(item, analysis, verification, connector) {
  const quality = scoreQuality(item, analysis, {
    verified: verification.sourceVerified,
    trust_score: verification.trustScore,
    verification_status: verification.verificationStatus,
  });

  const trustLevel = connector?.trust_level ?? connector?.trustLevel ?? 3;
  const connectorType = connector?.connector_type || connector?.connectorType;
  const isCuratedManifest =
    connectorType === "manifest" ||
    Boolean(item.raw_payload?._manifest_file || item.raw_payload?.source_name);
  const lessonKind = ["lesson", "lecture", "course", "announcement"].includes(
    normalizeContentKind(item.content_kind),
  );
  const isTrustedOfficialLesson =
    trustLevel >= 4 &&
    lessonKind &&
    (connectorType === "instagram" ||
      connector?.platform === "instagram" ||
      connectorType === "seed" ||
      item.source_slug === "kuwait-lessons" ||
      connector?.slug === "kuwait-lessons");

  const checks = {
    dedup: !verification.isDuplicate,
    source: verification.sourceVerified,
    link: !verification.warnings?.includes("broken_link"),
    title: Boolean(item.raw_title?.trim()?.length >= 4),
    content: Boolean(item.raw_body?.trim()?.length >= 20 || analysis?.ai_summary?.length >= 40),
    language: Boolean(analysis?.ai_language),
    category: Boolean(analysis?.ai_category),
    seo: Boolean(analysis?.seo_title && analysis?.seo_description),
    quality: quality.quality_score >= (connector?.minQualityScore || connector?.min_quality_score || 65),
    trust: verification.trustScore >= 60,
    ai_confidence:
      (analysis?.ai_confidence || 0) >= 50 ||
      (((trustLevel >= 4 && isCuratedManifest) || isTrustedOfficialLesson) &&
        (analysis?.ai_confidence || 0) >= 40),
    no_forbidden:
      !analysis?.needs_human_review ||
      (trustLevel >= 4 && isCuratedManifest) ||
      isTrustedOfficialLesson,
  };

  const ef = item.extracted_fields || item.raw_payload?.extracted_fields || {};
  const blockedText = `${item.raw_title || ""} ${item.raw_body || ""}`;
  const quizLike = /^(?:س\s*\)|أ\s*\)|ب\s*\)|ج\s*\)|\d+\)|فائدة\s*:)/.test(item.raw_body?.trim() || "")
    || containsBlockedContentMarker(blockedText);

  const confidence = computeConfidenceScore({
    baseScore: item.confidence?.score ?? analysis?.ai_confidence ?? quality.quality_score,
    sourceType: item.source_type || connector?.connector_type || connector?.platform,
    dateMatch: Boolean(ef.gregorian_date || ef.start_date),
    sheikhMatch: Boolean(ef.speaker_name || ef.sheikh_name || analysis?.ai_scholar),
    mosqueMatch: Boolean(ef.mosque || ef.mosque_name),
    cityMatch: Boolean(ef.city),
    urlMatch: Boolean(item.raw_url || item.source_url),
    metadataComplete: Boolean(ef.title && (ef.speaker_name || ef.sheikh_name) && ef.mosque),
    ocrConfidence: ef.ocr_confidence ?? item.raw_payload?.ocr_confidence,
    visionConfidence: ef.confidence,
    multiSourceAgreement: Boolean(item.fusion_key || item._unifiedFingerprint),
    quizLike,
    missingRequiredFields: [
      !ef.title && !item.raw_title && "title",
      !ef.speaker_name && !ef.sheikh_name && !analysis?.ai_scholar && "speaker",
    ].filter(Boolean),
  });

  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  const passed = failed.length === 0;

  const autoPublishEnabled = connector?.auto_publish !== false && connector?.autoPublish !== false;
  const confidenceAllowsPublish = confidence.action === "publish" || confidence.action === "fast_review";

  const autoPublish =
    passed &&
    autoPublishEnabled &&
    trustLevel >= 4 &&
    confidenceAllowsPublish &&
    !quizLike;

  const base = {
    ...quality,
    checks,
    failedChecks: failed,
    passed,
    confidence,
    confidenceAction: confidence.action,
    confidenceThresholds: THRESHOLDS,
    canPublish:
      !verification.isDuplicate &&
      !quizLike &&
      (confidence.action === "publish" ||
        confidence.action === "fast_review" ||
        confidence.action === "manual_review") &&
      (passed || quality.can_publish),
    autoPublish,
    publishStatus: verification.isDuplicate
      ? "rejected"
      : confidence.action === "reject" || quizLike
        ? "rejected"
        : autoPublish
          ? "pending"
          : "pending",
    verificationStatus: verification.isDuplicate
      ? "duplicate"
      : confidence.action === "reject" || quizLike
        ? "rejected"
        : autoPublish
          ? "verified"
          : quality.verification_status,
  };

  return applyConfidenceToGate(base, item, connector);
}

export function formatLanguage(text) {
  if (!text) return { ok: false };
  const arabicRatio = (text.match(/[\u0600-\u06FF]/g) || []).length / Math.max(text.length, 1);
  return { ok: arabicRatio > 0.3 || text.length < 50, arabicRatio };
}
