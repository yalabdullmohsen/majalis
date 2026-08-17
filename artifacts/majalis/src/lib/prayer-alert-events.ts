/** حدث شريط تنبيه الصلاة — وحدة خفيفة بلا جدولة أصلية. */
export type PrayerAlertEvent = {
  type: "pre-alert" | "entered";
  prayerKey: string;
  prayerName: string;
  prayerTimeEpochMs: number;
  preAlertMinutes: number;
};

/** يُطلَق على window عند دخول نافذة الـ15 دقيقة، وعند دخول وقت الصلاة فعلياً. */
export const PRAYER_ALERT_EVENT_NAME = "majalis:prayer-alert";
