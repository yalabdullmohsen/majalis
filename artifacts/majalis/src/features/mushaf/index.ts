export {
  MUSHAF_FEATURES,
  MUSHAF_SOURCES,
  AYAH_PRESS_DELAY_MS,
  MUSHAF_PAGE_LINE_SLOTS,
  type MushafFeatureFlags,
  type MushafSourceAdapter,
  type MushafSourceId,
} from "@/features/mushaf/config";
export {
  buildAyahHitRegions,
  type AyahHitRegion,
  type AyahHitRect,
} from "@/features/mushaf/ayah-hit-regions";
export { MushafLayeredPage } from "@/features/mushaf/MushafLayeredPage";
export { MushafHitLayer } from "@/features/mushaf/MushafHitLayer";
export { MushafTextLayer } from "@/features/mushaf/MushafTextLayer";
export {
  MUSHAF_TAFSIR_EDITIONS,
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  DEFAULT_EXTENDED_TAFSIR_EDITION,
  resolveMushafTafsirEditionId,
  getMushafTafsirEdition,
  type MushafTafsirEdition,
} from "@/features/mushaf/tafsir-editions";
export {
  prefetchOfflineTafsirForPage,
  clearOfflineTafsirPackMeta,
  isOfflineTafsirPacksEnabled,
} from "@/features/mushaf/offline-tafsir-pack";
export {
  MUSHAF_TRANSLATION_EDITIONS,
  DEFAULT_MUSHAF_TRANSLATION_EDITION,
  resolveMushafTranslationEditionId,
  getMushafTranslationEdition,
  type MushafTranslationEdition,
} from "@/features/mushaf/translation-editions";
export {
  fetchMushafAyahTafsir,
  fetchMushafAyahTranslation,
  clearMushafAyahContentMemory,
  type AyahContentResult,
} from "@/features/mushaf/fetch-ayah-content";
export {
  TAFSIR_FONT_SCALES,
  readStoredTafsirEdition,
  persistTafsirEdition,
  readStoredTafsirFontScale,
  persistTafsirFontScale,
  readStoredTranslationEnabled,
  persistTranslationEnabled,
  readStoredTranslationEdition,
  persistTranslationEdition,
  type TafsirFontScale,
} from "@/features/mushaf/reader-prefs";
