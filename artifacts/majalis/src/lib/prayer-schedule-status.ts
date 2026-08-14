/**
 * حالة آخر جدولة ناجحة لإشعارات الصلاة — للعرض في الإعدادات.
 */

const STORAGE_KEY = "majalis-prayer-schedule-status-v1";

export type PrayerScheduleStatus = {
  ok: boolean;
  atIso: string;
  prayerCount: number;
  soundProfile: string;
  note?: string;
};

export function loadPrayerScheduleStatus(): PrayerScheduleStatus | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PrayerScheduleStatus;
    if (!parsed?.atIso) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePrayerScheduleStatus(status: PrayerScheduleStatus): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  } catch {
    /* ignore */
  }
}

export function formatScheduleStatusAr(status: PrayerScheduleStatus | null): string {
  if (!status) return "لم تُسجَّل جدولة بعد";
  try {
    const d = new Date(status.atIso);
    const label = d.toLocaleString("ar-KW", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    if (!status.ok) return `فشلت آخر جدولة · ${label}`;
    return `آخر جدولة ناجحة: ${label} · ${status.prayerCount} صلوات`;
  } catch {
    return status.ok ? "آخر جدولة ناجحة" : "فشلت آخر جدولة";
  }
}
