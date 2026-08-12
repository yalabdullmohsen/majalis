import { sendJson } from "../../api/_http.mjs";
import { isProduction } from "../../api/_security.mjs";
import { checkRateLimit, isRedisRateLimitConfigured, sanitizeRateLimitError } from "../../../lib/rate-limit.mjs";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, message: "Method not allowed" });
    return;
  }

  const configured = Boolean((process.env.ANTHROPIC_API_KEY || "").trim());
  const rateLimitProbe = await checkRateLimit("assistant-health", { windowMs: 60_000, max: 100 });

  sendJson(res, 200, {
    ok: true,
    available: configured,
    rateLimit: {
      configured: isRedisRateLimitConfigured(),
      backend: rateLimitProbe.backend,
      allowed: rateLimitProbe.allowed,
      error: sanitizeRateLimitError(rateLimitProbe.error) || null,
    },
    ...(isProduction() ? {} : { runtime: "server" }),
  });
}
