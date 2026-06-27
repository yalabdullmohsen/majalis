/**
 * lesson_import_drafts persistence (image/url lesson import workflow).
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function createLessonImportDraft({
  sourceType = "image",
  sourceUrl,
  imageUrl,
  extractedText,
  parsedPayload = {},
  confidenceScore,
  warnings = [],
  missingFields = [],
  matchedSheikhId,
  suggestedSheikh,
  notes,
  createdBy,
  status = "needs_review",
  sourceId,
  automationStatus = "manual",
  decisionReason,
  imageHash,
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const { data, error } = await admin
    .from("lesson_import_drafts")
    .insert({
      source_type: sourceType,
      source_url: sourceUrl || null,
      image_url: imageUrl || null,
      extracted_text: extractedText || null,
      parsed_payload: parsedPayload,
      confidence_score: confidenceScore ?? null,
      status,
      warnings,
      missing_fields: missingFields,
      matched_sheikh_id: matchedSheikhId || null,
      suggested_sheikh: suggestedSheikh || null,
      notes: notes || null,
      created_by: createdBy || null,
      source_id: sourceId || null,
      automation_status: automationStatus,
      decision_reason: decisionReason || null,
      image_hash: imageHash || null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, draft: data };
}

export async function getLessonImportDraft(id) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.from("lesson_import_drafts").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function listLessonImportDrafts({ status, limit = 50 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  let q = admin.from("lesson_import_drafts").select("*").order("created_at", { ascending: false }).limit(limit);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return data || [];
}

export async function updateLessonImportDraft(id, patch) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const { data, error } = await admin
    .from("lesson_import_drafts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, draft: data };
}

export async function setLessonImportDraftStatus(id, status, { reviewedBy, approvedLessonId } = {}) {
  const patch = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (reviewedBy) patch.reviewed_by = reviewedBy;
  if (approvedLessonId) patch.approved_lesson_id = approvedLessonId;
  if (status === "approved" || status === "rejected") {
    patch.reviewed_by = reviewedBy || patch.reviewed_by;
  }
  return updateLessonImportDraft(id, patch);
}

function urlCandidates(normalizedUrl) {
  const base = String(normalizedUrl || "").trim();
  if (!base) return [];
  const withSlash = base.endsWith("/") ? base : `${base}/`;
  const withoutSlash = base.endsWith("/") ? base.slice(0, -1) : base;
  return [...new Set([base, withSlash, withoutSlash])];
}

export async function findDuplicateSourceUrl(sourceUrl) {
  const admin = getSupabaseAdmin();
  if (!admin || !sourceUrl) return null;

  const candidates = urlCandidates(sourceUrl);

  const { data: drafts } = await admin
    .from("lesson_import_drafts")
    .select("id, status, source_url, created_at")
    .in("source_url", candidates)
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(1);

  let lesson = null;
  try {
    const { data: lessonsBySource } = await admin
      .from("lessons")
      .select("id, title, source_url, website_url")
      .in("source_url", candidates)
      .limit(1);
    lesson = lessonsBySource?.[0] || null;
  } catch {
    // source_url column may be missing on older schemas
  }

  if (!lesson) {
    const { data: lessonsByWeb } = await admin
      .from("lessons")
      .select("id, title, website_url")
      .in("website_url", candidates)
      .limit(1);
    lesson = lessonsByWeb?.[0] || null;
  }

  return {
    draft: drafts?.[0] || null,
    lesson,
    isDuplicate: Boolean(drafts?.[0] || lesson),
  };
}
