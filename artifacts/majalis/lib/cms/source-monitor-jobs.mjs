/**
 * Per-source monitor jobs (Phase 5 — 15-min default).
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const DEFAULT_INTERVAL = 15;

export async function registerSourceMonitorJob(sourceId, { intervalMinutes = DEFAULT_INTERVAL } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin || !sourceId) return { ok: false };

  const nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString();

  try {
    const { data, error } = await admin
      .from("source_monitor_jobs")
      .upsert(
        {
          source_id: sourceId,
          interval_minutes: intervalMinutes,
          active: true,
          next_run_at: nextRun,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "source_id" },
      )
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, job: data };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

export async function touchSourceMonitorJob(sourceId, { itemsProcessed = 0 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin || !sourceId) return;

  const now = new Date().toISOString();
  try {
    const { data } = await admin.from("source_monitor_jobs").select("interval_minutes, items_processed").eq("source_id", sourceId).maybeSingle();
    const interval = data?.interval_minutes || DEFAULT_INTERVAL;
    const nextRun = new Date(Date.now() + interval * 60 * 1000).toISOString();

    await admin
      .from("source_monitor_jobs")
      .update({
        last_run_at: now,
        next_run_at: nextRun,
        items_processed: (data?.items_processed || 0) + itemsProcessed,
        updated_at: now,
      })
      .eq("source_id", sourceId);
  } catch {
    /* jobs table optional */
  }
}

export async function listSourceMonitorJobs() {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    const { data } = await admin.from("source_monitor_jobs").select("*").order("updated_at", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}
