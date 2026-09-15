/**
 * أنواع طبقة تنبيهات الصلاة الموحّدة.
 */

export const PRAYER_NOTIFICATION_SCHEMA_VERSION = 1 as const;

export type PrayerNotificationKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_NOTIFICATION_KEYS: readonly PrayerNotificationKey[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
] as const;

export const PRAYER_NOTIFICATION_AR: Record<PrayerNotificationKey, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

/** صوت آمن حتى يُوثَّق ملف أذان مخصص وحقوقه. */
export type PrayerNotificationSoundKind = "system";

export type PrayerNotificationPreferences = {
  schemaVersion: typeof PRAYER_NOTIFICATION_SCHEMA_VERSION;
  /** تعطيل آمن للنظام الجديد دون إعادة المسار القديم. */
  featureEnabled: boolean;
  masterEnabled: boolean;
  prayers: Record<PrayerNotificationKey, boolean>;
  soundKind: PrayerNotificationSoundKind;
  lastTimeZone: string | null;
  lastFingerprint: string | null;
  lastSuccessfulScheduleAt: string | null;
};

export type PrayerSlotTime = {
  key: PrayerNotificationKey;
  nameAr: string;
  minutes: number | null;
  epochMs: number | null;
  dateISO: string;
};

export type PrayerDayTimes = {
  timeZone: string;
  dateISO: string;
  methodId: string;
  madhabId: string;
  slots: PrayerSlotTime[];
  valid: boolean;
  invalidReason?: string;
};

export type ScheduleReason =
  | "first_enable"
  | "app_open_new_day"
  | "location_changed"
  | "timezone_changed"
  | "settings_changed"
  | "schema_upgrade"
  | "foreground_stale"
  | "manual"
  | "force";

export type DesiredEnterNotification = {
  id: number;
  logicalId: string;
  friendlyKey: string;
  prayerKey: PrayerNotificationKey;
  dateISO: string;
  fireAtMs: number;
  title: string;
  body: string;
};

export type ScheduleApplyResult = {
  ok: boolean;
  reason: ScheduleReason;
  fingerprint: string;
  cancelled: number;
  scheduled: number;
  skipped: boolean;
  error?: string;
  permissionDenied?: boolean;
};
