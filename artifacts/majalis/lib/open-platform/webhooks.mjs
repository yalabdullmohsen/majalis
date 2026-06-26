/**
 * Open Platform — webhooks registration and delivery.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { WEBHOOK_EVENTS } from "./config.mjs";

export function signWebhookPayload(payload, secret) {
  return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

export async function registerWebhook(admin, { url, events, secret, owner_id, name }) {
  if (!admin) return { ok: false, error: "no_admin" };

  const webhookSecret = secret || crypto.randomBytes(32).toString("hex");
  const { data, error } = await admin
    .from("open_webhooks")
    .insert({
      url,
      events: events || WEBHOOK_EVENTS.slice(0, 3),
      secret: webhookSecret,
      owner_id,
      name: name || "Webhook",
      is_active: true,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, webhook: { ...data, secret: webhookSecret } };
}

export async function listWebhooks(admin, ownerId) {
  if (!admin) return [];
  const { data } = await admin.from("open_webhooks").select("id, url, events, name, is_active, created_at, last_triggered_at").eq("owner_id", ownerId || "admin");
  return data || [];
}

export async function deliverWebhook(admin, event, payload) {
  if (!admin) return { delivered: 0, failed: 0 };

  const { data: hooks } = await admin.from("open_webhooks").select("*").eq("is_active", true);
  let delivered = 0;
  let failed = 0;

  const body = {
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  };

  for (const hook of hooks || []) {
    if (!hook events?.includes(event) && !hook events?.includes("*")) continue;

    try {
      const signature = signWebhookPayload(body, hook.secret);
      const res = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Majalis-Event": event,
          "X-Majalis-Signature": signature,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        delivered++;
        await admin.from("open_webhooks").update({ last_triggered_at: new Date().toISOString() }).eq("id", hook.id);
      } else {
        failed++;
      }

      await admin.from("open_webhook_deliveries").insert({
        webhook_id: hook.id,
        event,
        status: res.ok ? "delivered" : "failed",
        status_code: res.status,
        payload: body,
      });
    } catch {
      failed++;
    }
  }

  return { delivered, failed };
}

export async function emitContentEvent(admin, eventType, item) {
  return deliverWebhook(admin, eventType, {
    ref_id: item.ref_id,
    kind: item.kind || item.content_kind,
    id: item.id,
    title: item.title,
    updated_at: item.updated_at || new Date().toISOString(),
  });
}

export { WEBHOOK_EVENTS };
