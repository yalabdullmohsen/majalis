/** طبقات مصحف سُنّة v2 — بيانات / مستودع / متحكّم / بحث / صوت / فواصل / إعدادات */

export { MUSHAF_PROVENANCE, type MushafProvenance } from "./provenance";
export {
  MUSHAF_V2_FEATURES,
  MUSHAF_READER_V2_FLAG_KEY,
  QURAN_EXPERIENCE_NEXT,
  isMushafReaderV2Enabled,
} from "./flags";
export { QuranDataSource, type SurahSummary, type JuzSummary } from "./QuranDataSource";
export { MushafPageRepository } from "./MushafPageRepository";
export {
  MushafReaderController,
  type MushafReaderControllerSnapshot,
} from "./MushafReaderController";
export {
  QuranSearchEngine,
  parseQuranSearchInput,
  normalizeForSearch,
  type QuranSearchHit,
  type QuranSearchParse,
} from "./QuranSearchEngine";
export { QuranAudioController } from "./QuranAudioController";
export { QuranBookmarksRepository, type BookmarkSnapshot } from "./QuranBookmarksRepository";
export {
  QuranSettingsRepository,
  type QuranReadingPrefs,
} from "./QuranSettingsRepository";
export {
  QuranKhatmaRepository,
  type KhatmaRecord,
  type DailyWirdRecord,
} from "./QuranKhatmaRepository";
export {
  migrateMushafUserData,
  MUSHAF_USER_DATA_MIGRATION_VERSION,
  type MushafUserDataMigrationResult,
} from "./migrate-user-data";
export {
  loadMushafAppearanceMode,
  saveMushafAppearanceMode,
  applyMushafAppearanceMode,
  resolveMushafAppearance,
  type MushafAppearanceMode,
  type MushafAppearanceResolved,
} from "./appearance-prefs";
export {
  loadMushafAccentTheme,
  saveMushafAccentTheme,
  applyMushafAccentTheme,
  readAccentThemeFromDom,
} from "./accent-prefs";
export {
  MUSHAF_APPEARANCE_THEME,
  MUSHAF_ACCENT_DEFAULT,
  MUSHAF_ACCENT_STORAGE_KEY,
  themeToAccentAttr,
  accentAttrToTheme,
  mushafAppearanceThemeLabel,
  type MushafAppearanceTheme,
  type MushafAccentAttr,
} from "./mushaf-appearance-theme";
