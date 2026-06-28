/**
 * Run lifecycle — start/finish runs, logging, audit trail.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { computeHealthScore } from "./pipeline.mjs";

export async function startEngineRun(engineId, runType = "incremental") {
  const admin = getSupabaseAdmin();
  if (!admin) return { runId: null, startedAt: Date.now() };

  const { data, error } = await admin
    .from("content_engine_runs")
    .insert({ engine_id: engineId, run_type: runType, status: "running" })
    .select("id")
    .maybeSingle();

  if (error) return { runId: null, startedAt: Date.now(), error: error.message };

  await admin
    .from("content_engine_config")
    .update({ last_run_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", engineId);

  return { runId: data?.id, startedAt: Date.now() };
}

export async function finishEngineRun(runId, engineId, stats, startedAt, { errorMessage, report } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin || !runId) return;

  const health = computeHealthScore(stats);
  const status =
    errorMessage && stats.items_published === 0
      ? "failed"
      : stats.errors > 0
        ? "partial"
        : "completed";

  await admin
    .from("content_engine_runs")
    .update({
      status,
      items_fetched: stats.items_fetched || 0,
      items_parsed: stats.items_parsed || 0,
      items_enriched: stats.items_enriched || 0,
      items_duplicate: stats.items_duplicate || 0,
      items_rejected: stats.items_rejected || 0,
      items_review: stats.items_review || 0,
      items_published: stats.items_published || 0,
      items_indexed: stats.items_indexed || 0,
      health_score: health,
      error_message: errorMessage || null,
      report: report || {},
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
    })
    .eq("id", runId);

  const patch = {
    health_score: health,
    updated_at: new Date().toISOString(),
    last_error: errorMessage || null,
  };
  if (status === "completed" || status === "partial") {
    patch.last_success_at = new Date().toISOString();
    patch.last_error = errorMessage || null;
  }
  await admin.from("content_engine_config").update(patch).eq("id", engineId);
}

export async function logEngineEvent({ runId, engineId, stage, level = "info", message, sourceUrl, metadata, durationMs }) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("content_engine_logs").insert({
      run_id: runId || null,
      engine_id: engineId,
      stage,
      level,
      message,
      source_url: sourceUrl || null,
      metadata: metadata || {},
      duration_ms: durationMs || null,
    });
  } catch {
    /* table optional */
  }
}

export function createRunLogger(runId, engineId) {
  return async (stage, level, message, extra = {}) => {
    await logEngineEvent({
      runId,
      engineId,
      stage,
      level,
      message,
      sourceUrl: extra.sourceUrl,
      metadata: extra.metadata,
      durationMs: extra.durationMs,
    });
  };
}

export async function auditPublish({ runId, engineId, targetTable, targetId, sourceUrl, action = "publish", metadata }) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("content_engine_publish_audit").insert({
      run_id: runId || null,
      engine_id: engineId,
      target_table: targetTable,
      target_id: String(targetId),
      source_url: sourceUrl || null,
      action,
      metadata: metadata || {},
    });
  } catch {
    /* optional */
  }
}

export async function isEngineEnabled(engineId) {
  const admin = getSupabaseAdmin();
  if (!admin) return true;
  const { data } = await admin.from("content_engine_config").select("enabled").eq("id", engineId).maybeSingle();
  return data?.enabled !== false;
}
