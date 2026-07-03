/**
 * Telegram Channel Monitor — reads channel_post updates from webhook,
 * stores raw messages, and manages channel registry.
 */
import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";

// ── Channel registry ─────────────────────────────────────────────────────────

export async function getMonitoredChannels({ activeOnly = true } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    let q = admin.from("tg_monitored_channels").select("*").order("channel_username");
    if (activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (err) {
    if (isMissingTableError(err)) return [];
    console.error("[channel-monitor] getMonitoredChannels:", err.message);
    return [];
  }
}

export async function upsertChannel({ channelUsername, channelId, channelTitle, config = {} }) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const username = channelUsername.replace(/^@/, "").toLowerCase();

  try {
    const { data, error } = await admin.from("tg_monitored_channels").upsert(
      {
        channel_username: username,
        channel_id: channelId || null,
        channel_title: channelTitle || null,
        config: config || {},
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "channel_username" },
    ).select("id").single();
    if (error) throw error;
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

export async function toggleChannel(channelUsername, isActive) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false };
  const username = channelUsername.replace(/^@/, "").toLowerCase();
  try {
    const { error } = await admin.from("tg_monitored_channels")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("channel_username", username);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

export async function deleteChannel(channelUsername) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false };
  const username = channelUsername.replace(/^@/, "").toLowerCase();
  try {
    const { error } = await admin.from("tg_monitored_channels")
      .delete().eq("channel_username", username);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

// ── Raw message storage ──────────────────────────────────────────────────────

export async function storeRawMessage(channelPost) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const chat = channelPost.chat || {};
  const channelUsername = chat.username?.toLowerCase() || null;
  const telegramChannelId = chat.id || null;
  const telegramMessageId = channelPost.message_id;

  // Look up channel in registry
  let channelId = null;
  if (channelUsername) {
    try {
      const { data } = await admin.from("tg_monitored_channels")
        .select("id")
        .eq("channel_username", channelUsername)
        .single();
      channelId = data?.id || null;
    } catch { /* channel not in registry — store anyway */ }
  }

  // Extract photo file IDs
  const photos = channelPost.photo || [];
  const photoFileIds = photos.map((p) => p.file_id);

  // Extract URLs from entities
  const entities = channelPost.entities || channelPost.caption_entities || [];

  try {
    const { data, error } = await admin.from("tg_raw_messages").upsert(
      {
        channel_id: channelId,
        telegram_message_id: telegramMessageId,
        telegram_channel_id: telegramChannelId,
        channel_username: channelUsername,
        raw_text: channelPost.text || null,
        raw_caption: channelPost.caption || null,
        photo_file_ids: photoFileIds,
        document_file_id: channelPost.document?.file_id || null,
        entities: entities,
        forwarded_from: channelPost.forward_from_chat?.username || null,
        message_date: new Date(channelPost.date * 1000).toISOString(),
        extraction_status: "pending",
      },
      { onConflict: "telegram_channel_id,telegram_message_id", ignoreDuplicates: false },
    ).select("id").single();

    if (error) throw error;

    // Update channel stats
    if (channelId) {
      await admin.from("tg_monitored_channels").update({
        last_message_at: new Date().toISOString(),
        total_messages: admin.rpc ? undefined : undefined, // increment handled by separate call
        updated_at: new Date().toISOString(),
      }).eq("id", channelId);

      await admin.rpc("increment_channel_messages", { channel_uuid: channelId }).catch(() => {});
    }

    return { ok: true, id: data.id, isNew: true };
  } catch (err) {
    if (String(err.message).includes("duplicate")) return { ok: true, isNew: false };
    return { ok: false, error: String(err.message || err) };
  }
}

// ── Fetch file from Telegram ─────────────────────────────────────────────────

export async function getTelegramFileUrl(fileId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`, { signal: AbortSignal.timeout(8_000) });
    const d = await r.json();
    if (!d.ok) return null;
    return `https://api.telegram.org/file/bot${token}/${d.result.file_path}`;
  } catch {
    return null;
  }
}

// ── Stats ────────────────────────────────────────────────────────────────────

export async function getChannelStats() {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  try {
    const [channels, rawCount, pendingCount, extractedCount] = await Promise.all([
      admin.from("tg_monitored_channels").select("*", { count: "exact", head: true }),
      admin.from("tg_raw_messages").select("*", { count: "exact", head: true }),
      admin.from("tg_raw_messages").select("*", { count: "exact", head: true }).eq("extraction_status", "pending"),
      admin.from("tg_extracted_lessons").select("*", { count: "exact", head: true }),
    ]);
    return {
      channels: channels.count ?? 0,
      rawMessages: rawCount.count ?? 0,
      pendingExtraction: pendingCount.count ?? 0,
      extractedLessons: extractedCount.count ?? 0,
    };
  } catch {
    return null;
  }
}
