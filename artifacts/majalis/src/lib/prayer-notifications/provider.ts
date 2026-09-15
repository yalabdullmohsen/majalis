/**
 * PrayerTimesProvider — تطبيع/تحقق مواقيت الصلاة دون تخمين شرعي.
 */
import {
  calendarNoonInZone,
  epochAtZoneMinutes,
  isEstimatedPrayerPayload,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";
import { getActivePrayerLocation } from "@/lib/prayer-location-prefs";
import { getPrayerCalcMethod, getPrayerMadhab } from "@/lib/prayer-calc-prefs";
import { dateISOInZone } from "@/lib/prayer-notification-ids";
import {
  PRAYER_NOTIFICATION_AR,
  PRAYER_NOTIFICATION_KEYS,
  type PrayerDayTimes,
  type PrayerNotificationKey,
  type PrayerSlotTime,
} from "./types";

const PAYLOAD_KEY: Record<PrayerNotificationKey, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export function validatePrayerDayOrder(slots: PrayerSlotTime[]): {
  ok: boolean;
  reason?: string;
} {
  const present = slots.filter(
    (s): s is PrayerSlotTime & { minutes: number; epochMs: number } =>
      s.minutes != null && s.epochMs != null,
  );
  if (present.length === 0) return { ok: false, reason: "no_valid_slots" };
  for (const s of present) {
    if (!Number.isFinite(s.minutes) || s.minutes < 0 || s.minutes >= 24 * 60) {
      return { ok: false, reason: `invalid_minutes_${s.key}` };
    }
    if (!Number.isFinite(s.epochMs) || Number.isNaN(s.epochMs)) {
      return { ok: false, reason: `invalid_epoch_${s.key}` };
    }
  }
  for (let i = 1; i < present.length; i++) {
    const prev = present[i - 1]!;
    const cur = present[i]!;
    if (cur.minutes < prev.minutes) {
      return { ok: false, reason: `order_${prev.key}_after_${cur.key}` };
    }
    if (cur.minutes === prev.minutes) {
      return { ok: false, reason: `equal_${prev.key}_${cur.key}` };
    }
  }
  return { ok: true };
}

function buildSlot(
  payload: PrayerTimesPayload,
  key: PrayerNotificationKey,
  noon: Date,
  timeZone: string,
): PrayerSlotTime {
  const want = PAYLOAD_KEY[key];
  const prayer = payload.prayers.find(
    (p) => p.key === want || p.key.toLowerCase() === key,
  );
  const minutes = prayer?.minutes ?? null;
  const dateISO = dateISOInZone(timeZone, noon);
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0 || minutes >= 24 * 60) {
    return { key, nameAr: PRAYER_NOTIFICATION_AR[key], minutes: null, epochMs: null, dateISO };
  }
  const epochMs = epochAtZoneMinutes(timeZone, minutes, noon);
  if (!Number.isFinite(epochMs) || Number.isNaN(epochMs)) {
    return { key, nameAr: PRAYER_NOTIFICATION_AR[key], minutes: null, epochMs: null, dateISO };
  }
  return { key, nameAr: PRAYER_NOTIFICATION_AR[key], minutes, epochMs, dateISO };
}

/** يبني يوم مواقيت من الحمولة. لا يُنشئ مواقيت تقديرية عند الفشل. */
export function providePrayerDayFromPayload(
  payload: PrayerTimesPayload | null | undefined,
  opts?: { noon?: Date; timeZone?: string },
): PrayerDayTimes {
  const fallbackTz = opts?.timeZone || getActivePrayerLocation().timeZone || "Asia/Kuwait";
  const methodId = getPrayerCalcMethod();
  const madhabId = getPrayerMadhab();

  if (!payload) {
    return {
      timeZone: fallbackTz,
      dateISO: dateISOInZone(fallbackTz, opts?.noon ?? new Date()),
      methodId,
      madhabId,
      slots: [],
      valid: false,
      invalidReason: "missing_payload",
    };
  }
  if (isEstimatedPrayerPayload(payload)) {
    return {
      timeZone: payload.timezone || fallbackTz,
      dateISO: dateISOInZone(payload.timezone || fallbackTz, opts?.noon ?? new Date()),
      methodId: payload.method || methodId,
      madhabId,
      slots: [],
      valid: false,
      invalidReason: "estimated_payload",
    };
  }

  const timeZone = opts?.timeZone || payload.timezone || fallbackTz;
  const noon = opts?.noon ?? calendarNoonInZone(timeZone);
  const slots = PRAYER_NOTIFICATION_KEYS.map((key) => buildSlot(payload, key, noon, timeZone));
  const order = validatePrayerDayOrder(slots);
  if (!order.ok) {
    return {
      timeZone,
      dateISO: dateISOInZone(timeZone, noon),
      methodId: payload.method || methodId,
      madhabId,
      slots,
      valid: false,
      invalidReason: order.reason,
    };
  }
  return {
    timeZone,
    dateISO: dateISOInZone(timeZone, noon),
    methodId: payload.method || methodId,
    madhabId,
    slots,
    valid: true,
  };
}

/** نافذة أيام قادمة من دقائق حمولة اليوم. */
export function expandPrayerDaysFromPayload(
  payload: PrayerTimesPayload,
  dayCount: number,
  opts?: { nowMs?: number; timeZone?: string },
): PrayerDayTimes[] {
  const base = providePrayerDayFromPayload(payload, { timeZone: opts?.timeZone });
  if (!base.valid) return [base];
  const n = Math.max(1, Math.min(14, Math.floor(dayCount)));
  const tz = base.timeZone;
  const nowMs = opts?.nowMs ?? Date.now();
  const out: PrayerDayTimes[] = [];
  for (let i = 0; i < n; i++) {
    const noon = calendarNoonInZone(tz, new Date(nowMs + i * 24 * 3600_000));
    const dateISO = dateISOInZone(tz, noon);
    const slots: PrayerSlotTime[] = base.slots.map((s) => {
      if (s.minutes == null) return { ...s, dateISO, epochMs: null };
      const epochMs = epochAtZoneMinutes(tz, s.minutes, noon);
      return {
        ...s,
        dateISO,
        epochMs: Number.isFinite(epochMs) ? epochMs : null,
      };
    });
    const order = validatePrayerDayOrder(slots);
    out.push({
      ...base,
      dateISO,
      slots,
      valid: order.ok,
      invalidReason: order.ok ? undefined : order.reason,
    });
  }
  return out;
}
