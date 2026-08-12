/**
 * Telegram Bot API — core HTTP wrapper.
 * Token is read at call-time so serverless functions pick it up correctly.
 */

function getToken() {
  const token = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

async function callTelegram(method, body = {}) {
  const token = getToken();
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000),
  });
  const data = await res.json();
  return data;
}

export async function getMe() {
  return callTelegram("getMe");
}

export async function sendMessage(chatId, text, opts = {}) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: opts.parse_mode ?? "HTML",
    disable_web_page_preview: opts.disable_web_page_preview ?? true,
    ...opts,
  });
}

export async function sendBroadcast(chatIds, text, opts = {}) {
  const results = [];
  for (const chatId of chatIds) {
    try {
      const r = await sendMessage(chatId, text, opts);
      results.push({ chatId, ok: r.ok, messageId: r.result?.message_id });
    } catch (err) {
      results.push({ chatId, ok: false, error: err.message });
    }
  }
  return results;
}

export async function setWebhook(url, secretToken) {
  const body = { url };
  if (secretToken) body.secret_token = secretToken;
  return callTelegram("setWebhook", body);
}

export async function deleteWebhook() {
  return callTelegram("deleteWebhook", { drop_pending_updates: false });
}

export async function getWebhookInfo() {
  return callTelegram("getWebhookInfo");
}

export function formatLessonMessage(payload) {
  const { title, sheikh, mosque, url } = payload;
  const lines = ["🕌 <b>درس جديد في مجالس</b>", ""];
  if (title) lines.push(`📚 <b>${title}</b>`);
  if (sheikh) lines.push(`👤 ${sheikh}`);
  if (mosque) lines.push(`🕌 ${mosque}`);
  if (url) {
    lines.push("");
    lines.push(`<a href="${url}">▶️ استماع الآن</a>`);
  }
  lines.push("", "——", "<i>مجالس — تطبيق العلم الشرعي</i>");
  return lines.join("\n");
}
