import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const MAX_BODY = 32_000;
const recentIds = new Map();
const DEDUPE_MS = 60_000;
// احتياطي داخل الذاكرة فقط لحال تعذّر الاتصال بقاعدة البيانات — المصدر
// الدائم الفعلي هو جدول public.client_error_logs (انظر تعليق الهجرة:
// كانت هذه الذاكرة وحدها هي المصدر الوحيد سابقًا، وتُفقَد بين النسخ على
// Vercel serverless).
const errorStore = new Map();
const MAX_STORE = 200;

function shouldLog(errorId) {
  if (!errorId) return true;
  const now = Date.now();
  const last = recentIds.get(errorId);
  if (last && now - last < DEDUPE_MS) return false;
  recentIds.set(errorId, now);
  return true;
}

function storeReport(report) {
  if (!report?.errorId) return;
  errorStore.set(report.errorId, { ...report, storedAt: new Date().toISOString() });
  if (errorStore.size > MAX_STORE) {
    const firstKey = errorStore.keys().next().value;
    if (firstKey) errorStore.delete(firstKey);
  }
}

async function persistReport(report) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("client_error_logs").insert({
      error_id: report.errorId,
      message: report.message,
      name: report.name || null,
      stack: report.stack || null,
      component_stack: report.componentStack || null,
      component: report.component || null,
      route: report.route || null,
      section: report.section || null,
      user_agent: report.userAgent || null,
      user_id: report.userId || null,
      user_action: report.userAction || null,
      build_version: report.buildVersion || null,
      commit_hash: report.commitHash || null,
      device_type: report.deviceType || null,
      api_response: report.apiResponse || null,
      occurred_at: report.at || new Date().toISOString(),
    });
  } catch {
    /* الاحتياطي داخل الذاكرة يبقى متاحًا حتى لو فشل الإدراج */
  }
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

function sanitizeReport(body) {
  return {
    errorId: String(body.errorId || "").slice(0, 64),
    message: String(body.message || "").slice(0, 1000),
    name: String(body.name || "").slice(0, 120),
    stack: String(body.stack || "").slice(0, 8000),
    componentStack: String(body.componentStack || "").slice(0, 4000),
    component: String(body.component || "").slice(0, 200),
    route: String(body.route || "").slice(0, 300),
    section: String(body.section || "").slice(0, 120),
    userAgent: String(body.userAgent || "").slice(0, 300),
    userId: String(body.userId || "").slice(0, 64),
    userAction: String(body.userAction || "").slice(0, 200),
    buildVersion: String(body.buildVersion || "").slice(0, 64),
    commitHash: String(body.commitHash || "").slice(0, 64),
    deviceType: String(body.deviceType || "").slice(0, 32),
    apiResponse: String(body.apiResponse || "").slice(0, 2000),
    at: body.at || new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET") {
    const url = new URL(req.url || "/", "http://localhost");
    const errorId = url.searchParams.get("id") || url.searchParams.get("errorId");
    if (!errorId) {
      sendJson(res, 400, { ok: false, message: "Missing id query parameter" });
      return;
    }
    const memReport = errorStore.get(errorId);
    if (memReport) {
      sendJson(res, 200, { ok: true, report: memReport });
      return;
    }
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data } = await admin
        .from("client_error_logs")
        .select("*")
        .eq("error_id", errorId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        sendJson(res, 200, { ok: true, report: data });
        return;
      }
    }
    sendJson(res, 404, { ok: false, message: "Error report not found", errorId });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "Method not allowed" });
    return;
  }

  const body = await parseBody(req);
  if (body === null) {
    sendJson(res, 400, { ok: false, message: "Invalid JSON" });
    return;
  }

  const report = sanitizeReport(body);
  storeReport(report);
  await persistReport(report);

  if (shouldLog(report.errorId)) {
    console.error("[client-error-log]", JSON.stringify(report).slice(0, MAX_BODY));
  }

  sendJson(res, 200, { ok: true, logged: true, errorId: report.errorId });
}
