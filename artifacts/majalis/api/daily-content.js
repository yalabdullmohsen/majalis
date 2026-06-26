import { sendJson } from "./_http.js";
import { getDailyContent } from "../lib/autonomous-ai/daily.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "GET only" });
    return;
  }

  try {
    const { getSupabaseAdmin } = await import("../lib/supabase-admin.mjs");
    const admin = getSupabaseAdmin();
    const date = req.query?.date || undefined;
    const type = req.query?.type || undefined;

    let content = await getDailyContent(admin, date);
    if (type) content = content.filter((c) => c.content_type === type);

    sendJson(res, 200, { ok: true, content, date: date || new Date().toISOString().slice(0, 10) });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
