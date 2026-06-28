/**
 * Meta Instagram / Facebook webhook verification + event receiver.
 * GET  — hub.challenge verification (Meta setup)
 * POST — incoming webhook events (logged, non-blocking)
 */
import { sendJson } from "../../api/_http.mjs";
import { getInstagramGraphConfig } from "../../../lib/cms/instagram-graph-api.mjs";
import { logAutomationStep } from "../../../lib/cms/automation-step-logs.mjs";

export default async function handler(req, res) {
  const verifyToken = getInstagramGraphConfig().webhookVerifyToken;

  if (req.method === "GET") {
    const mode = req.query?.["hub.mode"];
    const token = req.query?.["hub.verify_token"];
    const challenge = req.query?.["hub.challenge"];

    if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end(String(challenge || ""));
      return;
    }

    sendJson(res, 403, {
      ok: false,
      error: verifyToken ? "verify_token_mismatch" : "webhook_verify_token_not_configured",
      remediation: verifyToken
        ? "Hub verify token does not match INSTAGRAM_WEBHOOK_VERIFY_TOKEN"
        : "Set INSTAGRAM_WEBHOOK_VERIFY_TOKEN in Vercel env before subscribing webhooks",
    });
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    try {
      await logAutomationStep({
        step: "webhook_received",
        status: "ok",
        detail: `instagram_webhook:${body.object || "unknown"}`,
        metadata: {
          entryCount: Array.isArray(body.entry) ? body.entry.length : 0,
        },
      });
    } catch {
      /* non-blocking */
    }
    sendJson(res, 200, { ok: true, received: true });
    return;
  }

  sendJson(res, 405, { ok: false, error: "method_not_allowed" });
}
