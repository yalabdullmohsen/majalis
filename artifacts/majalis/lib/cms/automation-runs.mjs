/**
 * automation_runs — batch telemetry for source monitoring.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function startAutomationRun({ runType = "source_monitor", sourceId = null, metadata = {} } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, runId: null };

  const { data, error } = await admin
    .from("automation_runs")
    .insert({
      run_type: runType,
      source_id: sourceId,
      status: "running",
      metadata,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message, runId: null };
  return { ok: true, runId: data.id, startedAt: Date.now() };
}

export async function finishAutomationRun(runId, stats = {}) {
  const admin = getSupabaseAdmin();
  if (!admin || !runId) return;

  const startedAt = stats.startedAt || Date.now();
  await admin
    .from("automation_runs")
    .update({
      items_scanned: stats.itemsScanned ?? 0,
      items_new: stats.itemsNew ?? 0,
      items_duplicate: stats.itemsDuplicate ?? 0,
      items_skipped: stats.itemsSkipped ?? 0,
      items_errors: stats.itemsErrors ?? 0,
      duration_ms: stats.durationMs ?? Math.max(0, Date.now() - startedAt),
      status: stats.status || "completed",
      error_message: stats.errorMessage || null,
      metadata: stats.metadata || {},
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

export async function listAutomationRuns({ limit = 20 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("automation_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return data || [];
}
