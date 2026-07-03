/**
 * Telegram lesson extraction engine.
 * Polls active channels, extracts text messages, and publishes them
 * directly to the lessons table — no AI generation, text is copied verbatim.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";

const TELEGRAM_API = "https://api.telegram.org";
const MAX_MESSAGES_PER_RUN = 50;

function getTelegramToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

async function telegramRequest(method, params = {}) {
  const token = getTelegramToken();
  const url = new URL(`${TELEGRAM_API}/bot${token}/${method}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  const data = await res.json();
  if (!data.ok) {
    const err = new Error(`Telegram API error: ${data.description || "unknown"}`);
    err.code = data.error_code;
    throw err;
  }
  return data.result;
}

// ── Text processing helpers ───────────────────────────────────────────────────

function cleanContent(text) {
  return text
    .replace(/\n{3,}/g, "\n\n")  // collapse excessive blank lines
    .trim();
}

function extractTitle(text) {
  const lines = text.split("\n");
  const first = lines.find((l) => l.trim().length > 2)?.trim() || "";
  return first.substring(0, 120) || "درس من Telegram";
}

const HASHTAG_SUBJECT_MAP = {
  "#عقيدة": "عقيدة",
  "#فقه": "فقه",
  "#حديث": "حديث",
  "#تفسير": "تفسير",
  "#أخلاق": "أخلاق",
  "#سيرة": "سيرة",
  "#دعوة": "دعوة",
  "#تزكية": "تزكية",
  "#قرآن": "قرآن",
  "#دروس": "دروس",
};

function extractSubject(text) {
  for (const [tag, subject] of Object.entries(HASHTAG_SUBJECT_MAP)) {
    if (text.includes(tag)) return subject;
  }
  return "عام";
}

function extractHashtags(text) {
  return (text.match(/#[؀-ۿa-zA-Z0-9_]+/g) || []).slice(0, 10);
}

function extractInstructor(text) {
  const patterns = [
    /الشيخ\s+([؀-ۿ ]{3,30})/,
    /الدكتور\s+([؀-ۿ ]{3,30})/,
    /د\.\s+([؀-ۿ ]{3,30})/,
    /فضيلة الشيخ\s+([؀-ۿ ]{3,30})/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].replace(/\s+/g, " ").trim();
  }
  return null;
}

function buildExternalKey(channelUsername, messageId) {
  return `telegram:${channelUsername}:${messageId}`;
}

// ── Core extraction ───────────────────────────────────────────────────────────

export async function extractFromChannel(channel) {
  const supabase = getSupabaseAdmin();
  const stats = {
    messagesFetched: 0,
    lessonsCreated: 0,
    lessonsSkipped: 0,
    errors: 0,
    errorMessage: null,
  };

  const username = channel.telegram_username?.replace(/^@/, "");
  if (!username) {
    stats.errorMessage = "No telegram_username configured";
    stats.errors++;
    return stats;
  }

  const offset = channel.last_scraped_message_id
    ? channel.last_scraped_message_id + 1
    : 0;

  let updates;
  try {
    updates = await telegramRequest("getUpdates", {
      offset,
      limit: MAX_MESSAGES_PER_RUN,
      timeout: 0,
      allowed_updates: "channel_post",
    });
  } catch (err) {
    if (err.code === 429) {
      stats.errorMessage = "Rate limited by Telegram — retry later";
    } else if (err.code === 401) {
      stats.errorMessage = "Invalid TELEGRAM_BOT_TOKEN";
    } else {
      stats.errorMessage = err.message;
    }
    stats.errors++;
    return stats;
  }

  if (!Array.isArray(updates) || updates.length === 0) return stats;

  stats.messagesFetched = updates.length;
  let highestUpdateId = offset - 1;

  for (const update of updates) {
    if (update.update_id > highestUpdateId) highestUpdateId = update.update_id;

    const post = update.channel_post;
    if (!post) { stats.lessonsSkipped++; continue; }

    // Only text posts
    const rawText = post.text || post.caption;
    if (!rawText || rawText.trim().length < 20) { stats.lessonsSkipped++; continue; }

    // Filter to our target channel
    const chatUsername = post.chat?.username?.toLowerCase();
    if (chatUsername && chatUsername !== username.toLowerCase()) {
      stats.lessonsSkipped++;
      continue;
    }

    const messageId = post.message_id;
    const externalKey = buildExternalKey(username, messageId);

    // Deduplication
    const { data: existing } = await supabase
      .from("lessons")
      .select("id")
      .eq("external_key", externalKey)
      .maybeSingle();

    if (existing) { stats.lessonsSkipped++; continue; }

    const cleanedText = cleanContent(rawText);
    const title = extractTitle(cleanedText);
    const subject = extractSubject(rawText);
    const tags = extractHashtags(rawText);
    const instructor = extractInstructor(rawText);
    const messageUrl = `https://t.me/${username}/${messageId}`;
    const messageDate = post.date
      ? new Date(post.date * 1000).toISOString()
      : new Date().toISOString();

    const lessonRow = {
      external_key:           externalKey,
      title,
      speaker_name:           instructor || `قناة @${username}`,
      category:               subject,
      description:            cleanedText,
      activity_type:          "درس",
      delivery:               "online",
      status:                 "approved",
      keywords:               tags,
      live_url:               messageUrl,
      source_id:              null,
      is_auto_imported:       true,
      telegram_channel_id:    channel.id,
      telegram_message_id:    messageId,
      telegram_message_url:   messageUrl,
      auto_imported_at:       new Date().toISOString(),
      auto_import_raw:        rawText,
      created_at:             messageDate,
      updated_at:             new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from("lessons")
      .insert([lessonRow]);

    if (insertError) {
      console.error("[telegram-extractor] insert error:", insertError.message);
      stats.errors++;
    } else {
      stats.lessonsCreated++;
    }
  }

  // Persist highest update_id as offset for next run
  if (highestUpdateId >= 0) {
    await supabase
      .from("telegram_channels")
      .update({
        last_scraped_message_id: highestUpdateId,
        last_scraped_at:         new Date().toISOString(),
        updated_at:              new Date().toISOString(),
      })
      .eq("id", channel.id);
  }

  return stats;
}

export async function runTelegramExtraction({ dryRun = false, channelId = null } = {}) {
  const supabase = getSupabaseAdmin();
  const started = Date.now();

  let query = supabase
    .from("telegram_channels")
    .select("*")
    .eq("is_active", true)
    .order("last_scraped_at", { ascending: true, nullsFirst: true });

  if (channelId) query = query.eq("id", channelId);

  const { data: channels, error: chErr } = await query;
  if (chErr) {
    return { ok: false, error: chErr.message };
  }
  if (!channels || channels.length === 0) {
    return { ok: true, message: "No active channels", channelsProcessed: 0 };
  }

  const results = [];

  for (const channel of channels) {
    const extractionStart = new Date().toISOString();

    let stats = { messagesFetched: 0, lessonsCreated: 0, lessonsSkipped: 0, errors: 0, errorMessage: null };

    if (!dryRun) {
      stats = await extractFromChannel(channel);
    }

    const extractionEnd = new Date().toISOString();
    const status = stats.errors > 0 && stats.lessonsCreated === 0
      ? "failed"
      : stats.errors > 0
        ? "partial_success"
        : "success";

    if (!dryRun) {
      await supabase.from("extraction_logs").insert([{
        channel_id:        channel.id,
        extraction_start:  extractionStart,
        extraction_end:    extractionEnd,
        messages_fetched:  stats.messagesFetched,
        lessons_created:   stats.lessonsCreated,
        lessons_skipped:   stats.lessonsSkipped,
        errors:            stats.errors,
        status,
        error_message:     stats.errorMessage,
      }]);
    }

    results.push({
      channelId:      channel.id,
      channelName:    channel.name,
      username:       channel.telegram_username,
      ...stats,
      status,
    });
  }

  return {
    ok: true,
    dryRun,
    channelsProcessed: channels.length,
    durationMs: Date.now() - started,
    results,
  };
}
