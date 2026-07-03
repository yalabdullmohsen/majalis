/**
 * Admin API — Telegram Bot management.
 * Actions: status, set-webhook, delete-webhook, test-send, broadcast, subscribers
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

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "").trim();

  try {
    if (action === "status") {
      const [botInfo, webhookInfo, subscriberCount] = await Promise.allSettled([
        getMe(),
        getWebhookInfo(),
        getSubscriberCount(),
      ]);
      sendJson(res, 200, {
        ok: true,
        bot: botInfo.status === "fulfilled" ? botInfo.value?.result : null,
        webhook: webhookInfo.status === "fulfilled" ? webhookInfo.value?.result : null,
        subscribers: subscriberCount.status === "fulfilled" ? subscriberCount.value : 0,
        tokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      });
      return;
    }

    if (action === "set-webhook") {
      const { webhookUrl, secret } = body;
      if (!webhookUrl) {
        sendJson(res, 400, { ok: false, error: "webhookUrl required" });
        return;
      }
      const result = await setWebhook(webhookUrl, secret || process.env.TELEGRAM_WEBHOOK_SECRET);
      sendJson(res, 200, { ok: result.ok, result: result.result, description: result.description });
      return;
    }

    if (action === "delete-webhook") {
      const result = await deleteWebhook();
      sendJson(res, 200, { ok: result.ok, result: result.result });
      return;
    }

    if (action === "test-send") {
      const { chatId, text } = body;
      if (!chatId || !text) {
        sendJson(res, 400, { ok: false, error: "chatId and text required" });
        return;
      }
      const result = await sendMessage(Number(chatId), text);
      sendJson(res, 200, { ok: result.ok, messageId: result.result?.message_id });
      return;
    }

    if (action === "broadcast") {
      const { text, lessonPayload } = body;
      const message = text || (lessonPayload ? formatLessonMessage(lessonPayload) : null);
      if (!message) {
        sendJson(res, 400, { ok: false, error: "text or lessonPayload required" });
        return;
      }
      const subscribers = await getActiveSubscribers();
      if (subscribers.length === 0) {
        sendJson(res, 200, { ok: true, sent: 0, message: "no_subscribers" });
        return;
      }
      const chatIds = subscribers.map((s) => s.chat_id);
      const results = await sendBroadcast(chatIds, message);
      const sent = results.filter((r) => r.ok).length;
      sendJson(res, 200, { ok: true, total: subscribers.length, sent, failed: subscribers.length - sent });
      return;
    }

    if (action === "subscribers") {
      const list = await getActiveSubscribers();
      sendJson(res, 200, {
        ok: true,
        count: list.length,
        subscribers: list.map((s) => ({ chatId: s.chat_id, username: s.username })),
      });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action", supported: ["status", "set-webhook", "delete-webhook", "test-send", "broadcast", "subscribers"] });
  } catch (err) {
    console.error("[admin/telegram]", err.message);
    sendJson(res, 500, { ok: false, error: err.message });
  }
}
