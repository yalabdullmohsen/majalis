/**
 * Decision Engine v2 — multi-stage weighted scoring.
 * Wraps v1 decision-engine; does not replace it.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { makeContentDecision } from "./decision-engine.mjs";
import { AUTO_PUBLISH_MIN_CONFIDENCE } from "./config.mjs";

const STAGE_WEIGHTS = {
  vision: 0.2,
  ocr: 0.1,
  source: 0.15,
  quality: 0.2,
  duplicate: 0.15,
  reasoning: 0.2,
};

export async function makeMultiStageDecision(ctx) {
  const t0 = Date.now();
  const stages = [];

  const visionScore = clamp01(ctx.visionMetrics?.visionConfidence ?? ctx.visionMetrics?.combinedConfidence ?? 0.5);
  stages.push(stage("vision", visionScore, STAGE_WEIGHTS.vision, { enabled: ctx.visionMetrics?.visionEnabled }));

  const ocrScore = clamp01(ctx.visionMetrics?.ocrConfidence ?? 0.4);
  stages.push(stage("ocr", ocrScore, STAGE_WEIGHTS.ocr));

  const sourceScore = clamp01((ctx.source?.trust_score ?? 50) / 100);
  stages.push(stage("source", sourceScore, STAGE_WEIGHTS.source, { trust: ctx.source?.trust_score }));

  const qualityScore = ctx.quality?.ok ? 1 : ctx.quality?.severity === "review" ? 0.5 : 0;
  stages.push(stage("quality", qualityScore, STAGE_WEIGHTS.quality, {
    blockers: ctx.quality?.blockers?.length ?? 0,
  }));

  const dupScore = ctx.duplicate?.isDuplicate ? 0 : 1;
  stages.push(stage("duplicate", dupScore, STAGE_WEIGHTS.duplicate));

  const reasoningScore = clamp01(ctx.confidenceScore ?? 0.5);
  stages.push(stage("reasoning", reasoningScore, STAGE_WEIGHTS.reasoning));

  const finalWeighted = stages.reduce((sum, s) => sum + s.weighted_score, 0);
  const totalWeight = stages.reduce((sum, s) => sum + s.weight, 0);
  const finalScore = totalWeight > 0 ? finalWeighted / totalWeight : 0;

  const v1 = await makeContentDecision(ctx);

  if (finalScore < 0.35 && v1.decision === "approved") {
    v1.decision = "pending_review";
    v1.autoPublish = false;
    v1.reasons = [...(v1.reasons || []), "درجة Multi-Stage منخفضة — مراجعة مطلوبة"];
  }

  if (finalScore >= AUTO_PUBLISH_MIN_CONFIDENCE && v1.checks?.canAutoPublish) {
    v1.autoPublish = true;
    v1.decision = "approved";
  }

  const result = {
    ...v1,
    multiStage: {
      finalScore: Math.round(finalScore * 1000) / 1000,
      stages,
      durationMs: Date.now() - t0,
    },
  };

  await persistDecisionScores({
    sourceUrl: ctx.sourceUrl,
    stages,
    finalScore,
  });

  return result;
}

function stage(name, score, weight, details = {}) {
  const s = clamp01(score);
  return {
    stage: name,
    score: s,
    weight,
    weighted_score: Math.round(s * weight * 1000) / 1000,
    details,
  };
}

function clamp01(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

async function persistDecisionScores({ sourceUrl, stages, finalScore, decisionId }) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    const rows = [
      ...stages.map((s) => ({
        decision_id: decisionId || null,
        source_url: sourceUrl,
        stage: s.stage,
        score: s.score,
        weight: s.weight,
        weighted_score: s.weighted_score,
        details: s.details || {},
      })),
      {
        decision_id: decisionId || null,
        source_url: sourceUrl,
        stage: "final",
        score: finalScore,
        weight: 1,
        weighted_score: finalScore,
        details: { aggregated: true },
      },
    ];
    await admin.from("mke_decision_scores").insert(rows);
  } catch {
    /* optional table */
  }
}

export { makeContentDecision, persistDecisionScores };
