import { sendJson } from "../api/_http.mjs";

const MAX_BODY = 16_000;
const recentIds = new Map();
const DEDUPE_MS = 60_000;

function shouldLog(errorId) {
  if (!errorId) return true;
  const now = Date.now();
  const last = recentIds.get(errorId);
  if (last && now - last < DEDUPE_MS) return false;
  recentIds.set(errorId, now);
  if (recentIds.size > 500) {
    for (const [key, ts] of recentIds) {
      if (now - ts > DEDUPE_MS) recentIds.delete(key);
    }
  }
  return true;
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

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
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

  const report = {
    errorId: String(body.errorId || "").slice(0, 64),
    message: String(body.message || "").slice(0, 500),
    name: String(body.name || "").slice(0, 120),
    route: String(body.route || "").slice(0, 300),
    section: String(body.section || "").slice(0, 120),
    userAgent: String(body.userAgent || "").slice(0, 300),
    at: body.at || new Date().toISOString(),
  };

  if (shouldLog(report.errorId)) {
    console.error("[client-error-log]", JSON.stringify(report).slice(0, MAX_BODY));
  }

  sendJson(res, 200, { ok: true, logged: true });
}
