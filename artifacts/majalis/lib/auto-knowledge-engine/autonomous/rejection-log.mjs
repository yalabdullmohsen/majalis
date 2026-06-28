/**
 * Structured rejection logging — every rejection includes reason, confidence, stage.
 */

import { getSupabaseAdmin, isMissingTableError } from "../../supabase-admin.mjs";
import { akeLog } from "../monitoring.mjs";

export async function logRejection({
  runId,
  sourceId,
  connectorSlug,
  externalId,
  contentKind,
  pipelineStage,
  rejectionReason,
  confidenceScore,
  errorCode,
  sourceUrl,
  metadata = {},
}) {
  const admin = getSupabaseAdmin();
  const row = {
    run_id: runId || null,
    source_id: sourceId || null,
    connector_slug: connectorSlug || null,
    external_id: externalId || null,
    content_kind: contentKind || null,
    pipeline_stage: pipelineStage || "unknown",
    rejection_reason: String(rejectionReason || "rejected").slice(0, 500),
    confidence_score: confidenceScore ?? null,
    error_code: errorCode || null,
    source_url: sourceUrl || null,
    metadata,
  };

  if (!admin) {
    akeLog("rejection", row);
    return null;
  }

  try {
    const { data } = await admin.from("ake_rejection_log").insert(row).select("id").single();
    return data?.id;
  } catch (err) {
    if (!isMissingTableError(err)) akeLog("rejection", { error: err.message }, "error");
    return null;
  }
}

export async function getRecentRejections(limit = 50, { since } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    let q = admin.from("ake_rejection_log").select("*").order("created_at", { ascending: false }).limit(limit);
    if (since) q = q.gte("created_at", since);
    const { data } = await q;
    return data || [];
  } catch {
    return [];
  }
}

export async function getTopRejectionReasons(since, limit = 10) {
  const rejections = await getRecentRejections(500, { since });
  const counts = {};
  for (const r of rejections) {
    const key = r.error_code || r.rejection_reason || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([reason, count]) => ({ reason, count }));
}
