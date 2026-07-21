/**
 * Adhan notification preferences — stored in localStorage.
 * No server dependency; works offline and without login.
 */

import { DEFAULT_MUEZZIN_ID } from "./adhan-audio";

const STORE_KEY = "majalis-adhan-prefs-v1";

export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export const PRAYER_ARABIC: Record<PrayerKey, string> = {
  fajr:    "الفجر",
  dhuhr:   "الظهر",
  asr:     "العصر",
  maghrib: "المغرب",
  isha:    "العشاء",
};

export const PRAYER_ICON: Record<PrayerKey, string> = {
  fajr:    "🌙",
  dhuhr:   "☀️",
  asr:     "🌤️",
  maghrib: "🌅",
  isha:    "🌃",
};

/** Minutes before the adhan to trigger an advance reminder. 0 = disabled. */
export type AdvanceMinutes = 0 | 5 | 10 | 15 | 20 | 30;

export type PerPrayerPrefs = {
  enabled: boolean;         // adhan notification on/off for this prayer
  muezzinId: string;        // which muezzin to use (overrides default if set)
  advanceMinutes: AdvanceMinutes; // advance reminder, 0=off
};

export type AdhanPreferences = {
  globalEnabled: boolean;           // master on/off
  browserNotificationsEnabled: boolean;
  silentReminderEnabled: boolean;
  defaultMuezzinId: string;         // fallback muezzin for all prayers
  prayers: Record<PrayerKey, PerPrayerPrefs>;
};

const DEFAULT_ADVANCE: Record<PrayerKey, AdvanceMinutes> = {
  fajr:    15,
  dhuhr:   10,
  asr:     10,
  maghrib: 5,
  isha:    10,
};

function defaultPrefs(): AdhanPreferences {
  const prayers = {} as Record<PrayerKey, PerPrayerPrefs>;
  for (const key of PRAYER_KEYS) {
    prayers[key] = {
      enabled: true,
      muezzinId: "",           // "" = use defaultMuezzinId
      advanceMinutes: DEFAULT_ADVANCE[key],
    };
  }
  return {
    globalEnabled: true,
    browserNotificationsEnabled: false,
    silentReminderEnabled: true,
    defaultMuezzinId: DEFAULT_MUEZZIN_ID,
    prayers,
  };
}

export function loadAdhanPrefs(): AdhanPreferences {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw) as Partial<AdhanPreferences>;
    const base = defaultPrefs();
    return {
      globalEnabled: parsed.globalEnabled ?? base.globalEnabled,
      browserNotificationsEnabled: parsed.browserNotificationsEnabled ?? base.browserNotificationsEnabled,
      silentReminderEnabled: parsed.silentReminderEnabled ?? base.silentReminderEnabled,
      defaultMuezzinId: parsed.defaultMuezzinId ?? base.defaultMuezzinId,
      prayers: { ...base.prayers, ...parsed.prayers },
    };
  } catch {
    return defaultPrefs();
  }
}

export function saveAdhanPrefs(prefs: AdhanPreferences): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
  } catch { /* ignore quota errors */ }
}

export function patchAdhanPrefs(patch: Partial<AdhanPreferences>): AdhanPreferences {
  const current = loadAdhanPrefs();
  const next = { ...current, ...patch };
  saveAdhanPrefs(next);
  return next;
}

export function patchPrayerPrefs(
  key: PrayerKey,
  patch: Partial<PerPrayerPrefs>,
): AdhanPreferences {
  const current = loadAdhanPrefs();
  const next: AdhanPreferences = {
    ...current,
    prayers: {
      ...current.prayers,
      [key]: { ...current.prayers[key], ...patch },
    },
  };
  saveAdhanPrefs(next);
  return next;
}

export function getEffectiveMuezzinId(prefs: AdhanPreferences, key: PrayerKey): string {
  const override = prefs.prayers[key].muezzinId;
  return override || prefs.defaultMuezzinId || DEFAULT_MUEZZIN_ID;
}
