/**
 * Phase 6 — Enhanced duplicate detection engine.
 * Wraps Phase 4/5 detector + fuzzy, Levenshtein, perceptual hash, embeddings stub.
 */
import { findDuplicateLesson } from "../lesson-duplicate-detector.mjs";
import { compositeLessonKey, fuzzySimilarity, tokenOverlapScore } from "./text-utils.mjs";
import { perceptualSimilarity } from "./image-hash.mjs";
import { computeEmbeddingSimilarity } from "./image-hash.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";

const DUPLICATE_THRESHOLD = 0.85;
const PERCEPTUAL_THRESHOLD = 0.92;

function fieldCompletenessScore(parsed) {
  const fields = [
    parsed.title,
    parsed.speaker_name || parsed.sheikh_name,
    parsed.mosque || parsed.location,
    parsed.start_date || parsed.gregorian_date || parsed.day_of_week,
    parsed.lesson_time || parsed.time,
  ];
  const filled = fields.filter((f) => f != null && String(f).trim()).length;
  return filled / fields.length;
}

export async function findIntelligenceDuplicate({
  parsed,
  sourceUrl,
  imageHash,
  perceptualHash,
  sourceId,
}) {
  const base = await findDuplicateLesson({ parsed, sourceUrl, imageHash });
  if (base.isDuplicate) {
    return { ...base, engine: "phase5", methods: ["url", "hash", "composite"] };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return { isDuplicate: false, similarity_score: base.similarity_score || 0, engine: "intelligence", methods: [] };
  }

  const composite = compositeLessonKey(parsed);
  const methods = [];
  let bestScore = base.similarity_score || 0;
  let matchedLesson = null;
  let reason = null;

  const { data: recent } = await admin
    .from("lessons")
    .select("id, title, speaker_name, mosque, start_date, day_of_week, lesson_time, poster_image_hash, external_key")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(300);

  for (const row of recent || []) {
    const rowKey = [row.title, row.speaker_name, row.mosque, row.start_date || row.day_of_week, row.lesson_time]
      .filter(Boolean)
      .join("|");

    const fuzzy = Math.max(fuzzySimilarity(composite, rowKey), tokenOverlapScore(composite, rowKey));
    const embed = computeEmbeddingSimilarity(composite, rowKey);
    const score = Math.max(fuzzy, embed);

    if (score > bestScore) {
      bestScore = score;
      matchedLesson = row;
      if (fuzzy >= embed) methods.push("fuzzy");
      else methods.push("embedding_stub");
    }
  }

  if (perceptualHash) {
    const { data: withHash } = await admin
      .from("lesson_intelligence_extractions")
      .select("lesson_id, perceptual_hash")
      .not("perceptual_hash", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);
    for (const row of withHash || []) {
      const sim = perceptualSimilarity(perceptualHash, row.perceptual_hash);
      if (sim >= PERCEPTUAL_THRESHOLD) {
        return {
          isDuplicate: true,
          reason: "perceptual_hash_match",
          message: `تكرار بصري (${Math.round(sim * 100)}%)`,
          lesson: { id: row.lesson_id },
          similarity_score: sim,
          engine: "intelligence",
          methods: ["perceptual_hash"],
        };
      }
    }
  }

  if (bestScore >= DUPLICATE_THRESHOLD) {
    reason = "intelligence_fuzzy_match";
    return {
      isDuplicate: true,
      reason,
      message: `درس مشابه (${Math.round(bestScore * 100)}%) — ${methods.join("+")}`,
      lesson: matchedLesson,
      similarity_score: bestScore,
      engine: "intelligence",
      methods,
    };
  }

  return {
    isDuplicate: false,
    similarity_score: bestScore,
    engine: "intelligence",
    methods,
    fieldCompleteness: fieldCompletenessScore(parsed),
  };
}

export { DUPLICATE_THRESHOLD, fieldCompletenessScore };
