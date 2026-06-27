/**
 * Scholarly verification before publish — completeness, language, format, source trust.
 */
import { CONTENT_PIPELINES } from "./config.mjs";
import { normalizeArabicText } from "./normalize.mjs";

const ARABIC_RATIO_MIN = 0.35;
const WEAK_HADITH_MARKERS = ["ضعيف", "موضوع", "منكر", "لا أصل له", "لا يثبت"];
const REQUIRED_SOURCE_TYPES = new Set(["hadith", "rulings", "questions"]);

function arabicRatio(text) {
  const s = String(text || "");
  if (!s.length) return 0;
  const ar = (s.match(/[\u0600-\u06FF]/g) || []).length;
  return ar / s.length;
}

function hasRequiredFields(contentType, record) {
  const pipeline = CONTENT_PIPELINES[contentType];
  if (!pipeline) return { ok: false, blockers: ["unknown_content_type"] };
  const blockers = [];
  for (const field of pipeline.requiredFields) {
    const val = record[field];
    if (!val || !String(val).trim()) blockers.push(`missing_${field}`);
  }
  return { ok: blockers.length === 0, blockers };
}

export async function verifyContent({ contentType, record, source }) {
  const blockers = [];
  const warnings = [];
  const checks = {};

  const fields = hasRequiredFields(contentType, record);
  checks.fields = fields;
  if (!fields.ok) blockers.push(...fields.blockers);

  const mainText = record.text || record.body || record.question || record.title || "";
  const langRatio = arabicRatio(mainText);
  checks.language_ratio = langRatio;
  if (langRatio < ARABIC_RATIO_MIN && source?.language === "ar") {
    blockers.push("language_not_arabic");
  }

  if (source) {
    checks.trust_score = source.trust_score;
    const minTrust = source.publication_policy?.min_trust ?? 70;
    if (source.trust_score < minTrust) {
      warnings.push("low_trust_source");
    }
  }

  if (REQUIRED_SOURCE_TYPES.has(contentType)) {
    const src = record.source_name || record.source || record.reference;
    checks.source_present = Boolean(src);
    if (!src) blockers.push("missing_source");
  }

  if (contentType === "hadith") {
    for (const marker of WEAK_HADITH_MARKERS) {
      if (mainText.includes(marker) || String(record.grade || "").includes(marker)) {
        blockers.push("weak_hadith_marker");
        break;
      }
    }
    if (!record.grade && !record.narrator) {
      warnings.push("incomplete_hadith_metadata");
    }
  }

  if (contentType === "questions") {
    if (!record.answer || String(record.answer).trim().length < 10) {
      blockers.push("answer_too_short");
    }
    if (!record.category && !record.category_id && !record.category_name) {
      warnings.push("missing_category");
    }
  }

  if (contentType === "benefits") {
    if (String(mainText).length < 15) blockers.push("text_too_short");
  }

  const ok = blockers.length === 0;
  const severity = ok ? (warnings.length ? "review" : "pass") : "reject";

  return {
    ok,
    severity,
    blockers,
    warnings,
    checks,
    verdict: severity === "pass" ? "pass" : severity === "review" ? "review" : "reject",
  };
}

export async function enqueueReview({ contentType, record, source, verification, pipelineRunId }) {
  const { getSupabaseAdmin } = await import("../supabase-admin.mjs");
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  try {
    const { data, error } = await admin.from("akp_review_queue").insert({
      content_type: contentType,
      source_id: source?.id || null,
      source_slug: source?.slug || null,
      payload: record,
      blockers: verification.blockers,
      warnings: verification.warnings,
      status: "pending",
      pipeline_run_id: pipelineRunId || null,
    }).select("id").single();
    if (error) throw error;
    return { ok: true, reviewId: data.id };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}
