/**
 * استعادة إعدادات الواجهة/القراءة/الصوت إلى الافتراضي دون مسح الإشارات أو التحميلات.
 */
import { writeThemePreference } from "@/lib/theme-preference";
import { DEFAULT_PREFERENCES, type UserPreferences } from "@/lib/user-preferences";
import {
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  persistTafsirEdition,
} from "@/lib/quran-data/reader-prefs";
import {
  getSelectableReciters,
  savePlaybackRate,
  saveReciterId,
} from "@/lib/quran-audio";

const QURAN_PREFS_KEY = "mj-quran-prefs-v4";

export function restoreDefaultAppSettings(
  updatePreferences: (patch: Partial<UserPreferences>) => void,
): void {
  updatePreferences({ ...DEFAULT_PREFERENCES });
  try {
    writeThemePreference("auto");
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(QURAN_PREFS_KEY);
  } catch {
    /* ignore */
  }
  const fallbackReciter = getSelectableReciters("ayah")[0]?.id ?? "alafasy";
  saveReciterId(fallbackReciter);
  savePlaybackRate(1);
  persistTafsirEdition(DEFAULT_MUSHAF_TAFSIR_EDITION);
  try {
    localStorage.removeItem("majalis-bg-playback-v1");
  } catch {
    /* ignore */
  }
}

export function readBackgroundPlaybackPref(): boolean {
  try {
    return localStorage.getItem("majalis-bg-playback-v1") === "1";
  } catch {
    return false;
  }
}

export function writeBackgroundPlaybackPref(on: boolean): void {
  try {
    localStorage.setItem("majalis-bg-playback-v1", on ? "1" : "0");
  } catch {
    /* ignore */
  }
}
