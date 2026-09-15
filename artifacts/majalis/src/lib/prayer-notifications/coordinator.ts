/**
 * PrayerNotificationCoordinator — متى ولماذا نعيد الجدولة (مسار أصلي واحد).
 */
import type { PrayerTimesPayload } from "@/lib/prayer-times";
import { isNative } from "@/lib/capacitor-utils";
import { withPrayerScheduleLock } from "@/lib/prayer-notification-scheduler";
import { loadPrayerAlertPrefs } from "@/lib/prayer-alert-preferences";
import { providePrayerDayFromPayload, expandPrayerDaysFromPayload } from "./provider";
import {
  loadPrayerNotificationPreferences,
  markScheduleMeta,
  patchPrayerNotificationPreferences,
} from "./preferences";
import { buildScheduleFingerprint } from "./fingerprint";
import {
  buildDesiredEnterNotifications,
  assertNoDuplicateDesiredIds,
} from "./scheduler";
import { cancelLegacyPrayerNotificationsOnly } from "./legacy-cleanup";
import type { ScheduleApplyResult, ScheduleReason } from "./types";

const log = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.info("[prayer-notifications]", ...args);
};

export type CoordinateOptions = {
  reason: ScheduleReason;
  force?: boolean;
  nowMs?: number;
  applyNative?: (payload: PrayerTimesPayload) => Promise<{ scheduled: number }>;
};

/**
 * نقطة الدخول الوحيدة لإعادة جدولة إشعارات الصلاة الأصلية.
 * عند الفشل: إيقاف آمن دون إعادة تفعيل المسار القديم.
 */
export async function coordinatePrayerNotifications(
  payload: PrayerTimesPayload | null | undefined,
  opts: CoordinateOptions,
): Promise<ScheduleApplyResult> {
  const reason = opts.reason;
  const prefs = loadPrayerNotificationPreferences();

  if (!prefs.featureEnabled) {
    log("feature disabled — skip", reason);
    return {
      ok: true,
      reason,
      fingerprint: prefs.lastFingerprint ?? "",
      cancelled: 0,
      scheduled: 0,
      skipped: true,
      error: "feature_disabled",
    };
  }

  if (!isNative) {
    return {
      ok: true,
      reason,
      fingerprint: prefs.lastFingerprint ?? "",
      cancelled: 0,
      scheduled: 0,
      skipped: true,
      error: "web_context",
    };
  }

  const day = providePrayerDayFromPayload(payload);
  if (!payload || !day.valid) {
    log("invalid times — cancel prayer only", day.invalidReason);
    const cancelled = await cancelLegacyPrayerNotificationsOnly();
    return {
      ok: false,
      reason,
      fingerprint: prefs.lastFingerprint ?? "",
      cancelled,
      scheduled: 0,
      skipped: false,
      error: day.invalidReason ?? "invalid_times",
    };
  }

  if (!prefs.masterEnabled) {
    const cancelled = await cancelLegacyPrayerNotificationsOnly();
    patchPrayerNotificationPreferences({
      lastFingerprint: "disabled",
      lastTimeZone: day.timeZone,
      lastSuccessfulScheduleAt: new Date().toISOString(),
    });
    return {
      ok: true,
      reason,
      fingerprint: "disabled",
      cancelled,
      scheduled: 0,
      skipped: false,
    };
  }

  const alertPrefs = loadPrayerAlertPrefs();
  const fingerprint = buildScheduleFingerprint(day, prefs, {
    preMinutes: alertPrefs.preAlertEnabled ? alertPrefs.preAlertMinutes : 0,
    enterEnabled: alertPrefs.enterAlertEnabled,
    postEnabled: alertPrefs.postReminderEnabled,
  });

  if (
    !opts.force &&
    prefs.lastFingerprint === fingerprint &&
    prefs.lastTimeZone === day.timeZone
  ) {
    log("fingerprint match — skip", reason);
    return {
      ok: true,
      reason,
      fingerprint,
      cancelled: 0,
      scheduled: 0,
      skipped: true,
    };
  }

  const days = expandPrayerDaysFromPayload(payload, 2, {
    nowMs: opts.nowMs,
    timeZone: day.timeZone,
  });
  const desired = buildDesiredEnterNotifications(days, prefs, opts.nowMs ?? Date.now());
  if (!assertNoDuplicateDesiredIds(desired)) {
    return {
      ok: false,
      reason,
      fingerprint,
      cancelled: 0,
      scheduled: 0,
      skipped: false,
      error: "duplicate_desired_ids",
    };
  }

  let cancelled = 0;
  try {
    const result = await withPrayerScheduleLock(async () => {
      cancelled = await cancelLegacyPrayerNotificationsOnly();
      if (!opts.applyNative) throw new Error("apply_native_missing");
      return opts.applyNative(payload);
    });

    markScheduleMeta({ timeZone: day.timeZone, fingerprint });
    log("rescheduled", {
      reason,
      cancelled,
      scheduled: result.scheduled,
      fingerprint,
      dateISO: day.dateISO,
      timeZone: day.timeZone,
    });

    return {
      ok: true,
      reason,
      fingerprint,
      cancelled,
      scheduled: result.scheduled,
      skipped: false,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "schedule_failed";
    log("schedule failed — safe stop", message);
    return {
      ok: false,
      reason,
      fingerprint,
      cancelled,
      scheduled: 0,
      skipped: false,
      error: message,
    };
  }
}

/** تعطيل محلي آمن للنظام الجديد (خطة الرجوع). */
export function disablePrayerNotificationFeature(): void {
  patchPrayerNotificationPreferences({ featureEnabled: false });
}
