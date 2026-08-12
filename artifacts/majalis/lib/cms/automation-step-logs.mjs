/**
 * Phase 5 — per-step automation logging.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function logAutomationStep({
  runId,
  sourceId,
  draftId,
  lessonId,
  step,
  status = "ok",
  detail,
  metadata = {},
  durationMs,
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  try {
    await admin.from("automation_step_logs").insert({
      run_id: runId || null,
      source_id: sourceId || null,
      draft_id: draftId || null,
      lesson_id: lessonId || null,
      step,
      status,
      detail: detail ? String(detail).slice(0, 2000) : null,
      metadata,
      duration_ms: durationMs ?? null,
    });
  } catch {
    /* table may not exist yet */
  }
}

export async function listAutomationStepLogs({ sourceId, runId, limit = 50 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  try {
    let q = admin.from("automation_step_logs").select("*").order("created_at", { ascending: false }).limit(limit);
    if (sourceId) q = q.eq("source_id", sourceId);
    if (runId) q = q.eq("run_id", runId);
    const { data } = await q;
    return data || [];
  } catch {
    return [];
  }
}
