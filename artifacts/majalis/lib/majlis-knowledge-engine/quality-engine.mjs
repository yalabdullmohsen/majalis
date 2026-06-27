/**
 * Quality Engine v2 — structured gates with rejection reports.
 * Extends quality-control.mjs without replacing it.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { runQualityChecks } from "./quality-control.mjs";

const TRUST_MIN = 40;

export async function runQualityEngine({
  parsed,
  source,
  sourceUrl,
  imageUrl,
  imageHash,
  visionMetrics,
}) {
  const base = await runQualityChecks({ parsed, sourceUrl, imageHash });
  const blockers = [...(base.blockers || [])];
  const warnings = [...(base.warnings || [])];
  const checks = {};

  checks.source_trusted = (source?.trust_score ?? 0) >= TRUST_MIN;
  if (!checks.source_trusted) blockers.push("المصدر غير موثوق — درجة الثقة منخفضة");

  checks.link_valid = Boolean(sourceUrl && /^https?:\/\//i.test(sourceUrl));
  if (!checks.link_valid && !parsed?.registration_url) {
    blockers.push("رابط المصدر مكسور أو غير موجود");
  }

  checks.image_present = Boolean(imageUrl || parsed?.poster_url);
  if (!checks.image_present) warnings.push("لا توجد صورة للدرس");

  checks.data_complete = Boolean(parsed?.title && (parsed?.speaker_name || parsed?.mosque));
  if (!checks.data_complete) blockers.push("بيانات ناقصة — العنوان أو الشيخ/المسجد");

  checks.date_valid = validateDate(parsed);
  if (checks.date_valid === false) blockers.push("التاريخ منتهٍ أو غير صالح");

  checks.time_valid = validateTime(parsed);
  if (checks.time_valid === false) warnings.push("الوقت غير منطقي");

  checks.sheikh_known = Boolean(parsed?.speaker_name && parsed.speaker_name.length >= 3);
  if (!checks.sheikh_known) warnings.push("الشيخ غير معروف أو غير محدد");

  checks.location_valid = Boolean(parsed?.mosque || parsed?.region || parsed?.city);
  if (!checks.location_valid) warnings.push("المكان غير محدد");

  if (visionMetrics?.combinedConfidence != null && visionMetrics.combinedConfidence < 0.25) {
    warnings.push("ثقة Vision/OCR منخفضة");
  }

  const verdict = blockers.length ? "reject" : warnings.length ? "review" : "pass";
  const report = {
    verdict,
    blockers,
    warnings,
    checks,
    canPublish: verdict === "pass",
    requiresReview: verdict === "review",
    rejected: verdict === "reject",
    rejectionReasons: blockers,
  };

  await persistQualityReport({
    sourceId: source?.id,
    sourceUrl,
    report,
  });

  return {
    ok: blockers.length === 0,
    severity: verdict === "reject" ? "reject" : verdict === "review" ? "review" : "ok",
    blockers,
    warnings,
    checks,
    report,
  };
}

function validateDate(parsed) {
  const raw = parsed?.start_date || parsed?.gregorian_date || parsed?.end_date;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today && !parsed?.recurring) return false;
  return true;
}

function validateTime(parsed) {
  const t = String(parsed?.lesson_time || parsed?.time || "");
  if (!t) return null;
  if (/^\d{1,2}$/.test(t.trim())) return false;
  return true;
}

async function persistQualityReport({ sourceId, sourceUrl, report, draftId, lessonId }) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("mke_quality_reports").insert({
      source_id: sourceId || null,
      source_url: sourceUrl || null,
      draft_id: draftId || null,
      lesson_id: lessonId || null,
      verdict: report.verdict,
      blockers: report.blockers,
      warnings: report.warnings,
      checks: report.checks,
      report,
    });
  } catch {
    /* optional table until migration */
  }
}

export { persistQualityReport };
