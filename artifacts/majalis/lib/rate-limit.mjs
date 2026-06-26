/**
 * Distributed rate limiting — Upstash Redis in production, in-memory fallback for local dev.
 */

const buckets = new Map();

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

let upstashLimiter = null;
let upstashInitAttempted = false;

async function getUpstashLimiter(windowMs, max) {
  if (upstashInitAttempted) return upstashLimiter;
  upstashInitAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    upstashLimiter = { redis, Ratelimit, windowMs, max };
    return upstashLimiter;
  } catch {
    return null;
  }
}

export async function checkRateLimit(key, { windowMs = 60_000, max = 20 } = {}) {
  const upstash = await getUpstashLimiter(windowMs, max);
  if (upstash) {
    try {
      const limiter = new upstash.Ratelimit({
        redis: upstash.redis,
        limiter: upstash.Ratelimit.slidingWindow(max, `${Math.ceil(windowMs / 1000)} s`),
        prefix: "majalis",
      });
      const result = await limiter.limit(key);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
        backend: "upstash",
      };
    } catch {
      /* fall through to in-memory */
    }
  }

  const mem = inMemoryCheck(key, windowMs, max);
  return { ...mem, backend: "memory" };
}

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
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
