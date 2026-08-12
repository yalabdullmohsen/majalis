/**
 * Telegram subscriber DB operations — reads/writes telegram_subscribers and telegram_messages_log.
 */
import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";

export async function addSubscriber(chatId, username = null, userId = null) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  try {
    const { error } = await admin.from("telegram_subscribers").upsert(
      {
        chat_id: chatId,
        username: username || null,
        user_id: userId || null,
        is_active: true,
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      },
      { onConflict: "chat_id" },
    );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    if (isMissingTableError(err)) return { ok: false, error: "table_missing" };
    return { ok: false, error: String(err.message || err) };
  }
}

export async function removeSubscriber(chatId) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  try {
    const { error } = await admin.from("telegram_subscribers").update({
      is_active: false,
      unsubscribed_at: new Date().toISOString(),
    }).eq("chat_id", chatId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    if (isMissingTableError(err)) return { ok: false, error: "table_missing" };
    return { ok: false, error: String(err.message || err) };
  }
}

export async function getActiveSubscribers() {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  try {
    const { data, error } = await admin
      .from("telegram_subscribers")
      .select("chat_id, username, user_id")
      .eq("is_active", true);
    if (error) throw error;
    return data || [];
  } catch (err) {
    if (isMissingTableError(err)) return [];
    console.error("[telegram] getActiveSubscribers error:", err.message);
    return [];
  }
}

export async function getSubscriberCount() {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;

  try {
    const { count, error } = await admin
      .from("telegram_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function logMessage(chatId, text, status, telegramMessageId = null, errorText = null) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  try {
    await admin.from("telegram_messages_log").insert({
      chat_id: chatId,
      message_text: text?.slice(0, 2000),
      telegram_message_id: telegramMessageId,
      status,
      error: errorText,
      sent_at: new Date().toISOString(),
    });
  } catch {
    // log silently — don't break the delivery flow
  }
}
