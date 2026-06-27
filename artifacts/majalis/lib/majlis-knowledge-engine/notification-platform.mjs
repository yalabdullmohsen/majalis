/**
 * Notification Platform — multi-channel delivery via DB queue.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { notifyAdminsNewDrafts } from "../cms/automation-notifications.mjs";

const CHANNELS = ["push", "email", "telegram", "whatsapp", "rss", "web", "mobile"];

export async function enqueueNotification({
  channel,
  userId,
  lessonId,
  payload,
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, local: true };

  if (!CHANNELS.includes(channel)) {
    return { ok: false, error: "unsupported_channel" };
  }

  try {
    const { data, error } = await admin.from("mke_notification_jobs").insert({
      channel,
      user_id: userId || null,
      lesson_id: lessonId || null,
      payload: payload || {},
      status: "pending",
    }).select("id").single();
    if (error) throw error;
    return { ok: true, jobId: data.id };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

export async function notifyLessonPublished({ lesson, source, userIds = [] }) {
  const results = [];

  await notifyAdminsNewDrafts({
    newCount: 1,
    sourceName: source?.source_name || lesson?.speaker_name,
    link: lesson?.id ? `/lessons/${lesson.id}` : "/admin/review-center",
  });
  results.push({ channel: "web", ok: true });

  for (const channel of ["push", "mobile"]) {
    const r = await enqueueNotification({
      channel,
      lessonId: lesson?.id,
      payload: {
        title: lesson?.title,
        sheikh: lesson?.speaker_name,
        mosque: lesson?.mosque,
        type: "lesson_published",
      },
    });
    results.push({ channel, ...r });
  }

  if (process.env.NOTIFICATION_API_URL && process.env.NOTIFICATION_SECRET) {
    try {
      const res = await fetch(`${process.env.NOTIFICATION_API_URL}/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NOTIFICATION_SECRET}`,
        },
        body: JSON.stringify({
          title: lesson?.title || "درس جديد",
          body: `${lesson?.speaker_name || ""} — ${lesson?.mosque || ""}`.trim(),
          data: { lessonId: lesson?.id },
          userIds,
        }),
        signal: AbortSignal.timeout(8000),
      });
      results.push({ channel: "push_api", ok: res.ok, status: res.status });
    } catch (err) {
      results.push({ channel: "push_api", ok: false, error: err.message });
    }
  }

  return { ok: true, results };
}

export async function processNotificationQueue({ batchSize = 10 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { processed: 0 };

  let jobs;
  try {
    const q = await admin
      .from("mke_notification_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(batchSize);
    jobs = q.data || [];
  } catch {
    return { processed: 0, skipped: true };
  }

  let processed = 0;
  for (const job of jobs) {
    const sent = job.channel === "web" || job.channel === "rss";
    await admin.from("mke_notification_jobs").update({
      status: sent ? "sent" : "skipped",
      sent_at: sent ? new Date().toISOString() : null,
      error: sent ? null : "channel_requires_external_integration",
    }).eq("id", job.id);
    if (sent) processed += 1;
  }

  return { processed, pending: jobs.length - processed };
}

export { CHANNELS };
