/** سُنّة Widgets P0 — snapshot schema */
export const WIDGET_SCHEMA_VERSION = 1 as const;
export const WIDGET_READER_VERSION = "sunnah-widgets-p0.1.0";
export const WIDGET_BRAND = "سُنّة" as const;

export type WidgetType =
  | "next_prayer"
  | "prayer_times"
  | "mushaf_continue"
  | "wird_khatma"
  | "adhkar"
  | "lessons_today"
  | "learning_continue"
  | "today_center"
  | "search_shortcuts"
  | "shortcuts"
  | "lock_screen"
  | "live_prayer"
  | "live_lesson"
  | "live_download";

export type WidgetPrivacyLevel = "public" | "lock_safe" | "account_private";
export type WidgetThemeMode = "light" | "dark" | "system";
export type WidgetFallbackState =
  | "ok"
  | "needs_setup"
  | "needs_location"
  | "no_progress"
  | "stale"
  | "account_cleared"
  | "schema_mismatch"
  | "corrupt"
  | "unavailable";

export type WidgetDeepLink = {
  path: string;
  contentKind?: string;
  contentId?: string;
};

export type WidgetSnapshotEnvelope<TPayload = unknown> = {
  widgetId: string;
  widgetType: WidgetType;
  schemaVersion: typeof WIDGET_SCHEMA_VERSION;
  readerVersion: string;
  generatedAt: string;
  validUntil: string;
  locale: "ar";
  timezone: string;
  theme: WidgetThemeMode;
  privacyLevel: WidgetPrivacyLevel;
  accountScope: string;
  dataSourceVersion: string;
  deepLink: WidgetDeepLink;
  fallbackState: WidgetFallbackState;
  payload: TPayload;
  checksum: string;
};

export type NextPrayerPayload = {
  prayerKey: string;
  prayerNameAr: string;
  timeDisplay: string;
  remainingLabel: string;
  remainingMs: number;
  locationLabel: string;
  methodLabel?: string;
  following: Array<{ prayerKey: string; prayerNameAr: string; timeDisplay: string }>;
};

export type PrayerTimesDayPayload = {
  locationLabel: string;
  dateGregorian: string;
  dateHijri?: string | null;
  methodLabel: string;
  nextPrayerKey: string | null;
  slots: Array<{
    prayerKey: string;
    prayerNameAr: string;
    timeDisplay: string;
    obligatory: boolean;
  }>;
};

export type MushafContinuePayload = {
  page: number | null;
  surahHint?: string | null;
  href: string | null;
};

export type WidgetBundleFile = {
  schemaVersion: typeof WIDGET_SCHEMA_VERSION;
  brand: typeof WIDGET_BRAND;
  writtenAt: string;
  accountScope: string;
  snapshots: WidgetSnapshotEnvelope[];
};
