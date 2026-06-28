/**
 * Persist AKE rejections to ake_rejection_log (v18 schema).
 */

import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";

/**
 * @param {object} entry
 */
export async function logAkeRejection(entry) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, skipped: true, reason: "no_admin" };

  const row = {
    run_id: entry.runId || null,
    source_id: entry.sourceId || null,
    connector_slug: entry.connectorSlug || null,
    external_id: entry.externalId || null,
    content_kind: entry.contentKind || null,
    pipeline_stage: entry.pipelineStage || "publish",
    rejection_reason: entry.reason || "unknown",
    confidence_score: entry.confidenceScore ?? null,
    error_code: entry.errorCode || null,
    source_url: entry.sourceUrl || null,
    metadata: entry.metadata || {},
  };

  try {
    const { error } = await admin.from("ake_rejection_log").insert(row);
    if (error) {
      if (isMissingTableError(error)) return { ok: false, skipped: true, reason: "table_missing" };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}
