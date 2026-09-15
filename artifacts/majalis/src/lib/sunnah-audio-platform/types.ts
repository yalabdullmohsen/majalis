/**
 * أنواع منصة أصوات سُنّة — بيانات وصفية فقط (لا ملفات صوت داخل الحزمة).
 */

export type AdhanRegion = "makkah" | "madinah" | "gulf" | "egyptian" | "short_alert";

export type AudioDelivery = "stream" | "on_demand_download" | "bundled_short_clip";

export type LicenseStatus =
  | "verified_for_production"
  | "style_only_preview"
  | "pending_owner_approval"
  | "unavailable";

export type StreamQuality = "high" | "medium" | "data_saver";

export type AdhanVoiceEntry = {
  id: string;
  labelAr: string;
  region: AdhanRegion;
  personNameAr: string | null;
  delivery: AudioDelivery;
  licenseStatus: LicenseStatus;
  catalogId: string | null;
  notesAr: string;
};

export type MurattalReciterEntry = {
  id: string;
  nameAr: string;
  catalogId: string;
  style: "murattal";
  licenseStatus: LicenseStatus;
  qualityDefault: StreamQuality;
  notesAr: string;
};

export type PrayerVoiceKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type SunnahAudioPreferences = {
  schemaVersion: 1;
  defaultAdhanVoiceId: string;
  adhanVoiceByPrayer: Record<PrayerVoiceKey, string>;
  defaultMurattalReciterId: string;
  streamQuality: StreamQuality;
  offlineDownloadsEnabled: boolean;
  updatedAt: string;
};
