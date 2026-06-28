/**
 * Archive verify-production-lesson after real content is published.
 * Soft-archive only — preserves audit trail, knowledge_items, and analytics rows.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";

const VERIFY_SLUG = "verify-production-lesson";
const VERIFY_EXTERNAL_PREFIX = "verify-production-lesson:";

export async function countRealPublishedLessons(admin) {
  const { count, error } = await admin
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .like("external_key", "kuwait-lessons:%");
  if (error) throw error;
  return count || 0;
}

export async function archiveVerificationContent(options = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const minRealLessons = options.minRealLessons ?? 1;
  const realCount = await countRealPublishedLessons(admin);
  if (realCount < minRealLessons && !options.force) {
    return {
      ok: false,
      skipped: true,
      reason: "insufficient_real_lessons",
      realCount,
      required: minRealLessons,
    };
  }

  const at = new Date().toISOString();
  const report = { at, realCount, lesson: null, knowledgeItem: null, connector: null };

  const { data: lesson } = await admin
    .from("lessons")
    .select("id, title, external_key, status")
    .like("external_key", `${VERIFY_EXTERNAL_PREFIX}%`)
    .maybeSingle();

  if (lesson?.id) {
    const { error } = await admin
      .from("lessons")
      .update({ status: "archived", updated_at: at })
      .eq("id", lesson.id);
    if (error) throw error;
    report.lesson = { id: lesson.id, external_key: lesson.external_key, from: lesson.status, to: "archived" };
  }

  const { data: ki } = await admin
    .from("knowledge_items")
    .select("id, external_id, publish_status")
    .like("external_id", `${VERIFY_EXTERNAL_PREFIX}%`)
    .maybeSingle();

  if (ki?.id) {
    const { error } = await admin
      .from("knowledge_items")
      .update({
        publish_status: "archived",
        pipeline_stage: "archived",
        updated_at: at,
      })
      .eq("id", ki.id);
    if (error) throw error;
    report.knowledgeItem = { id: ki.id, external_id: ki.external_id, from: ki.publish_status, to: "archived" };
  }

  const { data: connector } = await admin
    .from("ake_connectors")
    .select("id, slug, is_active, auto_publish")
    .eq("slug", VERIFY_SLUG)
    .maybeSingle();

  if (connector?.id) {
    const { error } = await admin
      .from("ake_connectors")
      .update({
        is_active: false,
        auto_publish: false,
        last_error: "archived_after_real_content_verified",
        updated_at: at,
      })
      .eq("id", connector.id);
    if (error) throw error;
    report.connector = {
      id: connector.id,
      slug: connector.slug,
      is_active: false,
      auto_publish: false,
    };
  }

  try {
    await admin.from("ake_audit_log").insert({
      action: "archive_verification_content",
      status: "success",
      message: `Archived verification fixture; ${realCount} real kuwait-lessons active`,
      details: report,
    });
  } catch {
    /* optional table */
  }

  return { ok: true, archived: true, report };
}
