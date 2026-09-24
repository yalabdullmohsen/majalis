/**
 * علامات أداء صفحة الصلاة — Development فقط.
 * لا تُعرض للمستخدم · لا تغيّر سلوك الإنتاج · لا Delay تجميلي.
 */
export const PRAYER_MARKS = [
  "prayer:navigation-start",
  "prayer:route-mount",
  "prayer:cached-data-ready",
  "prayer:timezone-ready",
  "prayer:location-ready",
  "prayer:permissions-ready",
  "prayer:calculation-ready",
  "prayer:first-frame",
  "prayer:first-stable-frame",
  "prayer:interactive",
] as const;

export type PrayerMarkName = (typeof PRAYER_MARKS)[number];

function isDevPrayerInstrumentation(): boolean {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
  } catch {
    /* ignore */
  }
  try {
    if (
      typeof window !== "undefined" &&
      (window as unknown as { __SUNNAH_PRAYER_MARKS__?: boolean }).__SUNNAH_PRAYER_MARKS__
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** يسجّل performance.mark في DEV فقط. */
export function markPrayer(name: PrayerMarkName): void {
  if (!isDevPrayerInstrumentation()) return;
  try {
    if (typeof performance === "undefined" || typeof performance.mark !== "function") return;
    performance.mark(name);
  } catch {
    /* ignore */
  }
}

/** لقطة علامات الصلاة (DEV/Admin فقط). */
export function readPrayerMarksSnapshot(): Array<{ name: string; startTime: number }> {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") {
    return [];
  }
  try {
    return performance
      .getEntriesByType("mark")
      .filter((e) => e.name.startsWith("prayer:"))
      .map((e) => ({ name: e.name, startTime: e.startTime }));
  } catch {
    return [];
  }
}
