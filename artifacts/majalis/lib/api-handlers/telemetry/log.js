/**
 * POST /api/telemetry/log
 *
 * Client telemetry ingestion — sanitized structured events only.
 * - Never stores raw IP; stores SHA-256 fingerprint of IP + salt.
 * - Never echoes secrets; truncates all free-text fields.
 * - Vite/Vercel handler (not Next.js App Router).
 */

import { createHash } from "node:crypto";
import { sendJson, endEmpty } from "../../api/_http.mjs";

const MAX_BODY = 16_000;
const MAX_STORE = 300;
const DEDUPE_MS = 30_000;

const SENSITIVE_KEY =
  /^(authorization|cookie|password|passwd|token|apikey|api[_-]?key|secret|anon[_-]?key|refresh[_-]?token|access[_-]?token|session|prompt|completion|transcript|user[_-]?text|email|phone|ip|ip_address|raw_ip)$/i;

const SENSITIVE_VALUE =
  /(sk-[a-zA-Z0-9]{10,}|eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,}|Bearer\s+[a-zA-Z0-9._~+/=-]+|postgres(ql)?:\/\/[^\s]+)/i;

const recentKeys = new Map();
const eventStore = new Map();

function getClientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"]?.toString() || "";
  const first = forwarded.split(",")[0]?.trim();
  if (first) return first;
  const realIp = req.headers?.["x-real-ip"]?.toString()?.trim();
  if (realIp) return realIp;
  return req.socket?.remoteAddress || "unknown";
}

function hashIp(ip) {
  const salt = process.env.TELEMETRY_IP_SALT || process.env.CRON_SECRET || "majalis-telemetry-v1";
  return createHash("sha256").update(`${salt}:${String(ip || "unknown")}`).digest("hex");
}

function getUserAgent(req) {
  return String(req.headers?.["user-agent"] || "").slice(0, 300);
}

async function parseBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.on !== "function") return {};
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  if (raw.length > MAX_BODY) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sanitizeFields(fields) {
  if (!fields || typeof fields !== "object") return {};
  const out = {};
  let n = 0;
  for (const [key, value] of Object.entries(fields)) {
    if (n >= 24) break;
    if (value === undefined) continue;
    const k = String(key).slice(0, 64);
    if (SENSITIVE_KEY.test(k)) {
      out[k] = "[redacted]";
      n += 1;
      continue;
    }
    if (typeof value === "string") {
      let s = value.slice(0, 400);
      if (SENSITIVE_VALUE.test(s)) s = "[redacted]";
      out[k] = s;
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[k] = value;
    } else {
      out[k] = "[omitted]";
    }
    n += 1;
  }
  return out;
}

function sanitizeEvent(body, meta) {
  const levelRaw = String(body.level || "info").toLowerCase();
  const level = ["debug", "info", "warn", "error"].includes(levelRaw) ? levelRaw : "info";
  let msg = String(body.msg || body.message || "event").replace(/\s+/g, " ").trim().slice(0, 500);
  if (SENSITIVE_VALUE.test(msg)) msg = "[redacted-message]";

  return {
    level,
    msg,
    requestId: String(body.requestId || "").slice(0, 80) || null,
    route: String(body.route || "").slice(0, 300) || null,
    commit: String(body.commit || body.commitHash || "").slice(0, 40) || null,
    build: String(body.build || body.buildVersion || "").slice(0, 64) || null,
    fields: sanitizeFields(body.fields),
    at: typeof body.at === "string" ? body.at.slice(0, 40) : new Date().toISOString(),
    userAgent: meta.userAgent,
    ipHash: meta.ipHash,
    service: "majalis-web",
  };
}

function dedupeKey(event) {
  return `${event.level}|${event.msg}|${event.route || ""}|${event.ipHash.slice(0, 16)}`;
}

function shouldAccept(key) {
  const now = Date.now();
  const last = recentKeys.get(key);
  if (last && now - last < DEDUPE_MS) return false;
  recentKeys.set(key, now);
  if (recentKeys.size > 2_000) {
    const cutoff = now - DEDUPE_MS * 2;
    for (const [k, t] of recentKeys) {
      if (t < cutoff) recentKeys.delete(k);
    }
  }
  return true;
}

function storeEvent(event) {
  const id = event.requestId || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  eventStore.set(id, { ...event, storedAt: new Date().toISOString() });
  if (eventStore.size > MAX_STORE) {
    const first = eventStore.keys().next().value;
    if (first) eventStore.delete(first);
  }
  return id;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    endEmpty(res, 204);
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      service: "telemetry-log",
      accepts: ["POST"],
      storesRawIp: false,
      note: "Client telemetry ingestion; IP is hashed server-side.",
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const body = await parseBody(req);
  if (body === null) {
    sendJson(res, 400, { ok: false, error: "invalid_json" });
    return;
  }

  const ipHash = hashIp(getClientIp(req));
  const userAgent = getUserAgent(req);
  const event = sanitizeEvent(body, { ipHash, userAgent });

  const key = dedupeKey(event);
  if (!shouldAccept(key)) {
    sendJson(res, 200, { ok: true, logged: false, deduped: true });
    return;
  }

  const id = storeEvent(event);

  const line = JSON.stringify({
    ts: new Date().toISOString(),
    channel: "telemetry.client",
    ...event,
  });

  if (event.level === "error") {
    console.error(line.slice(0, MAX_BODY));
  } else if (event.level === "warn") {
    console.warn(line.slice(0, MAX_BODY));
  } else {
    console.info(line.slice(0, MAX_BODY));
  }

  sendJson(res, 200, {
    ok: true,
    logged: true,
    id,
    ipHashed: true,
  });
}
