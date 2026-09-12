/**
 * تفضيلات مقاطع اقتراب الصلاة + الأذكار الصوتية.
 */
import { defaultPrayerPromptId, type PrayerId } from "./prayer-prompt-catalog";

const STORE_KEY = "ssunnah:audio-prompt-prefs-v1";

export type PrayerPromptMode = "none" | "system" | "tone";

export type AudioPromptPreferences = {
  prayerPromptByPrayer: Record<PrayerId, PrayerPromptMode>;
  prayerPromptClipId: Record<PrayerId, string>;
  dhikrAudioEnabled: boolean;
  selectedDhikrId: string | null;
  respectActiveLongForm: boolean;
  dhikrSilentNotification: boolean;
};

const PRAYERS: PrayerId[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function defaults(): AudioPromptPreferences {
  const prayerPromptByPrayer = {} as Record<PrayerId, PrayerPromptMode>;
  const prayerPromptClipId = {} as Record<PrayerId, string>;
  for (const p of PRAYERS) {
    prayerPromptByPrayer[p] = "tone";
    prayerPromptClipId[p] = defaultPrayerPromptId(p);
  }
  return {
    prayerPromptByPrayer,
    prayerPromptClipId,
    dhikrAudioEnabled: false,
    selectedDhikrId: "dhikr-subhanallah",
    respectActiveLongForm: true,
    dhikrSilentNotification: false,
  };
}

function isMode(v: unknown): v is PrayerPromptMode {
  return v === "none" || v === "system" || v === "tone";
}

export function loadAudioPromptPrefs(): AudioPromptPreferences {
  const base = defaults();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AudioPromptPreferences>;
    for (const p of PRAYERS) {
      const mode = parsed.prayerPromptByPrayer?.[p];
      if (isMode(mode)) base.prayerPromptByPrayer[p] = mode;
      const clip = parsed.prayerPromptClipId?.[p];
      if (typeof clip === "string" && clip) base.prayerPromptClipId[p] = clip;
    }
    if (typeof parsed.dhikrAudioEnabled === "boolean") base.dhikrAudioEnabled = parsed.dhikrAudioEnabled;
    if (parsed.selectedDhikrId === null || typeof parsed.selectedDhikrId === "string") {
      base.selectedDhikrId = parsed.selectedDhikrId ?? null;
    }
    if (typeof parsed.respectActiveLongForm === "boolean") {
      base.respectActiveLongForm = parsed.respectActiveLongForm;
    }
    if (typeof parsed.dhikrSilentNotification === "boolean") {
      base.dhikrSilentNotification = parsed.dhikrSilentNotification;
    }
    return base;
  } catch {
    return base;
  }
}

export const AUDIO_PROMPT_PREFS_CHANGED = "ssunnah:audio-prompt-prefs-changed";

export function saveAudioPromptPrefs(prefs: AudioPromptPreferences): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
  try {
    window.dispatchEvent(new CustomEvent(AUDIO_PROMPT_PREFS_CHANGED));
  } catch { /* ignore */ }
}

export function patchAudioPromptPrefs(
  patch: Partial<AudioPromptPreferences>,
): AudioPromptPreferences {
  const cur = loadAudioPromptPrefs();
  const next: AudioPromptPreferences = {
    ...cur,
    ...patch,
    prayerPromptByPrayer: {
      ...cur.prayerPromptByPrayer,
      ...(patch.prayerPromptByPrayer ?? {}),
    },
    prayerPromptClipId: {
      ...cur.prayerPromptClipId,
      ...(patch.prayerPromptClipId ?? {}),
    },
  };
  saveAudioPromptPrefs(next);
  return next;
}
