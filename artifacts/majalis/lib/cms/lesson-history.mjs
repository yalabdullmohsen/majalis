/**
 * Record lesson history + archive when source post removed.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { logAutomationStep } from "./automation-step-logs.mjs";

export async function writeLessonHistory({ lessonId, sourceId, sourceUrl, action, reason, parsedPayload, imageUrl }) {
  const admin = getSupabaseAdmin();
  if (!admin || !lessonId) return;

  try {
    await admin.from("lesson_content_history").insert({
      lesson_id: lessonId,
      source_id: sourceId || null,
      source_url: sourceUrl || null,
      action,
      reason: reason || null,
      parsed_payload: parsedPayload || {},
      image_url: imageUrl || null,
    });
  } catch {
    /* table may not exist */
  }
}

export async function archiveLessonBySource({ lessonId, sourceId, reason, runId }) {
  const admin = getSupabaseAdmin();
  if (!admin || !lessonId) return { ok: false };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("lessons")
    .update({
      archived_at: now,
      archive_reason: reason || "source_post_removed",
      updated_at: now,
    })
    .eq("id", lessonId);

  if (error) return { ok: false, error: error.message };

  await admin
    .from("cms_content_index")
    .update({ archived_at: now, workflow_status: "archived", updated_at: now })
    .eq("record_table", "lessons")
    .eq("record_id", lessonId);

  await writeLessonHistory({
    lessonId,
    sourceId,
    action: "archive",
    reason,
  });

  await logAutomationStep({ runId, sourceId, lessonId, step: "archive", status: "ok", detail: reason });
  return { ok: true };
}

/** Compare previous discovery snapshot with current connector output (not cumulative seen URLs). */
export function detectRemovedSourcePosts(source, discoveredUrls) {
  const previous = source.config?.last_discovered_urls || [];
  const current = new Set((discoveredUrls || []).filter(Boolean));
  return previous.filter((url) => url && !current.has(url));
}
