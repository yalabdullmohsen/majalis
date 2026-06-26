/**
 * Unified audit logging for all autonomous pipeline operations.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function logPipelineEvent(admin, event) {
  const row = {
    run_id: event.runId || null,
    pipeline: event.pipeline || "autonomous",
    stage: event.stage || "unknown",
    event_type: event.eventType || "info",
    content_id: event.contentId || null,
    content_kind: event.contentKind || null,
    source_slug: event.sourceSlug || null,
    message: event.message ? String(event.message).slice(0, 2000) : null,
    metadata: event.metadata || {},
    duration_ms: event.durationMs ?? null,
    success: event.success !== false,
  };

  if (admin) {
    try {
      await admin.from("autonomous_pipeline_events").insert(row);
    } catch {
      /* table may not exist */
    }
  }

  const prefix = event.success === false ? "[FAIL]" : "[OK]";
  console.log(`${prefix} [${event.stage}] ${event.message || event.eventType}`);

  return row;
}

export async function createPipelineRun(admin, triggerType = "cron") {
  const run = {
    id: crypto.randomUUID(),
    trigger_type: triggerType,
    status: "running",
    started_at: new Date().toISOString(),
  };

  if (admin) {
    try {
      const { data } = await admin.from("autonomous_pipeline_runs").insert(run).select().single();
      if (data) return data;
    } catch {
      /* fallback */
    }
  }

  return run;
}

export async function finishPipelineRun(admin, runId, summary) {
  const update = {
    status: summary.errorCount > 0 && summary.itemsPublished === 0 ? "failed" : "completed",
    stages_completed: summary.stagesCompleted || [],
    items_discovered: summary.itemsDiscovered || 0,
    items_published: summary.itemsPublished || 0,
    items_rejected: summary.itemsRejected || 0,
    items_updated: summary.itemsUpdated || 0,
    error_count: summary.errorCount || 0,
    duration_ms: summary.durationMs || 0,
    report: summary.report || {},
    finished_at: new Date().toISOString(),
  };

  if (admin && runId) {
    try {
      await admin.from("autonomous_pipeline_runs").update(update).eq("id", runId);
    } catch {
      /* ignore */
    }
  }

  return update;
}

export async function getRecentEvents(admin, { limit = 50, runId, stage } = {}) {
  if (!admin) return [];

  try {
    let q = admin.from("autonomous_pipeline_events").select("*").order("created_at", { ascending: false }).limit(limit);
    if (runId) q = q.eq("run_id", runId);
    if (stage) q = q.eq("stage", stage);
    const { data } = await q;
    return data || [];
  } catch {
    return [];
  }
}
