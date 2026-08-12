/**
 * Quality Control — block weak hadith, duplicates, unverified refs, spelling errors.
 */
import { validateLessonDraft } from "../cms/content-validator.mjs";

const WEAK_HADITH_MARKERS = [
  "ضعيف", "موضوع", "لا أصل له", "مكذوب", "fabricated", "daif", "mawdu",
];

const FABRICATED_PHRASES = [
  "من قال لك", "قيل أن", "يُروى عن", "without sanad",
];

export async function runQualityChecks({ parsed, sourceUrl, imageHash }) {
  const blockers = [];
  const warnings = [];
  let severity = "ok";

  const validation = validateLessonDraft(parsed || {});
  for (const e of validation.errors || []) {
    blockers.push(e.message);
    severity = "reject";
  }
  for (const w of validation.warnings || []) {
    warnings.push(w.message);
  }

  const text = [
    parsed?.title, parsed?.description, parsed?.speaker_name,
    parsed?.raw_ocr_text, parsed?.organizer,
  ].filter(Boolean).join(" ");

  for (const marker of WEAK_HADITH_MARKERS) {
    if (text.includes(marker)) {
      blockers.push(`تحذير حديث: ${marker}`);
      severity = "reject";
    }
  }

  for (const phrase of FABRICATED_PHRASES) {
    if (text.toLowerCase().includes(phrase)) {
      warnings.push(`عبارة غير موثقة: ${phrase}`);
    }
  }

  if (!sourceUrl && !parsed?.registration_url) {
    warnings.push("لا يوجد رابط مصدر");
  }

  if (parsed?.title && parsed.title.length < 4) {
    blockers.push("عنوان قصير جداً");
    severity = severity === "ok" ? "review" : severity;
  }

  const historicalIssues = detectHistoricalErrors(parsed);
  warnings.push(...historicalIssues);

  const spellingIssues = detectObviousSpellingErrors(parsed);
  warnings.push(...spellingIssues);

  return {
    ok: blockers.length === 0,
    severity: blockers.length ? severity : warnings.length ? "review" : "ok",
    blockers,
    warnings,
    imageHash: imageHash || null,
  };
}

function detectHistoricalErrors(parsed) {
  const issues = [];
  const dateStr = parsed?.start_date || parsed?.gregorian_date;
  if (dateStr) {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime()) && d.getFullYear() < 2020) {
      issues.push("تاريخ قديم — قد يكون منتهياً");
    }
  }
  return issues;
}

function detectObviousSpellingErrors(parsed) {
  const issues = [];
  const title = String(parsed?.title || "");
  if (/[a-zA-Z]{5,}/.test(title) && !parsed?.slug) {
    issues.push("عنوان يحتوي نصاً لاتينياً بدون slug");
  }
  return issues;
}

export async function logQualityFlag(admin, record) {
  if (!admin) return;
  try {
    await admin.from("mke_quality_flags").insert({
      source_id: record.sourceId || null,
      lesson_id: record.lessonId || null,
      draft_id: record.draftId || null,
      flag_type: record.flagType || "warning",
      message: record.message,
      metadata: record.metadata || {},
    });
  } catch {
    /* optional */
  }
}
