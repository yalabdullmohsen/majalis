/**
 * Lesson expiry — archive past lessons and link recordings when available.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { logAutomationStep } from "../cms/automation-step-logs.mjs";
import { writeLessonHistory } from "../cms/lesson-history.mjs";

export async function archiveExpiredLessons({ runId, graceHours = 6 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, archived: 0, error: "supabase_admin_missing" };

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - graceHours);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const { data: expired, error } = await admin
    .from("lessons")
    .select("id, title, start_date, status, source_url")
    .eq("status", "approved")
    .not("start_date", "is", null)
    .lt("start_date", cutoffDate)
    .limit(100);

  if (error) return { ok: false, archived: 0, error: error.message };

  let archived = 0;
  for (const lesson of expired || []) {
    const { error: updErr } = await admin
      .from("lessons")
      .update({
        status: "archived",
        archive_reason: "lesson_date_passed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lesson.id);

    if (updErr) continue;
    archived += 1;

    await writeLessonHistory({
      lessonId: lesson.id,
      sourceUrl: lesson.source_url,
      action: "archive",
      reason: "expired_after_start_date",
      parsed: { start_date: lesson.start_date },
    });

    await logAutomationStep({
      runId,
      lessonId: lesson.id,
      step: "expire",
      status: "ok",
      detail: "archived_expired_lesson",
    });

    try {
      await admin.from("mke_change_log").insert({
        lesson_id: lesson.id,
        change_type: "expired",
        changes: [{ field: "status", old: "approved", new: "archived" }],
        metadata: { start_date: lesson.start_date },
      });
    } catch {
      /* optional */
    }
  }

  return { ok: true, archived, scanned: (expired || []).length };
}

export async function linkPostLessonMedia({ lessonId, recordingUrl, audioUrl, videoUrl, transcriptUrl, summary }) {
  const admin = getSupabaseAdmin();
  if (!admin || !lessonId) return { ok: false };

  const payload = {};
  if (recordingUrl) payload.live_url = recordingUrl;
  if (videoUrl) payload.video_url = videoUrl;
  if (audioUrl) payload.audio_url = audioUrl;

  const { error } = await admin.from("lessons").update({
    ...payload,
    metadata: {
      recording_url: recordingUrl,
      audio_url: audioUrl,
      video_url: videoUrl,
      transcript_url: transcriptUrl,
      summary,
    },
    updated_at: new Date().toISOString(),
  }).eq("id", lessonId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
