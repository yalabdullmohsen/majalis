/**
 * Web port of Flutter `LocalStorageService` (shared_preferences singleton).
 * Persists font size, theme mode, and last-read verse across restarts.
 */

import {
  QURAN_APP_DARK_BG,
  QURAN_APP_FONT_DEFAULT,
  QURAN_APP_FONT_MAX,
  QURAN_APP_FONT_MIN,
  QURAN_APP_LIGHT_BG,
  type QuranAppController,
} from "@/lib/quran-app-controller";

const FONT_KEY = "majlisilm-quran-font-size-v1";
const THEME_KEY = "majlisilm-quran-dark-v1";
const LAST_VERSE_KEY = "majlisilm-last-verse-index-v1";
const LAST_SURAH_KEY = "majlisilm-last-surah-v1";
const COURSE_PROGRESS_KEY = "majlisilm-course-progress-v1";
const DAILY_ADHKAR_KEY = "majlisilm-daily-adhkar-v1";

export type PersistedQuranPrefs = {
  fontSize: number;
  isDarkMode: boolean;
  lastVerseIndex: number | null;
  lastSurah: number;
};

function clampFont(n: number): number {
  if (!Number.isFinite(n)) return QURAN_APP_FONT_DEFAULT;
  return Math.min(QURAN_APP_FONT_MAX, Math.max(QURAN_APP_FONT_MIN, Math.round(n)));
}

function safeGet(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

export class LocalStorageService {
  private static _instance: LocalStorageService | null = null;

  static get instance(): LocalStorageService {
    if (!LocalStorageService._instance) {
      LocalStorageService._instance = new LocalStorageService();
    }
    return LocalStorageService._instance;
  }

  /** Test helper. */
  static __resetForTests(): void {
    LocalStorageService._instance = null;
  }

  async saveFontSize(size: number): Promise<void> {
    safeSet(FONT_KEY, String(clampFont(size)));
  }

  async getFontSize(): Promise<number> {
    const raw = safeGet(FONT_KEY);
    if (raw == null) return QURAN_APP_FONT_DEFAULT;
    return clampFont(Number(raw));
  }

  async saveDarkMode(dark: boolean): Promise<void> {
    safeSet(THEME_KEY, dark ? "1" : "0");
  }

  async getDarkMode(): Promise<boolean> {
    return safeGet(THEME_KEY) === "1";
  }

  async saveLastVerseIndex(index: number, surah = 1): Promise<void> {
    if (!Number.isFinite(index) || index < 0) return;
    safeSet(LAST_VERSE_KEY, String(Math.floor(index)));
    safeSet(LAST_SURAH_KEY, String(Math.max(1, Math.floor(surah))));
  }

  async getLastVerseIndex(): Promise<number | null> {
    const raw = safeGet(LAST_VERSE_KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }

  async getLastSurah(): Promise<number> {
    const raw = safeGet(LAST_SURAH_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  }

  async loadPrefs(): Promise<PersistedQuranPrefs> {
    const [fontSize, isDarkMode, lastVerseIndex, lastSurah] = await Promise.all([
      this.getFontSize(),
      this.getDarkMode(),
      this.getLastVerseIndex(),
      this.getLastSurah(),
    ]);
    return { fontSize, isDarkMode, lastVerseIndex, lastSurah };
  }

  /** Hydrate a QuranAppController from disk (Flutter SharedPreferences boot). */
  async hydrateController(controller: QuranAppController): Promise<PersistedQuranPrefs> {
    const prefs = await this.loadPrefs();
    controller.updateFontSize(prefs.fontSize);
    controller.toggleTheme(prefs.isDarkMode);
    if (prefs.lastVerseIndex != null) {
      controller.selectVerse(prefs.lastVerseIndex);
    }
    return prefs;
  }

  /** Persist current controller prefs after user changes. */
  async persistController(controller: QuranAppController, surah = 1): Promise<void> {
    await Promise.all([
      this.saveFontSize(controller.fontSize),
      this.saveDarkMode(controller.isDarkMode),
      controller.selectedVerseIndex != null
        ? this.saveLastVerseIndex(controller.selectedVerseIndex, surah)
        : Promise.resolve(),
    ]);
  }

  /** Sync helpers for React initial state (no await). */
  getFontSizeSync(): number {
    const raw = safeGet(FONT_KEY);
    if (raw == null) return QURAN_APP_FONT_DEFAULT;
    return clampFont(Number(raw));
  }

  getDarkModeSync(): boolean {
    return safeGet(THEME_KEY) === "1";
  }

  getBackgroundForTheme(dark: boolean): string {
    return dark ? QURAN_APP_DARK_BG : QURAN_APP_LIGHT_BG;
  }

  /** Educational paths — course progress map (0..1). */
  loadCourseProgress(): Record<string, number> | null {
    const raw = safeGet(COURSE_PROGRESS_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object") return null;
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(parsed)) {
        const n = Number(v);
        if (Number.isFinite(n)) out[k] = Math.min(1, Math.max(0, n));
      }
      return out;
    } catch {
      return null;
    }
  }

  saveCourseProgress(progress: Record<string, number>): void {
    safeSet(COURSE_PROGRESS_KEY, JSON.stringify(progress));
  }

  /** Daily Adhkar checklist. */
  loadDailyAdhkar(): Record<string, boolean> | null {
    const raw = safeGet(DAILY_ADHKAR_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object") return null;
      const out: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(parsed)) {
        out[k] = Boolean(v);
      }
      return out;
    } catch {
      return null;
    }
  }

  saveDailyAdhkar(adhkar: Record<string, boolean>): void {
    safeSet(DAILY_ADHKAR_KEY, JSON.stringify(adhkar));
  }
}

export function getLocalStorageService(): LocalStorageService {
  return LocalStorageService.instance;
}

export default LocalStorageService;
