/**
 * كتالوج أصوات إعدادات الصلاة — أسماء واضحة فقط.
 * لا يُعرض خيار إلا إن وُجد أصل محلي أو بث متاح.
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
  muezzinId: string;
  playbackMode: Extract<AdhanPlaybackMode, "short" | "silent" | "takbir">;
  soundProfile: PrayerSoundProfile;
  requireLocal: boolean;
};

export const SETTINGS_MUEZZIN_LABELS: Record<string, string> = {
  makkah: "أذان الحرم المكي",
  alharam: "أذان الحرم المكي",
  aqsa: "أذان المسجد الأقصى",
  qatami: "أذان ناصر القطامي",
  kuwait: "أذان خليجي قصير",
  takbeerat: "تنبيه قصير بدون أذان",
  soft: "تنبيه قصير بدون أذان",
};

const OPTIONS: SettingsSoundOption[] = [
  { id: "makkah", group: "adhan", label: "أذان الحرم المكي", muezzinId: "makkah", playbackMode: "short", soundProfile: "clear", requireLocal: true },
  { id: "aqsa", group: "adhan", label: "أذان المسجد الأقصى", muezzinId: "aqsa", playbackMode: "short", soundProfile: "clear", requireLocal: true },
  { id: "qatami", group: "adhan", label: "أذان ناصر القطامي", muezzinId: "qatami", playbackMode: "short", soundProfile: "clear", requireLocal: false },
  { id: "kuwait", group: "adhan", label: "أذان خليجي قصير", muezzinId: "kuwait", playbackMode: "short", soundProfile: "clear", requireLocal: true },
  { id: "tone-alarm", group: "tone", label: "رنة منبه واضحة", muezzinId: "makkah", playbackMode: "short", soundProfile: "clear", requireLocal: true },
  { id: "tone-quiet", group: "tone", label: "رنة هادئة", muezzinId: "soft", playbackMode: "short", soundProfile: "quiet", requireLocal: true },
  { id: "tone-short", group: "tone", label: "رنة قصيرة", muezzinId: "takbeerat", playbackMode: "short", soundProfile: "soft", requireLocal: true },
  { id: "tone-prayer", group: "tone", label: "نغمة تنبيه للصلاة", muezzinId: "makkah", playbackMode: "short", soundProfile: "clear", requireLocal: true },
  { id: "tone-dhikr", group: "tone", label: "نغمة تذكير للأذكار", muezzinId: "soft", playbackMode: "short", soundProfile: "quiet", requireLocal: true },
  { id: "no-adhan", group: "tone", label: "تنبيه قصير بدون أذان", muezzinId: "soft", playbackMode: "short", soundProfile: "soft", requireLocal: true },
  { id: "silent", group: "tone", label: "صامت", muezzinId: "makkah", playbackMode: "silent", soundProfile: "system", requireLocal: false },
];

function hasUsableAudio(muezzinId: string, requireLocal: boolean): boolean {
  const pack = getOfflineAdhanPack(muezzinId);
  if (pack?.local?.general || pack?.local?.short || pack?.local?.takbir) return true;
  if (requireLocal) return false;
  try {
    const m = getMuezzin(muezzinId);
    return Boolean(m.audioAvailable && m.audioUrl);
  } catch {
    return false;
  }
}

export function listAvailableSettingsSounds(): SettingsSoundOption[] {
  const seen = new Set<string>();
  const out: SettingsSoundOption[] = [];
  for (const opt of OPTIONS) {
    if (opt.playbackMode === "silent") {
      out.push(opt);
      continue;
    }
    if (!hasUsableAudio(opt.muezzinId, opt.requireLocal)) continue;
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
  return available.find((o) => o.id === "makkah")?.id ?? available[0]?.id ?? "tone-short";
}

export function getSettingsSoundOption(id: string): SettingsSoundOption | undefined {
  return listAvailableSettingsSounds().find((o) => o.id === id) ?? OPTIONS.find((o) => o.id === id);
}

export function settingsDisplayNameForMuezzin(id: string): string {
  return SETTINGS_MUEZZIN_LABELS[id] ?? "تنبيه قصير";
}
