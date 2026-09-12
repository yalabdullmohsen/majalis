/**
 * كتالوج تنبيهات اقتراب الصلاة.
 */
import type { AppAudioLicenseStatus } from "./app-audio-types";

export type PrayerId = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type PrayerPromptClip = {
  id: string;
  type: "prayerPrompt";
  prayerId: PrayerId;
  locale: "ar";
  transcript: string;
  speakerName: string | null;
  durationSec: number | null;
  format: "mp3" | "caf" | "m4a" | "pending";
  previewUrl: string | null;
  iosNotificationSound: string | null;
  licenseStatus: AppAudioLicenseStatus;
  source: string;
  approvedForProduction: boolean;
  version: string;
};

const TONE = {
  alert: {
    previewUrl: "/audio/notifications/prayer-alert.mp3",
    ios: "prayer-alert.caf",
    source: "public/audio/notifications — نغمة اصطناعية أصلية للمشروع",
  },
  short: {
    previewUrl: "/audio/notifications/short-ring.mp3",
    ios: "short-ring.caf",
    source: "public/audio/notifications — نغمة اصطناعية أصلية للمشروع",
  },
} as const;

const PRAYER_LABEL: Record<PrayerId, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

function toneClip(prayerId: PrayerId, variant: "full" | "short"): PrayerPromptClip {
  const label = PRAYER_LABEL[prayerId];
  const tone = variant === "short" ? TONE.short : TONE.alert;
  const transcript = variant === "short" ? `اقترب أذان ${label}` : `اقترب وقت أذان ${label}`;
  return {
    id: `prayer-prompt-${prayerId}-${variant}-tone`,
    type: "prayerPrompt",
    prayerId,
    locale: "ar",
    transcript,
    speakerName: null,
    durationSec: 2,
    format: "mp3",
    previewUrl: tone.previewUrl,
    iosNotificationSound: tone.ios,
    licenseStatus: "project_original",
    source: tone.source,
    approvedForProduction: true,
    version: "1",
  };
}

function spokenPending(prayerId: PrayerId, variant: "full" | "short"): PrayerPromptClip {
  const label = PRAYER_LABEL[prayerId];
  const transcript = variant === "short" ? `اقترب أذان ${label}` : `اقترب وقت أذان ${label}`;
  return {
    id: `prayer-prompt-${prayerId}-${variant}-spoken`,
    type: "prayerPrompt",
    prayerId,
    locale: "ar",
    transcript,
    speakerName: null,
    durationSec: null,
    format: "pending",
    previewUrl: null,
    iosNotificationSound: null,
    licenseStatus: "needs_recording",
    source: "مطلوب تسجيل بشري مرخّص — ممنوع TTS بلا مراجعة",
    approvedForProduction: false,
    version: "0",
  };
}

const PRAYERS: PrayerId[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export const PRAYER_PROMPT_CATALOG: readonly PrayerPromptClip[] = PRAYERS.flatMap((p) => [
  toneClip(p, "full"),
  toneClip(p, "short"),
  spokenPending(p, "full"),
  spokenPending(p, "short"),
]);

export function listPlayablePrayerPrompts(): PrayerPromptClip[] {
  return PRAYER_PROMPT_CATALOG.filter((c) => c.approvedForProduction && Boolean(c.previewUrl));
}

export function getPrayerPromptById(id: string): PrayerPromptClip | undefined {
  return PRAYER_PROMPT_CATALOG.find((c) => c.id === id);
}

export function defaultPrayerPromptId(prayerId: PrayerId): string {
  return `prayer-prompt-${prayerId}-full-tone`;
}

export function prayerPromptsNeedingRecording(): PrayerPromptClip[] {
  return PRAYER_PROMPT_CATALOG.filter((c) => c.licenseStatus === "needs_recording");
}
