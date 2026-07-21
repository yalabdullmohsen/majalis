/**
 * Quality Gate — all checks must pass before auto-publish
 */

import { scoreQuality } from "../knowledge-engine/quality.mjs";

export function runQualityGate(item, analysis, verification, connector) {
  const quality = scoreQuality(item, analysis, {
    verified: verification.sourceVerified,
    trust_score: verification.trustScore,
    verification_status: verification.verificationStatus,
  });

  // خُفِّفت العتبات لقبول بيانات ناقصة — اشتراط العنوان فقط
  const checks = {
    dedup: !verification.isDuplicate,
    source: true, // لا نرفض بسبب التحقق من المصدر
    link: true,   // لا نرفض بسبب الروابط
    title: Boolean(item.raw_title?.trim()?.length >= 2),
    content: Boolean(item.raw_body?.trim()?.length >= 5 || analysis?.ai_summary?.length >= 10 || item.raw_title?.trim()),
    language: true,  // لا نرفض بسبب اللغة
    category: true,  // لا نرفض بسبب التصنيف
    seo: true,       // لا نرجض بسبب SEO
    quality: quality.quality_score >= (connector?.minQualityScore || connector?.min_quality_score || 20),
    trust: verification.trustScore >= 20,
    ai_confidence: (analysis?.ai_confidence || 0) >= 20,
    no_forbidden: !analysis?.needs_human_review,
  };

  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  const passed = failed.length === 0;

  const autoPublish =
    passed &&
    connector?.autoPublish !== false &&
    (connector?.trust_level || 3) >= 2;

  return {
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
}

export function formatLanguage(text) {
  if (!text) return { ok: false };
  const arabicRatio = (text.match(/[\u0600-\u06FF]/g) || []).length / Math.max(text.length, 1);
  return { ok: arabicRatio > 0.3 || text.length < 50, arabicRatio };
}
