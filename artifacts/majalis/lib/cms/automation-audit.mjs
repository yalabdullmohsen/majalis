/**
 * Audit log for lesson automation decisions.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function writeAutomationAudit({
  sourceId,
  sourceUrl,
  extractedText,
  parsedPayload,
  confidenceScore,
  decision,
  reason,
  lessonId,
  draftId,
  imageHash,
  similarityScore,
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const { data, error } = await admin
    .from("lesson_automation_audit")
    .insert({
      source_id: sourceId || null,
      source_url: sourceUrl,
      extracted_text: extractedText || null,
      parsed_payload: parsedPayload || {},
      confidence_score: confidenceScore ?? null,
      decision,
      reason: reason || null,
      lesson_id: lessonId || null,
      draft_id: draftId || null,
      image_hash: imageHash || null,
      similarity_score: similarityScore ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, record: data };
}

export async function listAutomationAudit({ decision, limit = 50, sourceId } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  let q = admin.from("lesson_automation_audit").select("*").order("created_at", { ascending: false }).limit(limit);
  if (decision) q = q.eq("decision", decision);
  if (sourceId) q = q.eq("source_id", sourceId);
  const { data } = await q;
  return data || [];
}
