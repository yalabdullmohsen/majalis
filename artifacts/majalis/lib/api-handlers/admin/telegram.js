/**
 * Admin API — Telegram channels & imported lessons management.
 * POST /api/admin/telegram   { action, ...params }
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { runTelegramExtraction } from "../../../lib/cms/telegram-extractor.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "").trim();
  const supabase = getSupabaseAdmin();

  try {
    // ── Channels ────────────────────────────────────────────────────────
    if (action === "list-channels") {
      const { data, error } = await supabase
        .from("telegram_channels")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      sendJson(res, 200, { ok: true, channels: data || [] });
      return;
    }

    if (action === "add-channel") {
      const { name, telegram_username, category, description } = body;
      if (!name || !telegram_username) {
        sendJson(res, 400, { ok: false, error: "name and telegram_username are required" });
        return;
      }
      const username = telegram_username.replace(/^@/, "").trim();
      const { data, error } = await supabase
        .from("telegram_channels")
        .insert([{ name, telegram_username: username, category: category || "عام", description }])
        .select()
        .single();
      if (error) throw error;
      sendJson(res, 201, { ok: true, channel: data });
      return;
    }

    if (action === "update-channel") {
      const { id, name, telegram_username, category, description, is_active } = body;
      if (!id) { sendJson(res, 400, { ok: false, error: "id is required" }); return; }
      const patch = {};
      if (name !== undefined)              patch.name = name;
      if (telegram_username !== undefined) patch.telegram_username = telegram_username.replace(/^@/, "").trim();
      if (category !== undefined)          patch.category = category;
      if (description !== undefined)       patch.description = description;
      if (is_active !== undefined)         patch.is_active = Boolean(is_active);
      patch.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("telegram_channels")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      sendJson(res, 200, { ok: true, channel: data });
      return;
    }

    if (action === "delete-channel") {
      const { id } = body;
      if (!id) { sendJson(res, 400, { ok: false, error: "id is required" }); return; }
      const { error } = await supabase.from("telegram_channels").delete().eq("id", id);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    // ── Imported lessons ─────────────────────────────────────────────────
    if (action === "list-lessons") {
      const page = Math.max(1, parseInt(body.page || req.query?.page || "1", 10));
      const limit = 20;
      const offset = (page - 1) * limit;
      const channelId = body.channelId || req.query?.channelId || null;

      let q = supabase
        .from("lessons")
        .select("id, title, speaker_name, category, description, status, created_at, telegram_message_url, telegram_channel_id, auto_imported_at, keywords", { count: "exact" })
        .eq("is_auto_imported", true)
        .order("auto_imported_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (channelId) q = q.eq("telegram_channel_id", channelId);

      const { data, count, error } = await q;
      if (error) throw error;
      sendJson(res, 200, { ok: true, lessons: data || [], total: count || 0, page, pages: Math.ceil((count || 0) / limit) });
      return;
    }

    if (action === "update-lesson") {
      const { id, title, description, category, status, speaker_name } = body;
      if (!id) { sendJson(res, 400, { ok: false, error: "id is required" }); return; }
      const patch = { updated_at: new Date().toISOString() };
      if (title !== undefined)        patch.title = title;
      if (description !== undefined)  patch.description = description;
      if (category !== undefined)     patch.category = category;
      if (status !== undefined)       patch.status = status;
      if (speaker_name !== undefined) patch.speaker_name = speaker_name;

      const { data, error } = await supabase
        .from("lessons")
        .update(patch)
        .eq("id", id)
        .eq("is_auto_imported", true)
        .select()
        .single();
      if (error) throw error;
      sendJson(res, 200, { ok: true, lesson: data });
      return;
    }

    if (action === "delete-lesson") {
      const { id } = body;
      if (!id) { sendJson(res, 400, { ok: false, error: "id is required" }); return; }
      const { error } = await supabase.from("lessons").delete().eq("id", id).eq("is_auto_imported", true);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    // ── Extraction logs ──────────────────────────────────────────────────
    if (action === "list-logs") {
      const page = Math.max(1, parseInt(body.page || req.query?.page || "1", 10));
      const limit = 30;
      const offset = (page - 1) * limit;

      const { data, count, error } = await supabase
        .from("extraction_logs")
        .select("*, telegram_channels(name, telegram_username)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      sendJson(res, 200, { ok: true, logs: data || [], total: count || 0, page });
      return;
    }

    // ── Manual extraction trigger ────────────────────────────────────────
    if (action === "trigger-extraction") {
      const channelId = body.channelId || null;
      const dryRun = body.dryRun === true;
      const result = await runTelegramExtraction({ dryRun, channelId });
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 400, { ok: false, error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("[admin/telegram]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
