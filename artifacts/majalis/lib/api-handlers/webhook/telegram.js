/**
 * Telegram Webhook — receives updates from Telegram Bot API.
 * Handles:
 *   - Direct messages: /start /stop /help
 *   - Channel posts: stores to tg_raw_messages for AI extraction
 */
import { sendJson, endEmpty } from "../../api/_http.mjs";
import { addSubscriber, removeSubscriber } from "../../telegram/subscriber-service.mjs";
import { sendMessage } from "../../telegram/bot.mjs";
import { storeRawMessage } from "../../telegram/channel-monitor.mjs";

const WELCOME = `🕌 <b>أهلاً بك في مجالس!</b>

تطبيق العلم الشرعي — دروس، مجالس، وعلم نافع.

ستصلك إشعارات الدروس والمحتوى الجديد تلقائياً.

أرسل /stop لإلغاء الاشتراك في أي وقت.`;

const GOODBYE = `تم إلغاء اشتراكك بنجاح.\n\nأرسل /start للاشتراك مجدداً في أي وقت.`;

const HELP = `🕌 <b>مجالس — تطبيق العلم الشرعي</b>

/start — الاشتراك في الإشعارات
/stop — إلغاء الاشتراك
/help — عرض هذه الرسالة`;

export default async function handler(req, res) {
  const secretHeader = String(req.headers?.["x-telegram-bot-api-secret-token"] || "").trim();
  const expectedSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();

  if (expectedSecret && secretHeader !== expectedSecret) {
    sendJson(res, 403, { ok: false });
    return;
  }

  if (req.method !== "POST") {
    endEmpty(res, 405);
    return;
  }

  const update = req.body;

  // ── Channel post → store for AI extraction ──────────────────────────────
  const channelPost = update?.channel_post || update?.edited_channel_post;
  if (channelPost) {
    try {
      await storeRawMessage(channelPost);
    } catch (err) {
      console.error("[telegram-webhook] storeRawMessage error:", err.message);
    }
    endEmpty(res, 200);
    return;
  }

  // ── Direct message → command handling ───────────────────────────────────
  const msg = update?.message || update?.edited_message;

  if (!msg) {
    endEmpty(res, 200);
    return;
  }

  const chatId = msg.chat?.id;
  const text = String(msg.text || "").trim();
  const username = msg.from?.username || msg.from?.first_name || null;

  if (!chatId) {
    endEmpty(res, 200);
    return;
  }

  try {
    if (text.startsWith("/start")) {
      await addSubscriber(chatId, username);
      await sendMessage(chatId, WELCOME);
    } else if (text.startsWith("/stop")) {
      await removeSubscriber(chatId);
      await sendMessage(chatId, GOODBYE);
    } else if (text.startsWith("/help")) {
      await sendMessage(chatId, HELP);
    } else {
      await sendMessage(chatId, "أرسل /help لعرض الأوامر المتاحة.");
    }
  } catch (err) {
    console.error("[telegram-webhook] command error:", err.message);
  }

  endEmpty(res, 200);
}
