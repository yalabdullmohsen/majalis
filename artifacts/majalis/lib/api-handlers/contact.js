import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin, isMissingTableError } from "../../lib/supabase-admin.mjs";
import { checkRateLimit } from "../../lib/rate-limit.mjs";
import { requireAdminAccess } from "../../lib/admin-auth.mjs";

const CONTACT_EMAIL = "yalabdullmohsen1@gmail.com";
const SUBMIT_RATE = { windowMs: 3600_000, max: 8, keyPrefix: "contact-submit" };

/** In-memory fallback when DB unavailable */
const memoryStore = [];
const MAX_MEMORY = 200;

function ipHash(req) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  return Buffer.from(ip).toString("base64url").slice(0, 16);
}

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.on !== "function") return {};
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function validateSubmission(body) {
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const subject = String(body?.subject || "استفسار عام").trim().slice(0, 200);
  const message = String(body?.message || "").trim();

  if (name.length < 2) return { error: "name_required", message: "يرجى إدخال الاسم (حرفان على الأقل)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "email_invalid", message: "يرجى إدخال بريد إلكتروني صحيح." };
  if (message.length < 10) return { error: "message_short", message: "يرجى كتابة رسالة أوضح (10 أحرف على الأقل)." };
  if (message.length > 5000) return { error: "message_long", message: "الرسالة طويلة جداً." };

  return { name, email, subject, message };
}

function clientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

async function submitMessage(req, res) {
  const limited = await checkRateLimit(`${SUBMIT_RATE.keyPrefix}:${clientIp(req)}`, {
    windowMs: SUBMIT_RATE.windowMs,
    max: SUBMIT_RATE.max,
  });
  if (!limited.allowed) {
    sendJson(res, 429, { ok: false, error: "rate_limited", message: "تجاوزت الحد المسموح. حاول لاحقاً." });
    return;
  }

  const body = await parseBody(req);
  if (body === null) {
    sendJson(res, 400, { ok: false, error: "invalid_json" });
    return;
  }

  const validated = validateSubmission(body);
  if (validated.error) {
    sendJson(res, 400, { ok: false, error: validated.error, message: validated.message });
    return;
  }

  const record = {
    name: validated.name,
    email: validated.email,
    subject: validated.subject,
    message: validated.message,
    status: "new",
    ip_hash: ipHash(req),
    user_agent: String(req.headers["user-agent"] || "").slice(0, 300),
    created_at: new Date().toISOString(),
  };

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin.from("contact_messages").insert(record).select("id, created_at").single();
      if (!error && data) {
        sendJson(res, 201, {
          ok: true,
          id: data.id,
          message: "شكراً لتواصلك! استلمنا رسالتك وسنرد عليك في أقرب وقت.",
          contactEmail: CONTACT_EMAIL,
          source: "database",
        });
        return;
      }
      if (error && !isMissingTableError(error)) {
        console.error("[contact] insert failed", error);
      }
    } catch (err) {
      console.error("[contact] insert threw", err);
    }
  }

  const id = `mem-${Date.now().toString(36)}`;
  memoryStore.unshift({ ...record, id });
  if (memoryStore.length > MAX_MEMORY) memoryStore.pop();

  sendJson(res, 201, {
    ok: true,
    id,
    message: "شكراً لتواصلك! استلمنا رسالتك وسنرد عليك في أقرب وقت.",
    contactEmail: CONTACT_EMAIL,
    source: "memory",
    note: "Database unavailable — message stored in memory only",
  });
}

async function listMessages(req, res) {
  const auth = await requireAdminAccess(req);
  if (!auth.ok) {
    sendJson(res, auth.status || 401, { ok: false, error: auth.error || "unauthorized" });
    return;
  }

  const status = req.query?.status || req.body?.status;
  const limit = Math.min(Number(req.query?.limit || req.body?.limit) || 50, 200);

  const admin = getSupabaseAdmin();
  if (admin) {
    let query = admin.from("contact_messages").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(limit);
    if (status && status !== "all") query = query.eq("status", status);

    const { data, count, error } = await query;
    if (!error) {
      sendJson(res, 200, { ok: true, messages: data || [], total: count, source: "database" });
      return;
    }
  }

  const filtered = status && status !== "all" ? memoryStore.filter((m) => m.status === status) : memoryStore;
  sendJson(res, 200, { ok: true, messages: filtered.slice(0, limit), total: filtered.length, source: "memory" });
}

async function updateMessage(req, res) {
  const auth = await requireAdminAccess(req);
  if (!auth.ok) {
    sendJson(res, auth.status || 401, { ok: false, error: auth.error || "unauthorized" });
    return;
  }

  const body = await parseBody(req);
  const id = body?.id;
  if (!id) {
    sendJson(res, 400, { ok: false, error: "id_required" });
    return;
  }

  const updates = { updated_at: new Date().toISOString() };
  if (body.status) updates.status = body.status;
  if (body.admin_notes !== undefined) updates.admin_notes = String(body.admin_notes).slice(0, 2000);

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.from("contact_messages").update(updates).eq("id", id).select("*").single();
    if (!error && data) {
      sendJson(res, 200, { ok: true, message: data });
      return;
    }
  }

  const idx = memoryStore.findIndex((m) => m.id === id);
  if (idx >= 0) {
    memoryStore[idx] = { ...memoryStore[idx], ...updates };
    sendJson(res, 200, { ok: true, message: memoryStore[idx] });
    return;
  }

  sendJson(res, 404, { ok: false, error: "not_found" });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const action = req.query?.action || req.body?.action || "submit";

  if (action === "info" && req.method === "GET") {
    sendJson(res, 200, { ok: true, email: CONTACT_EMAIL });
    return;
  }

  if (action === "submit" && req.method === "POST") {
    await submitMessage(req, res);
    return;
  }

  if (action === "list") {
    await listMessages(req, res);
    return;
  }

  if (action === "update" && req.method === "POST") {
    await updateMessage(req, res);
    return;
  }

  sendJson(res, 400, { ok: false, error: "unknown_action" });
}
