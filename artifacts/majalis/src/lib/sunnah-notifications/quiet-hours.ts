/**
 * ساعات الهدوء — افتراضي 22:00→08:00 حسب المنطقة الزمنية المحلية.
 */

import type { QuietHoursPrefs } from "./preferences";

export function isWithinQuietHours(quiet: QuietHoursPrefs, now: Date = new Date()): boolean {
  if (!quiet.enabled) return false;
  const hour = now.getHours();
  const { startHour, endHour } = quiet;
  if (startHour === endHour) return true;
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}

export function nextQuietHoursEnd(quiet: QuietHoursPrefs, now: Date = new Date()): Date {
  const end = new Date(now);
  end.setSeconds(0, 0);
  end.setMinutes(0);
  end.setHours(quiet.endHour);
  if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 1);
  return end;
}

export function deferIsoDuringQuietHours(
  quiet: QuietHoursPrefs,
  now: Date = new Date(),
): string | null {
  if (!isWithinQuietHours(quiet, now)) return null;
  return nextQuietHoursEnd(quiet, now).toISOString();
}
