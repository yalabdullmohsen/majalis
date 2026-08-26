import { sendJson } from "../api/_http.mjs";

const MAX_BODY = 8_000;
const recentKeys = new Map();
const DEDUPE_MS = 120_000;

/** عتبات تنبيه CWV — مطابقة للعميل */
const LCP_ALERT_MS = 2500;
const INP_ALERT_MS = 200;
const CLS_ALERT = 0.1;
const TTFB_ALERT_MS = 800;

function shouldAlert(name, value) {
  if (name === "LCP") return Number(value) > LCP_ALERT_MS;
  if (name === "INP") return Number(value) > INP_ALERT_MS;
  if (name === "CLS") return Number(value) > CLS_ALERT;
  if (name === "TTFB") return Number(value) > TTFB_ALERT_MS;
  return false;
}

function dedupeOk(key) {
  const now = Date.now();
  const last = recentKeys.get(key);
  if (last && now - last < DEDUPE_MS) return false;
  recentKeys.set(key, now);
  if (recentKeys.size > 500) {
    const first = recentKeys.keys().next().value;
    if (first) recentKeys.delete(first);
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

function sanitize(body) {
  return {
    name: String(body.name || "").slice(0, 16),
    value: Number(body.value) || 0,
    rating: String(body.rating || "").slice(0, 32),
    id: String(body.id || "").slice(0, 64),
    route: String(body.route || "").slice(0, 300),
    alert: Boolean(body.alert),
    commitHash: String(body.commitHash || "").slice(0, 64),
    buildVersion: String(body.buildVersion || "").slice(0, 64),
    userAgent: String(body.userAgent || "").slice(0, 240),
    at: String(body.at || new Date().toISOString()).slice(0, 40),
  };
}

/**
 * يرسل تنبيهًا لـ Slack/Email عبر webhook اختياري (RUM_ALERT_WEBHOOK أو SLACK_WEBHOOK_URL).
 * لا يفشل الطلب إن غاب الـwebhook — التسجيل في السجلات يكفي.
 */
async function maybeNotify(metric) {
  const webhook =
    process.env.RUM_ALERT_WEBHOOK ||
    process.env.SLACK_WEBHOOK_URL ||
    process.env.PERF_ALERT_WEBHOOK ||
    "";
  if (!webhook || !metric.alert) return { notified: false };

  const key = `${metric.name}:${metric.route}:${Math.round(metric.value)}`;
  if (!dedupeOk(key)) return { notified: false, deduped: true };

  const text =
    `⚠️ RUM ${metric.name} تجاوز العتبة\n` +
    `القيمة: ${metric.value} (${metric.rating})\n` +
    `المسار: ${metric.route || "/"}\n` +
    `البناء: ${metric.commitHash || metric.buildVersion || "?"}\n` +
    `الوقت: ${metric.at}`;

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, metric }),
    });
    return { notified: res.ok, status: res.status };
  } catch (err) {
    console.error("[rum] webhook failed", String(err?.message || err));
    return { notified: false, error: true };
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      thresholds: {
        LCP_ms: LCP_ALERT_MS,
        INP_ms: INP_ALERT_MS,
        CLS: CLS_ALERT,
        TTFB_ms: TTFB_ALERT_MS,
      },
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const body = await parseBody(req);
  if (!body || typeof body !== "object") {
    return sendJson(res, 400, { ok: false, error: "invalid_json" });
  }

  const metric = sanitize(body);
  if (!["LCP", "INP", "CLS", "TTFB"].includes(metric.name)) {
    return sendJson(res, 400, { ok: false, error: "invalid_metric" });
  }

  metric.alert = metric.alert || shouldAlert(metric.name, metric.value);

  const line = JSON.stringify({
    level: metric.alert ? "warn" : "info",
    msg: "rum.metric",
    ...metric,
  }).slice(0, MAX_BODY);
  console.log(line);

  const notify = await maybeNotify(metric);
  return sendJson(res, 200, { ok: true, alert: metric.alert, ...notify });
}
