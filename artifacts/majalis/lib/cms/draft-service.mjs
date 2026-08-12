/**
 * Smart CMS draft persistence (server-side).
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function createContentDraft({
  contentKind = "lesson",
  sourceType,
  sourceUrl,
  imageUrl,
  rawText,
  extracted,
  aiSuggestions,
  validation,
  matchedSheikhId,
  proposedSheikh,
  createdBy,
  metadata = {},
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const { data, error } = await admin
    .from("content_drafts")
    .insert({
      content_kind: contentKind,
      source_type: sourceType,
      source_url: sourceUrl || null,
      image_url: imageUrl || null,
      raw_text: rawText || null,
      extracted_data: extracted || {},
      ai_suggestions: aiSuggestions || [],
      validation_errors: validation?.errors || [],
      validation_warnings: validation?.warnings || [],
      matched_sheikh_id: matchedSheikhId || null,
      proposed_sheikh: proposedSheikh || null,
      workflow_status: "pending",
      created_by: createdBy || null,
      metadata,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, draft: data };
}

export async function listPendingDrafts({ limit = 50, status = "pending" } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("content_drafts")
    .select("*")
    .eq("workflow_status", status)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function updateDraftStatus(id, status, userId) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false };
  const payload = {
    workflow_status: status,
    updated_at: new Date().toISOString(),
  };
  if (status === "approved" || status === "published") {
    payload.reviewed_by = userId;
    payload.reviewed_at = new Date().toISOString();
    payload.published_at = new Date().toISOString();
  }
  const { error } = await admin.from("content_drafts").update(payload).eq("id", id);
  return { ok: !error, error: error?.message };
}

export async function getDraftById(id) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.from("content_drafts").select("*").eq("id", id).maybeSingle();
  return data;
}
