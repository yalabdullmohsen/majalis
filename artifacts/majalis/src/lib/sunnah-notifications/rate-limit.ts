/**
 * حدود الإزعاج — لا تُطبَّق على الصلاة أو التشغيلية.
 */

import { CHANNEL_POLICIES, type SunnahNotificationChannel } from "./channels";
import { localDayPeriod } from "./deduplicator";

const RATE_KEY = "sunnah.notifications.rate.v1";

type RateBucket = {
  day: string;
  learning: number;
  new_content: number;
  nonEssential: number;
  lastNonEssentialAt?: string;
};

function readBucket(day = localDayPeriod()): RateBucket {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (!raw) return { day, learning: 0, new_content: 0, nonEssential: 0 };
    const parsed = JSON.parse(raw) as RateBucket;
    if (parsed.day !== day) return { day, learning: 0, new_content: 0, nonEssential: 0 };
    return {
      day,
      learning: Number(parsed.learning) || 0,
      new_content: Number(parsed.new_content) || 0,
      nonEssential: Number(parsed.nonEssential) || 0,
      lastNonEssentialAt: parsed.lastNonEssentialAt,
    };
  } catch {
    return { day, learning: 0, new_content: 0, nonEssential: 0 };
  }
}

function writeBucket(bucket: RateBucket): void {
  try {
    localStorage.setItem(RATE_KEY, JSON.stringify(bucket));
  } catch {
    /* ignore */
  }
}

const MIN_GAP_MS = 30 * 60 * 1000;

export type RateLimitDecision =
  | { ok: true }
  | { ok: false; reason: "learning_daily_cap" | "content_daily_cap" | "nonessential_gap" };

export function checkNonEssentialRateLimit(
  channel: SunnahNotificationChannel,
  now = new Date(),
): RateLimitDecision {
  const policy = CHANNEL_POLICIES[channel];
  if (!policy.subjectToNonEssentialCaps) return { ok: true };

  const bucket = readBucket(localDayPeriod(now));
  if (channel === "learning" && bucket.learning >= 1) {
    return { ok: false, reason: "learning_daily_cap" };
  }
  if (channel === "new_content" && bucket.new_content >= 1) {
    return { ok: false, reason: "content_daily_cap" };
  }
  if (bucket.lastNonEssentialAt) {
    const last = Date.parse(bucket.lastNonEssentialAt);
    if (Number.isFinite(last) && now.getTime() - last < MIN_GAP_MS) {
      return { ok: false, reason: "nonessential_gap" };
    }
  }
  return { ok: true };
}

export function recordNonEssentialSend(
  channel: SunnahNotificationChannel,
  now = new Date(),
): void {
  const policy = CHANNEL_POLICIES[channel];
  if (!policy.subjectToNonEssentialCaps) return;
  const bucket = readBucket(localDayPeriod(now));
  if (channel === "learning") bucket.learning += 1;
  if (channel === "new_content") bucket.new_content += 1;
  bucket.nonEssential += 1;
  bucket.lastNonEssentialAt = now.toISOString();
  writeBucket(bucket);
}
