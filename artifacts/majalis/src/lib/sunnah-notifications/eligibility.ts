/**
 * NotificationEligibility — قرار الاستحقاق قبل الإنشاء/الإرسال.
 */

import { CHANNEL_POLICIES, type SunnahNotificationChannel, transportForChannel } from "./channels";
import {
  buildDedupeKey,
  hasActiveDedupe,
  localDayPeriod,
  localWeekPeriod,
} from "./deduplicator";
import { sanitizeSunnahDeepLink } from "./deep-links";
import {
  isChannelEffectivelyEnabled,
  loadSunnahNotificationPrefs,
  type SunnahNotificationPrefs,
} from "./preferences";
import { checkNonEssentialRateLimit } from "./rate-limit";
import { deferIsoDuringQuietHours, isWithinQuietHours } from "./quiet-hours";
import { isSunnahNotificationsKillSwitchOn } from "./kill-switch";

export type EligibilityInput = {
  channel: SunnahNotificationChannel;
  userId?: string | null;
  entityId: string;
  eventType: string;
  deepLink?: string | null;
  stillRelevant?: boolean;
  expiresAt?: string | null;
  prefs?: SunnahNotificationPrefs;
  now?: Date;
};

export type EligibilityResult =
  | {
      ok: true;
      transport: "local" | "push";
      dedupeKey: string;
      deepLink: string | null;
      deliverAt: string;
    }
  | {
      ok: false;
      reason:
        | "channel_disabled"
        | "expired"
        | "irrelevant"
        | "duplicate"
        | "rate_limited"
        | "invalid_deeplink"
        | "quiet_hours_cancel"
        | "kill_switch";
      detail?: string;
    };

function periodFor(
  channel: SunnahNotificationChannel,
  prefs: SunnahNotificationPrefs,
  now: Date,
): string {
  const cadence = prefs.channels[channel]?.cadence ?? "immediate";
  if (cadence === "weekly_digest") return localWeekPeriod(now);
  if (cadence === "daily_digest") return localDayPeriod(now);
  return localDayPeriod(now);
}

export function evaluateNotificationEligibility(input: EligibilityInput): EligibilityResult {
  const now = input.now ?? new Date();
  const prefs = input.prefs ?? loadSunnahNotificationPrefs();
  const policy = CHANNEL_POLICIES[input.channel];

  if (isSunnahNotificationsKillSwitchOn() && input.channel !== "prayer") {
    return { ok: false, reason: "kill_switch" };
  }

  if (input.stillRelevant === false) return { ok: false, reason: "irrelevant" };

  if (input.expiresAt) {
    const exp = Date.parse(input.expiresAt);
    if (Number.isFinite(exp) && exp <= now.getTime()) {
      return { ok: false, reason: "expired" };
    }
  }

  if (!isChannelEffectivelyEnabled(prefs, input.channel)) {
    return { ok: false, reason: "channel_disabled" };
  }

  let deepLink: string | null = null;
  if (input.deepLink != null && input.deepLink !== "") {
    deepLink = sanitizeSunnahDeepLink(input.deepLink);
    if (!deepLink) return { ok: false, reason: "invalid_deeplink" };
  }

  const dedupeKey = buildDedupeKey({
    userId: input.userId,
    channel: input.channel,
    entityId: input.entityId,
    eventType: input.eventType,
    scheduledPeriod: periodFor(input.channel, prefs, now),
  });

  if (hasActiveDedupe(dedupeKey)) {
    return { ok: false, reason: "duplicate" };
  }

  const rate = checkNonEssentialRateLimit(input.channel, now);
  if (!rate.ok) {
    return { ok: false, reason: "rate_limited", detail: rate.reason };
  }

  let deliverAt = now.toISOString();
  if (policy.subjectToQuietHours && isWithinQuietHours(prefs.quietHours, now)) {
    const deferred = deferIsoDuringQuietHours(prefs.quietHours, now);
    if (!deferred) return { ok: false, reason: "quiet_hours_cancel" };
    if (input.expiresAt) {
      const exp = Date.parse(input.expiresAt);
      const def = Date.parse(deferred);
      if (Number.isFinite(exp) && Number.isFinite(def) && exp <= def) {
        return { ok: false, reason: "expired", detail: "expires_before_quiet_end" };
      }
    }
    deliverAt = deferred;
  }

  return {
    ok: true,
    transport: transportForChannel(input.channel),
    dedupeKey,
    deepLink,
    deliverAt,
  };
}
