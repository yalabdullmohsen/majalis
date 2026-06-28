/**
 * Quality Gate — all checks must pass before auto-publish
 */

import { scoreQuality } from "../knowledge-engine/quality.mjs";
import { normalizeContentKind } from "./content-kind.mjs";
import { applyConfidenceToGate } from "./confidence-publish.mjs";

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

  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  const passed = failed.length === 0;

  const autoPublishEnabled = connector?.auto_publish !== false && connector?.autoPublish !== false;

  const autoPublish =
    passed &&
    autoPublishEnabled &&
    trustLevel >= 4;

  const base = {
    ...quality,
    checks,
    failedChecks: failed,
    passed,
    canPublish: passed || (quality.can_publish && !verification.isDuplicate),
    autoPublish,
    publishStatus: verification.isDuplicate
      ? "rejected"
      : autoPublish
        ? "pending"
        : "pending",
    verificationStatus: verification.isDuplicate
      ? "duplicate"
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
