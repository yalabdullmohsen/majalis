/**
 * Lesson completeness scoring — shared between server-side import pipeline and
 * the quality cron job.  No AI inference; purely field-presence based.
 */

// Weights must sum to 1.0
const FIELD_WEIGHTS = [
  { key: "speaker_name",  alt: "sheikh_name",  weight: 0.20 },
  { key: "mosque",        alt: "location",      weight: 0.20 },
  { key: "day_of_week",   alt: "day",           weight: 0.20 },
  { key: "lesson_time",   alt: "time",          weight: 0.15 },
  { key: "category",      alt: null,            weight: 0.10 },
  { key: "city",          alt: "governorate",   weight: 0.15 },
];

function pick(row, primary, alt) {
  const v = row[primary] ?? (alt ? row[alt] : undefined);
  return v != null && String(v).trim() !== "";
}

/**
 * Returns { score, missingFields } for any lesson row object.
 * score is 0–1 (0.0 = nothing filled, 1.0 = all optional fields filled).
 * title is mandatory — rows without a title should not exist in DB.
 */
export function computeLessonCompleteness(row) {
  let score = 0;
  const missingFields = [];

  for (const field of FIELD_WEIGHTS) {
    if (pick(row, field.key, field.alt)) {
      score += field.weight;
    } else {
      missingFields.push(field.key);
    }
  }

  return { score: Math.min(1, Math.round(score * 100) / 100), missingFields };
}

/**
 * Annotates a draft/row object in-place before insert/update.
 * Mutates and returns the same object.
 */
export function annotateLessonQuality(row) {
  const { score, missingFields } = computeLessonCompleteness(row);
  row.completeness_score = score;
  row.missing_fields = missingFields;
  return row;
}

/**
 * Returns true if the lesson is considered "public-ready":
 * at minimum has mosque OR city, and a day OR time.
 */
export function isLessonPublicReady(row) {
  const hasSheikh   = Boolean(pick(row, "speaker_name", "sheikh_name"));
  const hasMosque   = Boolean(pick(row, "mosque", "location"));
  const hasDay      = Boolean(pick(row, "day_of_week", "day"));
  const hasTime     = Boolean(pick(row, "lesson_time", "time"));
  return hasSheikh && hasMosque && (hasDay || hasTime);
}

/**
 * Cron utility: backfill completeness_score + missing_fields for all rows
 * that still have the default 0 score (or NULL).
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function backfillLessonCompleteness({ dryRun = false, limit = 500 } = {}) {
  const supabase = getSupabaseAdmin();
  const started = Date.now();

  const { data: rows, error } = await supabase
    .from("lessons")
    .select("id, speaker_name, mosque, day_of_week, lesson_time, category, city")
    .or("completeness_score.is.null,completeness_score.eq.0")
    .limit(limit);

  if (error) return { ok: false, error: error.message };
  if (!rows || rows.length === 0) return { ok: true, updated: 0 };

  let updated = 0;
  for (const row of rows) {
    const { score, missingFields } = computeLessonCompleteness(row);
    if (!dryRun) {
      await supabase
        .from("lessons")
        .update({ completeness_score: score, missing_fields: missingFields })
        .eq("id", row.id);
    }
    updated++;
  }

  return { ok: true, updated, durationMs: Date.now() - started, dryRun };
}
