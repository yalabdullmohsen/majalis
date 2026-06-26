/**
 * Distributed rate limiting — Upstash Redis in production, in-memory fallback in dev only.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const buckets = new Map();

function stripQuotes(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function getUpstashCredentials() {
  let url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  let token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

  url = stripQuotes(url.replace(/^UPSTASH_REDIS_REST_URL=/, "").replace(/^KV_REST_API_URL=/, ""));
  token = stripQuotes(token.replace(/^UPSTASH_REDIS_REST_TOKEN=/, "").replace(/^KV_REST_API_TOKEN=/, ""));

  // Recover from a single env var accidentally containing both URL and token lines.
  if (url.includes("UPSTASH_REDIS_REST_TOKEN=")) {
    const [urlPart, tokenPart = ""] = url.split("UPSTASH_REDIS_REST_TOKEN=");
    url = stripQuotes(urlPart.replace(/^UPSTASH_REDIS_REST_URL=/, ""));
    if (!token) token = stripQuotes(tokenPart);
  }

  const urlMatch = url.match(/https:\/\/[^\s"'\\]+/);
  if (urlMatch) url = urlMatch[0];

  return { url: url.trim(), token: token.trim() };
}

function sanitizeRateLimitError(message) {
  return String(message || "")
    .replace(/UPSTASH_REDIS_REST_TOKEN=["']?[^"'\s]+["']?/gi, "UPSTASH_REDIS_REST_TOKEN=[redacted]")
    .replace(/gQ[A-Za-z0-9+/=_-]{20,}/g, "[redacted-token]");
}

function isProductionEnv() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  );
}

function getClientIp(req) {
  return (
    req.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function inMemoryCheck(key, windowMs, max) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

let upstashRedis = null;
let upstashInitAttempted = false;
let upstashInitError = null;

function getUpstashRedis() {
  const { url, token } = getUpstashCredentials();
  if (!url || !token) return null;
  if (upstashRedis) return upstashRedis;

  try {
    upstashRedis = new Redis({ url, token });
    upstashInitError = null;
    return upstashRedis;
  } catch (err) {
    upstashInitError = sanitizeRateLimitError(String(err?.message || err));
    return null;
  } finally {
    upstashInitAttempted = true;
  }
}

export async function checkRateLimit(key, { windowMs = 60_000, max = 20 } = {}) {
  const redis = getUpstashRedis();
  if (redis) {
    try {
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, `${Math.ceil(windowMs / 1000)} s`),
        prefix: "majalis",
      });
      const result = await limiter.limit(key);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
        backend: "upstash",
      };
    } catch (err) {
      if (isProductionEnv()) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: Date.now() + windowMs,
          backend: "upstash_error",
          error: sanitizeRateLimitError(String(err?.message || err)),
        };
      }
    }
  }

  if (isProductionEnv()) {
    const { url, token } = getUpstashCredentials();
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + windowMs,
      backend: "redis_required",
      error: sanitizeRateLimitError(
        upstashInitError ||
          (!url || !token
            ? "UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN required in production"
            : "Upstash Redis client failed to initialize"),
      ),
    };
  }

  const mem = inMemoryCheck(key, windowMs, max);
  return { ...mem, backend: "memory" };
}

export { sanitizeRateLimitError };

export function createRateLimiter({ windowMs = 60_000, max = 20, keyPrefix = "" } = {}) {
  return async (req, res, next) => {
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const result = await checkRateLimit(key, { windowMs, max });

    res.setHeader("X-RateLimit-Remaining", String(result.remaining ?? 0));
    if (result.backend) res.setHeader("X-RateLimit-Backend", result.backend);

    if (!result.allowed) {
      res.statusCode = 429;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          error: "تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار دقيقة ثم المحاولة مجددًا.",
        }),
      );
      return;
    }

    if (typeof next === "function") return next();
  };
}

export function isRedisRateLimitConfigured() {
  const { url, token } = getUpstashCredentials();
  return Boolean(url && token);
}
