/**
 * POST /api/telemetry — ingest anonymous analytics events (consent-gated client-side).
 * GET  /api/telemetry — health / queue contract (no PII dump).
 */
import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const ALLOWED = new Set([
  "search_query",
  "search_click",
  "content_view",
  "surah_read",
  "quiz_complete",
  "autocomplete_use",
  "perf_mark",
  "client_error_bucket",
]);

const BLOCKED_PROP = /email|phone|token|password|lat|lng|location|user_?id|name|ip/i;

function sanitizeEvent(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.name || "");
  if (!ALLOWED.has(name)) return null;
  const propsIn = raw.props && typeof raw.props === "object" ? raw.props : {};
  const props = {};
  for (const [k, v] of Object.entries(propsIn)) {
    if (BLOCKED_PROP.test(k)) continue;
    if (typeof v === "string") props[k] = v.slice(0, 200);
    else if (typeof v === "number" || typeof v === "boolean") props[k] = v;
  }
  return {
    id: String(raw.id || "").slice(0, 64) || undefined,
    name,
    props,
    at: typeof raw.at === "string" ? raw.at.slice(0, 40) : new Date().toISOString(),
    v: 1,
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      service: "telemetry",
      privacy: "anonymous_only",
      allowedEvents: [...ALLOWED],
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const body = req.body || {};
  const list = Array.isArray(body.events) ? body.events : body.event ? [body.event] : [];
  if (!list.length) {
    sendJson(res, 400, { ok: false, error: "events_required" });
    return;
  }

  const events = list.map(sanitizeEvent).filter(Boolean).slice(0, 50);
  if (!events.length) {
    sendJson(res, 400, { ok: false, error: "no_valid_events" });
    return;
  }

  let stored = 0;
  try {
    const admin = getSupabaseAdmin?.() || null;
    if (admin) {
      const rows = events.map((e) => ({
        event_name: e.name,
        props: e.props,
        client_at: e.at,
        event_id: e.id || null,
      }));
      const { error } = await admin.from("anonymous_telemetry_events").insert(rows);
      if (!error) stored = rows.length;
    }
  } catch {
    /* table may be absent — still ack to drain client queue */
  }

  sendJson(res, 200, {
    ok: true,
    accepted: events.length,
    stored,
  });
}
