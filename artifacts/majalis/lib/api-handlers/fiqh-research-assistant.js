import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { runFiqhResearchQuery, sessionIdFromRequest } from "../../lib/fiqh-research-engine.mjs";

export const maxDuration = 30;

async function parseBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    if (typeof req.body === "object") return req.body;
    if (typeof req.body === "string") {
      try { return JSON.parse(req.body); } catch { return null; }
    }
  }
  let raw = "";
  if (typeof req.on === "function") {
    for await (const chunk of req) raw += chunk;
  }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET") {
    const admin = getSupabaseAdmin();
    sendJson(res, 200, {
      ok: true,
      available: true,
      hasSupabase: Boolean(admin),
      hasLlm: Boolean((process.env.ANTHROPIC_API_KEY || "").trim()),
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const body = await parseBody(req);
  if (body === null) {
    sendJson(res, 400, { ok: false, message: "طلب غير صالح." });
    return;
  }

  const query = String(body.query || body.message || "").trim();
  const filters = body.filters || {};
  const sessionId = body.sessionId || sessionIdFromRequest(req);

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 200, {
      ok: false,
      fallback: true,
      message: "استخدم البحث المحلي — Supabase غير متاح.",
    });
    return;
  }

  try {
    const result = await runFiqhResearchQuery(admin, { query, filters, sessionId });
    sendJson(res, 200, result);
  } catch (error) {
    console.error("[fiqh-research-assistant]", error);
    sendJson(res, 200, { ok: false, message: "تعذّر البحث. حاول لاحقاً." });
  }
}
