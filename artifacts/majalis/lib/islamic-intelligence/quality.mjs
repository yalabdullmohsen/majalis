/**
 * AI Quality Score — unified platform-wide quality index.
 * Low-quality items are flagged, not hidden.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { scoreContent, getQualityStats } from "../global-reference/quality.mjs";
import { runReviewGate } from "../scholarly-verification/review-gate.mjs";
import { getRelations } from "../global-reference/relations.mjs";

const QUALITY_TIERS = {
  excellent: { min: 85, label: "ممتاز", color: "green" },
  good: { min: 70, label: "جيد", color: "blue" },
  needs_review: { min: 50, label: "يحتاج مراجعة", color: "orange" },
  low: { min: 0, label: "جودة منخفضة", color: "red" },
};

function getTier(score) {
  if (score >= 85) return QUALITY_TIERS.excellent;
  if (score >= 70) return QUALITY_TIERS.good;
  if (score >= 50) return QUALITY_TIERS.needs_review;
  return QUALITY_TIERS.low;
}

export async function runQualityScoring(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const maxItems = opts.maxItems || 100;

  const result = {
    id: runId,
    agent: "quality_scorer",
    status: "running",
    started_at: new Date().toISOString(),
    items_scored: 0,
    avg_score: 0,
    tiers: { excellent: 0, good: 0, needs_review: 0, low: 0 },
    flagged_items: [],
    scores: [],
  };

  if (!admin) {
    result.status = "completed";
    result.finished_at = new Date().toISOString();
    return result;
  }

  let totalScore = 0;

  try {
    const { data: refs } = await admin.from("global_content_refs").select("*").limit(maxItems);

    for (const ref of refs || []) {
      const relations = await getRelations(admin, ref.ref_id);
      const scores = await scoreContent(admin, ref, { relationCount: relations.length });
      const gate = await runReviewGate(ref, { checkLinks: false });

      const unified = {
        ref_id: ref.ref_id,
        title: ref.title,
        overall_score: scores.overall_score,
        completeness: scores.completeness_score,
        source_quality: scores.source_quality_score,
        freshness: scores.freshness_score,
        linking: scores.linking_score,
        classification: scores.classification_score,
        can_publish: scores.can_publish && gate.can_publish,
        tier: getTier(scores.overall_score).label,
        flagged: scores.overall_score < 70,
        flag_reason: scores.overall_score < 70 ? "جودة أقل من 70 — للمراجعة اللاحقة" : null,
      };

      result.items_scored++;
      totalScore += unified.overall_score;
      result.scores.push(unified);

      if (unified.overall_score >= 85) result.tiers.excellent++;
      else if (unified.overall_score >= 70) result.tiers.good++;
      else if (unified.overall_score >= 50) result.tiers.needs_review++;
      else result.tiers.low++;

      if (unified.flagged) {
        result.flagged_items.push({
          ref_id: unified.ref_id,
          title: unified.title,
          score: unified.overall_score,
          reason: unified.flag_reason,
        });
      }
    }
  } catch {
    /* scoring optional */
  }

  const stats = await getQualityStats(admin);
  result.avg_score = result.items_scored ? Math.round(totalScore / result.items_scored) : stats.avg || 0;
  result.incomplete_count = stats.incomplete || result.tiers.needs_review + result.tiers.low;
  result.status = "completed";
  result.finished_at = new Date().toISOString();
  result.policy = "العناصر منخفضة الجودة لا تُخفى — تُميّز للمراجعة اللاحقة";

  if (admin) {
    try {
      await admin.from("intelligence_runs").insert({
        id: runId,
        agent_id: "quality_scorer",
        status: "completed",
        items_checked: result.items_scored,
        issues_found: result.flagged_items.length,
        fixes_suggested: result.tiers.needs_review + result.tiers.low,
        report: { avg_score: result.avg_score, tiers: result.tiers, flagged: result.flagged_items.slice(0, 50) },
        started_at: result.started_at,
        finished_at: result.finished_at,
      });
    } catch {
      /* table may not exist */
    }
  }

  return result;
}

export { QUALITY_TIERS, getTier };
