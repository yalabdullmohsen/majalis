/**
 * Unified review queue for content engines.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function enqueueReview({
  engineId,
  runId,
  item,
  reason,
  reasonDetail,
  sourceType,
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, reason: "no_admin" };

  const { data, error } = await admin
    .from("content_engine_review_queue")
    .insert({
      engine_id: engineId,
      run_id: runId || null,
      source_type: sourceType || null,
      source_url: item?.source_url || null,
      source_name: item?.source_name || null,
      title: item?.title || null,
      payload: item || {},
      reason,
      reason_detail: reasonDetail || null,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}

export async function listPendingReviews({ limit = 50, engineId } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  let q = admin
    .from("content_engine_review_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (engineId) q = q.eq("engine_id", engineId);

  const { data } = await q;
  return data || [];
}

export async function resolveReview(reviewId, { status, resolvedBy }) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false };

  const { error } = await admin
    .from("content_engine_review_queue")
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy || null,
    })
    .eq("id", reviewId);

  return { ok: !error, error: error?.message };
}

export async function countPendingReviews() {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;
  const { count } = await admin
    .from("content_engine_review_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  return count || 0;
}
