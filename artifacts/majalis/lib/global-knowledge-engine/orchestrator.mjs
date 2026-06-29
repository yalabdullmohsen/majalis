/**
 * Global Knowledge Engine (GKE) — Central Orchestrator
 *
 * Architecture-first facade over existing AKE/MKE/CMS/search stacks.
 * Phase 1: pipeline wiring, health, dry-run validation — no duplicate ingestion.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { GKE_VERSION, GKE_PHASE } from "./config.mjs";
import { PIPELINE_FLOW } from "./pipeline.mjs";
import { LAYER_MODULES } from "./layers/index.mjs";
import { emit, GKE_EVENTS } from "./events.mjs";
import { getHealthDashboard } from "./monitoring.mjs";
import * as parserEngine from "./layers/parser-engine.mjs";
import * as normalizationEngine from "./layers/normalization-engine.mjs";
import * as qualityEngine from "./layers/quality-engine.mjs";
import * as deduplicationEngine from "./layers/deduplication-engine.mjs";
import * as reviewQueue from "./layers/review-queue.mjs";
import * as cmsDispatcher from "./layers/cms-dispatcher.mjs";

/**
 * Run architecture validation — ensures all layers respond.
 */
export async function validateArchitecture() {
  const start = Date.now();
  const layerResults = [];
  for (const id of PIPELINE_FLOW) {
    const mod = LAYER_MODULES[id];
    layerResults.push(mod?.getStatus?.() || { id, status: "missing" });
  }
  const wiringOk = layerResults.every((l) => l.status === "active" || l.status === "pending");
  return {
    ok: wiringOk,
    version: GKE_VERSION,
    phase: GKE_PHASE,
    layers: layerResults,
    duration_ms: Date.now() - start,
  };
}

/**
 * Dry-run pipeline on a sample item — validates layer chain without publishing.
 * @param {{ title?: string, body?: string, content_kind?: string, external_key?: string, source_id?: string }} sample
 */
export async function runPipelineDryRun(sample = {}) {
  const start = Date.now();
  await emit(GKE_EVENTS.PIPELINE_START, { mode: "dry_run", sample });

  const item = {
    external_key: sample.external_key || "gke:dry-run:sample",
    source_id: sample.source_id || "gke-internal",
    content_kind: sample.content_kind || "lesson",
    title: sample.title || "عينة اختبار — GKE",
    body: sample.body || "نص تجريبي للتحقق من سلسلة المعالجة.",
    metadata: sample.metadata || {},
  };

  const stages = [];

  const parsed = await parserEngine.parse(item);
  stages.push(parsed);
  await emit(GKE_EVENTS.PIPELINE_STAGE, { stage: "parser", result: parsed });

  const normalized = await normalizationEngine.normalize({ ...item, ...parsed.data });
  stages.push(normalized);

  const quality = await qualityEngine.scoreQuality(item);
  stages.push(quality);

  const dedup = await deduplicationEngine.deduplicate(item, []);
  stages.push(dedup);

  let review = null;
  if (!quality.data?.passed) {
    review = await reviewQueue.enqueue(item, "dry_run_quality");
    stages.push(review);
  }

  const cms = await cmsDispatcher.dispatch(item);
  stages.push({ ...cms, data: { ...cms.data, dryRun: true, published: false } });

  await emit(GKE_EVENTS.PIPELINE_COMPLETE, { mode: "dry_run", stages: stages.length });

  return {
    ok: stages.every((s) => s.ok !== false),
    version: GKE_VERSION,
    phase: GKE_PHASE,
    mode: "dry_run",
    item,
    stages,
    duration_ms: Date.now() - start,
  };
}

/**
 * Record GKE run in audit table (when migration applied).
 */
export async function recordGkeRun(run) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, skipped: true };
  try {
    const { data, error } = await admin
      .from("gke_pipeline_runs")
      .insert({
        run_type: run.run_type || "dry_run",
        status: run.ok ? "completed" : "failed",
        phase: GKE_PHASE,
        payload: run,
        duration_ms: run.duration_ms,
      })
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return { ok: true, id: data?.id };
  } catch {
    return { ok: false, skipped: true };
  }
}

export async function getDashboard() {
  const [health, validation] = await Promise.all([getHealthDashboard(), validateArchitecture()]);
  return {
    ok: true,
    version: GKE_VERSION,
    phase: GKE_PHASE,
    health,
    validation,
    pipeline: PIPELINE_FLOW,
    delegates: (await import("./config.mjs")).GKE_DELEGATES,
  };
}
