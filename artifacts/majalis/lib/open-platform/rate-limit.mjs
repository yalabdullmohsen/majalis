/**
 * Open Platform — per-key rate limiting (Upstash Redis + in-memory fallback).
 */

import { checkRateLimit as coreCheck } from "../rate-limit.mjs";
import { RATE_LIMITS } from "./config.mjs";

export async function checkRateLimit(keyId, tier = "free") {
  const limits = RATE_LIMITS[tier] || RATE_LIMITS.free;
  const minute = await coreCheck(`${keyId}:minute`, {
    windowMs: 60_000,
    max: limits.requests_per_minute,
  });

  if (!minute.allowed) {
    return {
      ok: false,
      retry_after: Math.ceil((minute.resetAt - Date.now()) / 1000),
      limit: limits.requests_per_minute,
      window: "minute",
      backend: minute.backend,
    };
  }

  const day = await coreCheck(`${keyId}:day`, {
    windowMs: 86_400_000,
    max: limits.requests_per_day,
  });

  if (!day.allowed) {
    return {
      ok: false,
      retry_after: Math.ceil((day.resetAt - Date.now()) / 1000),
      limit: limits.requests_per_day,
      window: "day",
      backend: day.backend,
    };
  }

  return {
    ok: true,
    remaining: {
      minute: minute.remaining,
      day: day.remaining,
    },
    limits,
    backend: minute.backend || day.backend,
  };
}
