/**
 * Shared calendar-day key helper (Asia/Kuwait-aware when possible).
 * Deduplicates todayKey() across streak / progress / notifications modules.
 */

export function calendarDayKey(date: Date = new Date(), timeZone?: string): string {
  try {
    const tz =
      timeZone ||
      (typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait"
        : "Asia/Kuwait");
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Yesterday relative to `date` in the same timezone. */
export function calendarDayKeyOffset(daysBack: number, date: Date = new Date(), timeZone?: string): string {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() - daysBack);
  return calendarDayKey(d, timeZone);
}
