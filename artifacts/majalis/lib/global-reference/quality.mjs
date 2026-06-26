/**
 * Unified quality scoring — single facade over all quality gates.
 */

import { MIN_TRUST_TO_PUBLISH, MIN_QUALITY_TO_PUBLISH, MIN_COMPLETENESS_TO_PUBLISH } from "../scholarly-verification/utils.mjs";
import { runReviewGate } from "../scholarly-verification/review-gate.mjs";

function scoreCompleteness(item) {
  let score = 0;
  const fields = [
    item.title || item.ai_title || item.question || item.text,
    item.source_name || item.author,
    item.source_url,
    item.summary || item.ai_summary || item.description,
    item.category || item.ai_category,
  ];
  const filled = fields.filter(Boolean).length;
  score = Math.round((filled / fields.length) * 100);
  return score;
}

function scoreFreshness(item) {
  const date = item.updated_at || item.published_at || item.created_at;
  if (!date) return 30;
  const ageDays = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 30) return 100;
  if (ageDays <= 90) return 80;
  if (ageDays <= 365) return 60;
  return 40;
}

function scoreLinking(relationCount) {
  if (relationCount >= 10) return 100;
  if (relationCount >= 5) return 80;
  if (relationCount >= 2) return 60;
  if (relationCount >= 1) return 40;
  return 20;
}

export async function scoreContent(admin, item, { relationCount = 0 } = {}) {
  const completeness = scoreCompleteness(item);
  const sourceQuality = item.trust_level ?? item.trust_score ?? 50;
  const freshness = scoreFreshness(item);
  const linking = scoreLinking(relationCount);
  const classification = item.category || item.ai_category ? 80 : 40;
  const reviewCount = item.review_count || 0;

  let gateResult = null;
  try {
    gateResult = await runReviewGate(item, { checkLinks: false });
  } catch {
    /* gate may fail on partial items */
  }

  const overall = Math.round(
    completeness * 0.25 +
      Math.min(sourceQuality, 100) * 0.25 +
      freshness * 0.15 +
      linking * 0.15 +
      classification * 0.1 +
      Math.min(reviewCount * 10, 100) * 0.1,
  );

  const scores = {
    completeness_score: completeness,
    source_quality_score: Math.min(sourceQuality, 100),
    review_count: reviewCount,
    freshness_score: freshness,
    linking_score: linking,
    classification_score: classification,
    overall_score: overall,
    can_publish: overall >= MIN_QUALITY_TO_PUBLISH && sourceQuality >= MIN_TRUST_TO_PUBLISH && completeness >= MIN_COMPLETENESS_TO_PUBLISH,
    gate: gateResult,
  };

  if (admin && item.ref_id) {
    try {
      await admin.from("reference_quality_scores").upsert(
        { ref_id: item.ref_id, ...scores, scored_at: new Date().toISOString() },
        { onConflict: "ref_id" },
      );
    } catch {
      /* table may not exist */
    }
  }

  return scores;
}

export async function getQualityStats(admin) {
  if (!admin) return { avg: 0, incomplete: 0 };

  try {
    const { data } = await admin.from("reference_quality_scores").select("overall_score, completeness_score");
    if (!data?.length) return { avg: 0, incomplete: 0, count: 0 };

    const avg = Math.round(data.reduce((s, r) => s + r.overall_score, 0) / data.length);
    const incomplete = data.filter((r) => r.completeness_score < 70).length;
    return { avg, incomplete, count: data.length };
  } catch {
    return { avg: 0, incomplete: 0, count: 0 };
  }
}
