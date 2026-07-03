/**
 * Admin API — Telegram Bot + Channel Monitor management.
 *
 * Actions (bot):       status | set-webhook | delete-webhook | test-send | broadcast | subscribers
 * Actions (channels):  channels | add-channel | toggle-channel | delete-channel | sync-now
 * Actions (review):    pending-lessons | approve-lesson | reject-lesson | bulk-approve
 * Actions (stats):     stats
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  getMe,
  getWebhookInfo,
  setWebhook,
  deleteWebhook,
  sendMessage,
  sendBroadcast,
  formatLessonMessage,
} from "../../../lib/telegram/bot.mjs";
import {
  getActiveSubscribers,
  getSubscriberCount,
} from "../../../lib/telegram/subscriber-service.mjs";
import {
  getMonitoredChannels,
  upsertChannel,
  toggleChannel,
  deleteChannel,
  getChannelStats,
} from "../../../lib/telegram/channel-monitor.mjs";
import { processExtractionQueue } from "../../../lib/telegram/queue-processor.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "").trim();

  try {

    // ── Bot status ─────────────────────────────────────────────────────────
    if (action === "status") {
      const [botInfo, webhookInfo, subCount] = await Promise.allSettled([
        getMe(), getWebhookInfo(), getSubscriberCount(),
      ]);
      const channelStats = await getChannelStats();
      sendJson(res, 200, {
        ok: true,
        bot: botInfo.status === "fulfilled" ? botInfo.value?.result : null,
        webhook: webhookInfo.status === "fulfilled" ? webhookInfo.value?.result : null,
        subscribers: subCount.status === "fulfilled" ? subCount.value : 0,
        channels: channelStats,
        tokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
      });
      return;
    }

    if (action === "set-webhook") {
      const { webhookUrl, secret } = body;
      if (!webhookUrl) { sendJson(res, 400, { ok: false, error: "webhookUrl required" }); return; }
      const r = await setWebhook(webhookUrl, secret || process.env.TELEGRAM_WEBHOOK_SECRET);
      sendJson(res, 200, { ok: r.ok, description: r.description });
      return;
    }

    if (action === "delete-webhook") {
      const r = await deleteWebhook();
      sendJson(res, 200, { ok: r.ok });
      return;
    }

    if (action === "subscribers") {
      const list = await getActiveSubscribers();
      sendJson(res, 200, { ok: true, count: list.length, subscribers: list.map(s => ({ chatId: s.chat_id, username: s.username })) });
      return;
    }

    if (action === "broadcast") {
      const { text, lessonPayload } = body;
      const message = text || (lessonPayload ? formatLessonMessage(lessonPayload) : null);
      if (!message) { sendJson(res, 400, { ok: false, error: "text or lessonPayload required" }); return; }
      const subscribers = await getActiveSubscribers();
      if (!subscribers.length) { sendJson(res, 200, { ok: true, sent: 0, message: "no_subscribers" }); return; }
      const results = await sendBroadcast(subscribers.map(s => s.chat_id), message);
      const sent = results.filter(r => r.ok).length;
      sendJson(res, 200, { ok: true, total: subscribers.length, sent, failed: subscribers.length - sent });
      return;
    }

    if (action === "test-send") {
      const { chatId, text } = body;
      if (!chatId || !text) { sendJson(res, 400, { ok: false, error: "chatId and text required" }); return; }
      const r = await sendMessage(Number(chatId), text);
      sendJson(res, 200, { ok: r.ok, messageId: r.result?.message_id, error: r.description });
      return;
    }

    // ── Channel management ──────────────────────────────────────────────────
    if (action === "channels") {
      const channels = await getMonitoredChannels({ activeOnly: false });
      sendJson(res, 200, { ok: true, count: channels.length, channels });
      return;
    }

    if (action === "add-channel") {
      const { channelUsername, autoExtract, autoPublish } = body;
      if (!channelUsername) { sendJson(res, 400, { ok: false, error: "channelUsername required" }); return; }
      const r = await upsertChannel({
        channelUsername,
        config: { autoExtract: autoExtract ?? true, autoPublish: autoPublish ?? false },
      });
      sendJson(res, r.ok ? 200 : 500, r);
      return;
    }

    if (action === "toggle-channel") {
      const { channelUsername, isActive } = body;
      if (!channelUsername) { sendJson(res, 400, { ok: false, error: "channelUsername required" }); return; }
      const r = await toggleChannel(channelUsername, Boolean(isActive));
      sendJson(res, r.ok ? 200 : 500, r);
      return;
    }

    if (action === "delete-channel") {
      const { channelUsername } = body;
      if (!channelUsername) { sendJson(res, 400, { ok: false, error: "channelUsername required" }); return; }
      const r = await deleteChannel(channelUsername);
      sendJson(res, r.ok ? 200 : 500, r);
      return;
    }

    if (action === "sync-now") {
      const batchSize = Number(body.batchSize) || 10;
      const result = await processExtractionQueue({ batchSize });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    // ── Review interface ───────────────────────────────────────────────────
    if (action === "pending-lessons") {
      const admin = getSupabaseAdmin();
      if (!admin) { sendJson(res, 503, { ok: false, error: "no_db" }); return; }

      const page = Number(req.query?.page || body.page) || 1;
      const limit = Math.min(Number(req.query?.limit || body.limit) || 20, 100);
      const offset = (page - 1) * limit;

      const qualityFilter = body.qualityStatus || req.query?.qualityStatus;
      const channelFilter = body.channelUsername || req.query?.channel;

      let q = admin.from("tg_extracted_lessons")
        .select("*, tg_raw_messages(raw_text, raw_caption, channel_username, message_date, photo_file_ids)")
        .eq("review_status", "pending")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (qualityFilter) q = q.eq("quality_status", qualityFilter);

      const { data, error, count } = await q;
      if (error) throw error;

      sendJson(res, 200, { ok: true, lessons: data || [], page, limit, total: count });
      return;
    }

    if (action === "approve-lesson") {
      const { lessonId } = body;
      if (!lessonId) { sendJson(res, 400, { ok: false, error: "lessonId required" }); return; }
      const admin = getSupabaseAdmin();
      const { error } = await admin.from("tg_extracted_lessons").update({
        review_status: "approved",
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", lessonId);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    if (action === "reject-lesson") {
      const { lessonId, reason } = body;
      if (!lessonId) { sendJson(res, 400, { ok: false, error: "lessonId required" }); return; }
      const admin = getSupabaseAdmin();
      const { error } = await admin.from("tg_extracted_lessons").update({
        review_status: "rejected",
        reject_reason: reason || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", lessonId);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    if (action === "bulk-approve") {
      const { lessonIds } = body;
      if (!Array.isArray(lessonIds) || !lessonIds.length) {
        sendJson(res, 400, { ok: false, error: "lessonIds[] required" }); return;
      }
      const admin = getSupabaseAdmin();
      const { error } = await admin.from("tg_extracted_lessons").update({
        review_status: "approved",
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).in("id", lessonIds);
      if (error) throw error;
      sendJson(res, 200, { ok: true, approved: lessonIds.length });
      return;
    }

    if (action === "update-lesson") {
      const { lessonId, updates } = body;
      if (!lessonId || !updates) { sendJson(res, 400, { ok: false, error: "lessonId and updates required" }); return; }
      const admin = getSupabaseAdmin();
      const safe = Object.fromEntries(
        Object.entries(updates).filter(([k]) =>
          ["title","sheikh_name","category","event_date","event_day","event_time","mosque","area","city","governorate","country","stream_url","location_url","contact","organizer","co_organizer","has_womens_section","description"].includes(k)
        )
      );
      safe.updated_at = new Date().toISOString();
      const { error } = await admin.from("tg_extracted_lessons").update(safe).eq("id", lessonId);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    // ── Stats ──────────────────────────────────────────────────────────────
    if (action === "stats") {
      const admin = getSupabaseAdmin();
      if (!admin) { sendJson(res, 503, { ok: false }); return; }

      const [channels, rawMsgs, lessons] = await Promise.all([
        admin.from("tg_monitored_channels").select("total_messages, total_lessons, total_duplicates, total_rejected, channel_username, last_message_at, is_active"),
        admin.from("tg_raw_messages").select("extraction_status"),
        admin.from("tg_extracted_lessons").select("quality_status, review_status, category, sheikh_name"),
      ]);

      const rawData = rawMsgs.data || [];
      const lessonData = lessons.data || [];

      // Aggregate
      const byExtrStatus = rawData.reduce((a, m) => { a[m.extraction_status] = (a[m.extraction_status] || 0) + 1; return a; }, {});
      const byQuality = lessonData.reduce((a, l) => { a[l.quality_status] = (a[l.quality_status] || 0) + 1; return a; }, {});
      const byReview = lessonData.reduce((a, l) => { a[l.review_status] = (a[l.review_status] || 0) + 1; return a; }, {});
      const byCategory = lessonData.reduce((a, l) => { if (l.category) a[l.category] = (a[l.category] || 0) + 1; return a; }, {});
      const sheikhs = lessonData.reduce((a, l) => { if (l.sheikh_name) a[l.sheikh_name] = (a[l.sheikh_name] || 0) + 1; return a; }, {});
      const topSheikhs = Object.entries(sheikhs).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, c]) => ({ name: n, count: c }));

      sendJson(res, 200, {
        ok: true,
        channels: {
          total: (channels.data || []).length,
          active: (channels.data || []).filter(c => c.is_active).length,
          list: (channels.data || []).sort((a, b) => (b.total_messages || 0) - (a.total_messages || 0)),
        },
        rawMessages: { total: rawData.length, byStatus: byExtrStatus },
        extractedLessons: { total: lessonData.length, byQuality, byReview, byCategory, topSheikhs },
        successRate: rawData.length > 0 ? Math.round(((byExtrStatus.done || 0) / rawData.length) * 100) : 0,
      });
      return;
    }

    // ── Raw message search ─────────────────────────────────────────────────
    if (action === "search") {
      const admin = getSupabaseAdmin();
      if (!admin) { sendJson(res, 503, { ok: false }); return; }
      const { q: query, sheikh, mosque, city, category, dateFrom, dateTo } = { ...body, ...Object.fromEntries(new URLSearchParams(req.url?.split("?")[1] || "")) };
      const limit = 20;
      let dbq = admin.from("tg_extracted_lessons").select("*").order("created_at", { ascending: false }).limit(limit);
      if (sheikh) dbq = dbq.ilike("sheikh_name", `%${sheikh}%`);
      if (mosque) dbq = dbq.ilike("mosque", `%${mosque}%`);
      if (city) dbq = dbq.ilike("city", `%${city}%`);
      if (category) dbq = dbq.eq("category", category);
      if (dateFrom) dbq = dbq.gte("event_date", dateFrom);
      if (dateTo) dbq = dbq.lte("event_date", dateTo);
      if (query) dbq = dbq.or(`title.ilike.%${query}%,description.ilike.%${query}%,sheikh_name.ilike.%${query}%`);
      const { data, error } = await dbq;
      if (error) throw error;
      sendJson(res, 200, { ok: true, results: data || [], count: data?.length || 0 });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (err) {
    console.error("[admin/telegram]", err.message);
    sendJson(res, 500, { ok: false, error: err.message });
  }
}
