/**
 * كتالوج أصوات إعدادات الصلاة — فصل واضح:
 * - tone: صوت إشعار الصلاة (قصير، لإشعار النظام)
 * - adhan: الأذان داخل التطبيق (معاينة/تشغيل داخلي فقط)
 */
import { getMuezzin } from "./adhan-audio";
import { getOfflineAdhanPack } from "./adhan-offline-assets";
import type { PrayerSoundProfile } from "./prayer-notification-sounds";
import type { AdhanPlaybackMode } from "./adhan-playback-modes";

export type SettingsSoundGroup = "adhan" | "tone";

export type SettingsSoundOption = {
  id: string;
  group: SettingsSoundGroup;
  label: string;
  /** مؤذن/حزمة مرتبطة بالجدولة */
  muezzinId: string;
  playbackMode: Extract<AdhanPlaybackMode, "short" | "silent" | "takbir">;
  soundProfile: PrayerSoundProfile;
  requireLocal: boolean;
  /** ملف المعاينة داخل التطبيق */
  previewUrl: string | null;
  /** اسم ملف CAF لإشعار iOS (قصير) */
  iosNotificationSound: string | null;
};

export const SETTINGS_MUEZZIN_LABELS: Record<string, string> = {
  makkah: "أذان الحرم المكي",
  alharam: "أذان الحرم المكي",
  madinah: "أذان الحرم المدني",
  qatami: "أذان ناصر القطامي",
  kuwait: "أذان خليجي قصير",
  takbeerat: "رنة قصيرة",
  soft: "رنة هادئة",
};

const OPTIONS: SettingsSoundOption[] = [
  // —— الأذان داخل التطبيق ——
  {
    id: "makkah",
    group: "adhan",
    label: "أذان الحرم المكي",
    muezzinId: "makkah",
    playbackMode: "short",
    soundProfile: "clear",
    requireLocal: true,
    previewUrl: "/audio/adhan/adhan-makkah.mp3",
    iosNotificationSound: "prayer-alert.caf",
  },
  {
    id: "madinah",
    group: "adhan",
    label: "أذان الحرم المدني",
    muezzinId: "makkah",
    playbackMode: "short",
    soundProfile: "clear",
    requireLocal: true,
    previewUrl: "/audio/adhan/adhan-madinah.mp3",
    iosNotificationSound: "prayer-alert.caf",
  },
  {
    id: "qatami",
    group: "adhan",
    label: "أذان ناصر القطامي",
    muezzinId: "qatami",
    playbackMode: "short",
    soundProfile: "clear",
    requireLocal: true,
    previewUrl: "/audio/adhan/adhan-qatami.mp3",
    iosNotificationSound: "prayer-alert.caf",
  },
  {
    id: "kuwait",
    group: "adhan",
    label: "أذان خليجي قصير",
    muezzinId: "kuwait",
    playbackMode: "short",
    soundProfile: "clear",
    requireLocal: true,
    previewUrl: "/audio/adhan/adhan-gulf-short.mp3",
    iosNotificationSound: "short-ring.caf",
  },
  // —— صوت إشعار الصلاة ——
  {
    id: "tone-prayer",
    group: "tone",
    label: "تنبيه صلاة",
    muezzinId: "makkah",
    playbackMode: "short",
    soundProfile: "clear",
    requireLocal: true,
    previewUrl: "/audio/notifications/prayer-alert.mp3",
    iosNotificationSound: "prayer-alert.caf",
  },
  {
    id: "tone-alarm",
    group: "tone",
    label: "رنة منبه واضحة",
    muezzinId: "makkah",
    playbackMode: "short",
    soundProfile: "clear",
    requireLocal: true,
    previewUrl: "/audio/notifications/alarm-clear.mp3",
    iosNotificationSound: "alarm-clear.caf",
  },
  {
    id: "tone-quiet",
    group: "tone",
    label: "رنة هادئة",
    muezzinId: "soft",
    playbackMode: "short",
    soundProfile: "quiet",
    requireLocal: true,
    previewUrl: "/audio/notifications/soft-ring.mp3",
    iosNotificationSound: "soft-ring.caf",
  },
  {
    id: "tone-short",
    group: "tone",
    label: "رنة قصيرة",
    muezzinId: "takbeerat",
    playbackMode: "short",
    soundProfile: "soft",
    requireLocal: true,
    previewUrl: "/audio/notifications/short-ring.mp3",
    iosNotificationSound: "short-ring.caf",
  },
  {
    id: "silent",
    group: "tone",
    label: "صامت",
    muezzinId: "makkah",
    playbackMode: "silent",
    soundProfile: "system",
    requireLocal: false,
    previewUrl: null,
    iosNotificationSound: null,
  },
];

function localFileExists(url: string | null): boolean {
  if (!url) return false;
  // المسارات العامة المُدرجة في الكتالوج تُعد متاحة في العميل؛
  // اختبارات البوابة تتحقق من وجود الملف على القرص بشكل منفصل.
  return url.startsWith("/audio/");
}

function hasUsableAudio(opt: SettingsSoundOption): boolean {
  if (opt.playbackMode === "silent") return true;
  if (opt.previewUrl && localFileExists(opt.previewUrl)) return true;
  const pack = getOfflineAdhanPack(opt.muezzinId);
  if (pack?.local?.general || pack?.local?.short || pack?.local?.takbir) return true;
  if (opt.requireLocal) return Boolean(opt.previewUrl);
  try {
    const m = getMuezzin(opt.muezzinId);
    return Boolean(m.audioAvailable && m.audioUrl);
  } catch {
    return false;
  }
}

const ADHAN_SOUND_ID_KEY = "majalis_settings_adhan_sound_id";
const TONE_SOUND_ID_KEY = "majalis_settings_tone_sound_id";

export function rememberSettingsSoundSelection(opt: SettingsSoundOption): void {
  try {
    if (opt.group === "adhan") localStorage.setItem(ADHAN_SOUND_ID_KEY, opt.id);
    else localStorage.setItem(TONE_SOUND_ID_KEY, opt.id);
  } catch {
    /* ignore */
  }
}

export function readRememberedAdhanSoundId(): string | null {
  try {
    return localStorage.getItem(ADHAN_SOUND_ID_KEY);
  } catch {
    return null;
  }
}

export function readRememberedToneSoundId(): string | null {
  try {
    return localStorage.getItem(TONE_SOUND_ID_KEY);
  } catch {
    return null;
  }
}

export function resolveSelectedAdhanSoundId(muezzinId: string): string {
  const available = listAvailableSettingsSounds().filter((o) => o.group === "adhan");
  const remembered = readRememberedAdhanSoundId();
  if (remembered && available.some((o) => o.id === remembered)) return remembered;
  return available.find((o) => o.muezzinId === muezzinId)?.id ?? available[0]?.id ?? "makkah";
}

export function resolveSelectedToneSoundId(soundProfile: PrayerSoundProfile): string {
  const available = listAvailableSettingsSounds().filter((o) => o.group === "tone");
  const remembered = readRememberedToneSoundId();
  if (remembered && available.some((o) => o.id === remembered)) return remembered;
  if (soundProfile === "system") return available.find((o) => o.id === "silent")?.id ?? "silent";
  const byProfile = available.find((o) => o.soundProfile === soundProfile && o.id !== "silent");
  return byProfile?.id ?? available.find((o) => o.id === "tone-prayer")?.id ?? "tone-short";
}

export function listAvailableSettingsSounds(): SettingsSoundOption[] {
  const seen = new Set<string>();
  const out: SettingsSoundOption[] = [];
  for (const opt of OPTIONS) {
    if (!hasUsableAudio(opt)) continue;
    const key = `${opt.group}:${opt.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(opt);
  }
  return out;
}

export function resolveSettingsSoundSelection(
  muezzinId: string,
  playbackMode: AdhanPlaybackMode,
  soundProfile: PrayerSoundProfile,
): string {
  if (playbackMode === "silent") return "silent";
  const available = listAvailableSettingsSounds();
  const byMuezzin = available.find((o) => o.muezzinId === muezzinId && o.group === "adhan");
  if (byMuezzin) return byMuezzin.id;
  const byProfile = available.find(
    (o) => o.group === "tone" && o.soundProfile === soundProfile && o.muezzinId === muezzinId,
  );
  if (byProfile) return byProfile.id;
  return available.find((o) => o.id === "tone-prayer")?.id
    ?? available.find((o) => o.id === "makkah")?.id
    ?? available[0]?.id
    ?? "tone-short";
}

export function getSettingsSoundOption(id: string): SettingsSoundOption | undefined {
  return listAvailableSettingsSounds().find((o) => o.id === id) ?? OPTIONS.find((o) => o.id === id);
}

export function settingsDisplayNameForMuezzin(id: string): string {
  return SETTINGS_MUEZZIN_LABELS[id] ?? "تنبيه قصير";
}

/** كل مسارات المعاينة المتوقعة على القرص (للاختبارات). */
export function listExpectedSettingsSoundFiles(): string[] {
  return OPTIONS.map((o) => o.previewUrl).filter((u): u is string => Boolean(u));
}

export function listExpectedIosNotificationCafs(): string[] {
  return Array.from(
    new Set(OPTIONS.map((o) => o.iosNotificationSound).filter((u): u is string => Boolean(u))),
  );
}
