/**
 * Notification Platform — multi-channel delivery via DB queue.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { notifyAdminsNewDrafts } from "../cms/automation-notifications.mjs";
import { sendBroadcast, formatLessonMessage } from "../telegram/bot.mjs";
import { getActiveSubscribers, logMessage as logTelegramMessage } from "../telegram/subscriber-service.mjs";

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

  // Telegram — direct delivery (no queue needed; broadcast is fast)
  if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
      const subscribers = await getActiveSubscribers();
      if (subscribers.length > 0) {
        const text = formatLessonMessage({
          title: lesson?.title,
          sheikh: lesson?.speaker_name,
          mosque: lesson?.mosque,
          url: lesson?.id ? `${process.env.VITE_APP_URL || "https://majalisilm.com"}/lessons/${lesson.id}` : null,
        });
        const chatIds = subscribers.map((s) => s.chat_id);
        const broadcastResults = await sendBroadcast(chatIds, text);
        let tgSent = 0;
        for (const br of broadcastResults) {
          await logTelegramMessage(br.chatId, text, br.ok ? "sent" : "error", br.messageId || null, br.error || null);
          if (br.ok) tgSent++;
        }
        results.push({ channel: "telegram", ok: true, sent: tgSent, total: subscribers.length });
      } else {
        results.push({ channel: "telegram", ok: true, sent: 0, message: "no_subscribers" });
      }
    } catch (err) {
      results.push({ channel: "telegram", ok: false, error: err.message });
    }
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
    let sent = job.channel === "web" || job.channel === "rss";
    let jobError = sent ? null : "channel_requires_external_integration";

    if (job.channel === "telegram" && process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const subscribers = await getActiveSubscribers();
        if (subscribers.length > 0) {
          const text = formatLessonMessage({
            title: job.payload?.title,
            sheikh: job.payload?.sheikh,
            mosque: job.payload?.mosque,
            url: job.payload?.url || null,
          });
          const chatIds = subscribers.map((s) => s.chat_id);
          const results = await sendBroadcast(chatIds, text);
          for (const br of results) {
            await logTelegramMessage(br.chatId, text, br.ok ? "sent" : "error", br.messageId || null, br.error || null);
          }
        }
        sent = true;
        jobError = null;
      } catch (err) {
        jobError = err.message;
      }
    }

    await admin.from("mke_notification_jobs").update({
      status: sent ? "sent" : "skipped",
      sent_at: sent ? new Date().toISOString() : null,
      error: jobError,
    }).eq("id", job.id);
    if (sent) processed += 1;
  }

  return { processed, pending: jobs.length - processed };
}

export { CHANNELS };
