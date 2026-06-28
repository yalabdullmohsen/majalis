/**
 * Pipeline failure tracking — per-stage failures across AKE and content engines.
 */

import { getSupabaseAdmin, isMissingTableError } from "../../supabase-admin.mjs";
import { createAkeAlert } from "../alerts.mjs";
import { akeLog } from "../monitoring.mjs";

export async function recordPipelineFailure({
  runId,
  engineName = "ake",
  stage,
  sourceId,
  itemId,
  errorCode,
  errorMessage,
  retryCount = 0,
  metadata = {},
}) {
  if (!stage || !errorMessage) return null;

  const admin = getSupabaseAdmin();
  const payload = {
    run_id: runId || null,
    engine_name: engineName,
    stage,
    source_id: sourceId || null,
    item_id: itemId || null,
    error_code: errorCode || null,
    error_message: String(errorMessage).slice(0, 4000),
    retry_count: retryCount,
    status: "open",
    metadata,
  };

  if (!admin) {
    akeLog("pipeline-failure", payload, "error");
    return null;
  }

  try {
    const { data, error } = await admin.from("ake_pipeline_failures").insert(payload).select("id").single();
    if (error) throw error;

    if (stage === "publish" || stage === "insert") {
      await createAkeAlert({
        type: stage === "publish" ? "publish_stage_failed" : "database_write_failed",
        severity: "critical",
        title: stage === "publish" ? "فشل مرحلة النشر" : "فشل كتابة قاعدة البيانات",
        message: errorMessage,
        dedupeKey: `pipeline:${engineName}:${stage}:${sourceId || "global"}`,
        sourceId,
        runId,
        metadata: { stage, errorCode, itemId, ...metadata },
      });
    }

    return data?.id;
  } catch (err) {
    if (!isMissingTableError(err)) akeLog("pipeline-failure", { error: err.message }, "error");
    return null;
  }
}

export async function resolvePipelineFailures({ engineName, stage, sourceId } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;

  try {
    let q = admin
      .from("ake_pipeline_failures")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("status", "open");
    if (engineName) q = q.eq("engine_name", engineName);
    if (stage) q = q.eq("stage", stage);
    if (sourceId) q = q.eq("source_id", sourceId);
    const { data } = await q.select("id");
    return (data || []).length;
  } catch {
    return 0;
  }
}

export async function getOpenPipelineFailures(limit = 50) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    const { data } = await admin
      .from("ake_pipeline_failures")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}
