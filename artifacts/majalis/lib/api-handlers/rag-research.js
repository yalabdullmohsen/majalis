/**
 * API Handler — الباحث الشرعي (RAG)
 *
 * Routes:
 *   POST /api/rag/search           — بحث وتوليد إجابة
 *   GET  /api/rag/history          — سجل بحوث المستخدم
 *   POST /api/rag/library/save     — حفظ بحث في المكتبة الشخصية
 *   GET  /api/rag/library          — مكتبة الأبحاث الشخصية
 *   DELETE /api/rag/library/:id    — حذف بحث محفوظ
 *   GET  /api/rag/index/status     — إحصائيات فهرس البحث
 */

import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { runRAGPipeline } from "../../lib/rag/index.mjs";

export const maxDuration = 45;

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  let raw = "";
  if (typeof req.on === "function") {
    for await (const chunk of req) raw += chunk;
  }
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

function getUserId(req) {
  try {
    const auth = req.headers?.["authorization"] || "";
    if (!auth.startsWith("Bearer ")) return null;
    const payload = auth.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    return decoded?.sub || null;
  } catch {
    return null;
  }
}

function getSessionId(req) {
  return req.headers?.["x-session-id"] ||
         req.cookies?.session_id ||
         `anon-${Date.now()}`;
}

// ── /api/rag/search ─────────────────────────────────────────────────────────
async function handleSearch(req, res) {
  const body = await parseBody(req);
  const query = String(body.query || "").trim();
  if (!query || query.length < 3) {
    return sendJson(res, 400, { ok: false, error: "السؤال قصير جداً" });
  }
  if (query.length > 500) {
    return sendJson(res, 400, { ok: false, error: "السؤال طويل جداً" });
  }

  const userId    = getUserId(req);
  const sessionId = getSessionId(req);
  const types     = Array.isArray(body.types) ? body.types : null;
  const limit     = Math.min(Number(body.limit) || 15, 20);

  try {
    const result = await runRAGPipeline({ query, userId, sessionId, types, limit });
    return sendJson(res, 200, result);
  } catch (err) {
    console.error("[rag] search error:", err.message);
    return sendJson(res, 200, {
      ok: false,
      error: "تعذّر البحث. حاول لاحقاً.",
      answer: "تعذّر تشغيل محرك البحث. يُرجى المحاولة مرة أخرى.",
      sources: [],
    });
  }
}

// ── /api/rag/history ─────────────────────────────────────────────────────────
async function handleHistory(req, res) {
  const userId = getUserId(req);
  if (!userId) return sendJson(res, 401, { ok: false, error: "غير مصرح" });

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const limit = Math.min(Number(new URL(req.url, "http://x").searchParams.get("limit")) || 20, 50);

  const { data, error } = await admin
    .from("research_queries")
    .select("id, query_text, intent, answer_quality, duration_ms, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return sendJson(res, 500, { ok: false, error: error.message });
  return sendJson(res, 200, { ok: true, queries: data || [] });
}

// ── /api/rag/library/save ────────────────────────────────────────────────────
async function handleLibrarySave(req, res) {
  const userId = getUserId(req);
  if (!userId) return sendJson(res, 401, { ok: false, error: "غير مصرح" });

  const body = await parseBody(req);
  const { title, query_text, answer_snapshot, sources_snapshot, research_query_id, tags, personal_notes } = body;

  if (!title || !query_text) {
    return sendJson(res, 400, { ok: false, error: "العنوان والاستعلام مطلوبان" });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const { data, error } = await admin.from("user_research_library").insert({
    user_id:           userId,
    research_query_id: research_query_id || null,
    title:             String(title).slice(0, 200),
    query_text:        String(query_text).slice(0, 500),
    answer_snapshot:   String(answer_snapshot || "").slice(0, 5000),
    sources_snapshot:  sources_snapshot || [],
    tags:              Array.isArray(tags) ? tags.slice(0, 10) : [],
    personal_notes:    String(personal_notes || "").slice(0, 2000),
  }).select("id, title, saved_at").single();

  if (error) return sendJson(res, 500, { ok: false, error: error.message });
  return sendJson(res, 201, { ok: true, saved: data });
}

// ── /api/rag/library (GET) ───────────────────────────────────────────────────
async function handleLibraryList(req, res) {
  const userId = getUserId(req);
  if (!userId) return sendJson(res, 401, { ok: false, error: "غير مصرح" });

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const params = new URL(req.url, "http://x").searchParams;
  const limit  = Math.min(Number(params.get("limit")) || 20, 50);
  const tag    = params.get("tag") || null;

  let qb = admin
    .from("user_research_library")
    .select("id, title, query_text, tags, personal_notes, sources_snapshot, saved_at, updated_at")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(limit);

  if (tag) qb = qb.contains("tags", [tag]);

  const { data, error } = await qb;
  if (error) return sendJson(res, 500, { ok: false, error: error.message });
  return sendJson(res, 200, { ok: true, items: data || [] });
}

// ── /api/rag/library/:id (DELETE) ───────────────────────────────────────────
async function handleLibraryDelete(req, res, id) {
  const userId = getUserId(req);
  if (!userId) return sendJson(res, 401, { ok: false, error: "غير مصرح" });

  if (!id) return sendJson(res, 400, { ok: false, error: "المعرّف مطلوب" });

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const { error } = await admin
    .from("user_research_library")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return sendJson(res, 500, { ok: false, error: error.message });
  return sendJson(res, 200, { ok: true });
}

// ── /api/rag/index/status ────────────────────────────────────────────────────
async function handleIndexStatus(req, res) {
  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const { data } = await admin
    .from("search_index")
    .select("content_type")
    .order("content_type");

  const counts = {};
  for (const row of data || []) {
    counts[row.content_type] = (counts[row.content_type] || 0) + 1;
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return sendJson(res, 200, { ok: true, total, byType: counts });
}

// ── Router ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const method = req.method?.toUpperCase() || "GET";
  const url = req.url || "";

  if (method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  // POST /api/rag/search
  if (method === "POST" && url.includes("/search")) {
    return handleSearch(req, res);
  }

  // GET /api/rag/history
  if (method === "GET" && url.includes("/history")) {
    return handleHistory(req, res);
  }

  // POST /api/rag/library/save
  if (method === "POST" && url.includes("/library/save")) {
    return handleLibrarySave(req, res);
  }

  // DELETE /api/rag/library/:id
  if (method === "DELETE" && url.includes("/library/")) {
    const id = url.split("/library/")[1]?.split("?")[0];
    return handleLibraryDelete(req, res, id);
  }

  // GET /api/rag/library
  if (method === "GET" && url.includes("/library")) {
    return handleLibraryList(req, res);
  }

  // GET /api/rag/index/status
  if (method === "GET" && url.includes("/index/status")) {
    return handleIndexStatus(req, res);
  }

  return sendJson(res, 404, { ok: false, error: "المسار غير موجود" });
}
