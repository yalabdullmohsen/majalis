/**
 * Auto Update — detect and apply changes to existing lessons from source re-scan.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { publishLessonDraft } from "../cms/publish-lesson.mjs";
import { writeLessonHistory } from "../cms/lesson-history.mjs";
import { logAutomationStep } from "../cms/automation-step-logs.mjs";

const TRACKED_FIELDS = [
  "title", "speaker_name", "mosque", "lesson_time", "start_date",
  "day_of_week", "live_url", "region", "city", "description",
];

export function detectContentChanges(existing, incoming) {
  const changes = [];
  for (const field of TRACKED_FIELDS) {
    const oldVal = normalizeVal(existing?.[field]);
    const newVal = normalizeVal(incoming?.[field] ?? incoming?.[field === "speaker_name" ? "sheikh_name" : field]);
    if (oldVal && newVal && oldVal !== newVal) {
      changes.push({ field, old: oldVal, new: newVal });
    }
  }
  return changes;
}

function normalizeVal(v) {
  if (v == null) return "";
  return String(v).trim().replace(/\s+/g, " ");
}

export async function applyContentUpdate({ lessonId, existing, parsed, sourceUrl, sourceId, runId }) {
  const admin = getSupabaseAdmin();
  if (!admin || !lessonId) return { ok: false, error: "missing_lesson" };

  const changes = detectContentChanges(existing, parsed);
  if (!changes.length) return { ok: true, updated: false, changes: [] };

  const isCancelled = changes.some((c) =>
    c.field === "title" && /(إلغاء|cancel|postponed|تأجيل)/i.test(c.new),
  );

  const updatePayload = {};
  for (const ch of changes) {
    updatePayload[ch.field] = ch.new;
  }
  updatePayload.updated_at = new Date().toISOString();

  if (isCancelled) {
    updatePayload.status = "archived";
    updatePayload.archive_reason = "cancelled_at_source";
  }

  const { data, error } = await admin
    .from("lessons")
    .update(updatePayload)
    .eq("id", lessonId)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  await writeLessonHistory({
    lessonId,
    sourceId,
    sourceUrl,
    action: isCancelled ? "archive" : "update",
    reason: changes.map((c) => `${c.field}: ${c.old} → ${c.new}`).join("; "),
    parsed,
  });

  await logAutomationStep({
    runId,
    sourceId,
    lessonId,
    step: "update",
    status: "ok",
    detail: isCancelled ? "lesson_cancelled" : "lesson_updated",
    metadata: { changes },
  });

  if (admin) {
    try {
      await admin.from("mke_change_log").insert({
        lesson_id: lessonId,
        source_id: sourceId,
        source_url: sourceUrl,
        change_type: isCancelled ? "cancelled" : "updated",
        changes,
        metadata: { fields: changes.map((c) => c.field) },
      });
    } catch {
      /* optional */
    }
  }

  return { ok: true, updated: true, changes, lesson: data, cancelled: isCancelled };
}

export async function findExistingLessonBySourceUrl(sourceUrl) {
  const admin = getSupabaseAdmin();
  if (!admin || !sourceUrl) return null;
  const { data } = await admin
    .from("lessons")
    .select("*")
    .eq("source_url", sourceUrl)
    .maybeSingle();
  return data;
}
