/**
 * QuranSettingsRepository — إعدادات القراءة/المظهر/الوصول دون اتصال مباشر من الواجهة بالتخزين.
 * لا يغيّر Geometry صفحة المصحف القياسية ولا النص العثماني.
 */

import {
  applyMushafAppearanceMode,
  loadMushafAppearanceMode,
  resolveMushafAppearance,
  saveMushafAppearanceMode,
  type MushafAppearanceMode,
  type MushafAppearanceResolved,
} from "./appearance-prefs";
import { QURAN_EXPERIENCE_NEXT } from "./flags";

const KEYS = {
  restoreLastPage: "ssunnah-mushaf-restore-last-page-v1",
  reduceMotion: "ssunnah-mushaf-reduce-motion-v1",
  textReadingMode: "ssunnah-mushaf-text-reading-mode-v1",
  showPageMeta: "ssunnah-mushaf-show-page-meta-v1",
  ayahMarks: "ssunnah-mushaf-ayah-marks-v1",
} as const;

export type QuranReadingPrefs = {
  appearanceMode: MushafAppearanceMode;
  appearanceResolved: MushafAppearanceResolved;
  restoreLastPage: boolean;
  reduceMotion: boolean;
  /** وضع قراءة نصية مرنة — منفصل عن صفحة المصحف الثابتة */
  textReadingMode: boolean;
  showPageMeta: boolean;
  ayahMarks: boolean;
};

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function systemPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export const QuranSettingsRepository = {
  getAppearanceMode(): MushafAppearanceMode {
    return loadMushafAppearanceMode();
  },

  setAppearanceMode(mode: MushafAppearanceMode): void {
    saveMushafAppearanceMode(mode);
  },

  applyAppearance(mode?: MushafAppearanceMode, root?: HTMLElement | null): void {
    applyMushafAppearanceMode(mode ?? loadMushafAppearanceMode(), root);
  },

  resolveAppearance(mode?: MushafAppearanceMode): MushafAppearanceResolved {
    return resolveMushafAppearance(mode ?? loadMushafAppearanceMode());
  },

  getRestoreLastPage(): boolean {
    return readBool(KEYS.restoreLastPage, true);
  },

  setRestoreLastPage(on: boolean): void {
    writeBool(KEYS.restoreLastPage, on);
  },

  /** تقليل الحركة: تفضيل النظام أو تجاوز صريح */
  getReduceMotion(): boolean {
    const override = (() => {
      try {
        return localStorage.getItem(KEYS.reduceMotion);
      } catch {
        return null;
      }
    })();
    if (override === "1" || override === "true") return true;
    if (override === "0" || override === "false") return false;
    return systemPrefersReducedMotion();
  },

  setReduceMotionOverride(on: boolean | null): void {
    try {
      if (on == null) localStorage.removeItem(KEYS.reduceMotion);
      else localStorage.setItem(KEYS.reduceMotion, on ? "1" : "0");
    } catch {
      /* ignore */
    }
  },

  isTextReadingModeEnabled(): boolean {
    if (!QURAN_EXPERIENCE_NEXT.textReadingMode) return false;
    return readBool(KEYS.textReadingMode, false);
  },

  setTextReadingMode(on: boolean): void {
    if (!QURAN_EXPERIENCE_NEXT.textReadingMode) return;
    writeBool(KEYS.textReadingMode, on);
  },

  getShowPageMeta(): boolean {
    return readBool(KEYS.showPageMeta, true);
  },

  setShowPageMeta(on: boolean): void {
    writeBool(KEYS.showPageMeta, on);
  },

  getAyahMarks(): boolean {
    return readBool(KEYS.ayahMarks, true);
  },

  setAyahMarks(on: boolean): void {
    writeBool(KEYS.ayahMarks, on);
  },

  snapshot(): QuranReadingPrefs {
    const appearanceMode = loadMushafAppearanceMode();
    return {
      appearanceMode,
      appearanceResolved: resolveMushafAppearance(appearanceMode),
      restoreLastPage: this.getRestoreLastPage(),
      reduceMotion: this.getReduceMotion(),
      textReadingMode: this.isTextReadingModeEnabled(),
      showPageMeta: this.getShowPageMeta(),
      ayahMarks: this.getAyahMarks(),
    };
  },
} as const;
