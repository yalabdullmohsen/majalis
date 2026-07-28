/**
 * Web Push subscription endpoint.
 * Stores VAPID push subscriptions for later send (FCM/OneSignal-compatible payload shape).
 * Secrets: never accepts or returns VAPID_PRIVATE_KEY — server-only.
 */
import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const MAX_BODY = 8_000;
const ENDPOINT_MAX = 2_048;

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.on !== "function") return {};
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) return null;
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sanitizeSubscription(body) {
  if (!body || typeof body !== "object") return null;
  const endpoint = String(body.endpoint || "").trim();
  if (!endpoint.startsWith("https://") || endpoint.length > ENDPOINT_MAX) return null;

  const keys = body.keys && typeof body.keys === "object" ? body.keys : {};
  const p256dh = String(keys.p256dh || "").trim();
  const auth = String(keys.auth || "").trim();
  if (!p256dh || !auth || p256dh.length > 512 || auth.length > 256) return null;

  // Reject accidental private-key leakage in payload
  const serialized = JSON.stringify(body).toLowerCase();
  if (serialized.includes("vapid_private") || serialized.includes("private_key")) return null;

  return {
    endpoint,
    expirationTime: body.expirationTime ?? null,
    keys: { p256dh, auth },
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      service: "push-subscribe",
      vapidConfigured: Boolean(process.env.VAPID_PRIVATE_KEY && process.env.VITE_VAPID_PUBLIC_KEY),
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const body = await parseBody(req);
  if (body === null) return sendJson(res, 413, { ok: false, error: "payload_too_large" });

  const sub = sanitizeSubscription(body);
  if (!sub) return sendJson(res, 400, { ok: false, error: "invalid_subscription" });

  if (body.unsubscribe === true) {
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      } catch {
        /* table may not exist yet — still acknowledge client unsubscribe */
      }
    }
    return sendJson(res, 200, { ok: true, removed: true });
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("push_subscriptions").upsert(
        {
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          expiration_time: sub.expirationTime,
          user_agent: String(req.headers?.["user-agent"] || "").slice(0, 300),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );
    } catch {
      /* Persist best-effort — client already holds the subscription locally */
    }
  }

  return sendJson(res, 200, { ok: true, stored: Boolean(admin) });
}
