/**
 * Open Platform — per-key rate limiting (in-memory + tier config).
 */

import { RATE_LIMITS } from "./config.mjs";

const windows = new Map();

export function checkRateLimit(keyId, tier = "free") {
  const limits = RATE_LIMITS[tier] || RATE_LIMITS.free;
  const now = Date.now();
  const minuteKey = `${keyId}:minute:${Math.floor(now / 60_000)}`;
  const dayKey = `${keyId}:day:${Math.floor(now / 86400000)}`;

  const minuteCount = (windows.get(minuteKey) || 0) + 1;
  const dayCount = (windows.get(dayKey) || 0) + 1;

  windows.set(minuteKey, minuteCount);
  windows.set(dayKey, dayCount);

  if (windows.size > 10_000) {
    const oldest = windows.keys().next().value;
    windows.delete(oldest);
  }

  if (minuteCount > limits.requests_per_minute) {
    return { ok: false, retry_after: 60 - (now % 60_000) / 1000, limit: limits.requests_per_minute, window: "minute" };
  }

  if (dayCount > limits.requests_per_day) {
    return { ok: false, retry_after: 86400 - (now % 86400000) / 1000, limit: limits.requests_per_day, window: "day" };
  }

  return {
    ok: true,
    remaining: {
      minute: limits.requests_per_minute - minuteCount,
      day: limits.requests_per_day - dayCount,
    },
    limits,
  };
}
