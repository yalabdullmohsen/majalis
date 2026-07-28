/**
 * RN `/constants` — surah list, reciter presets, font/speed defaults.
 */

export { surahList, getSurahListItem, mushafPageHref, mushafSurahHref } from "@/lib/quran-surah-list";
export type { SurahListItem } from "@/lib/quran-surah-list";

export { RECITERS, getFeaturedReciters } from "@/lib/quran-audio";

/** Playback rate presets (mushaf + engine) — 0.5 بطيء · 1 عادي · 1.5 سريع … */
export { VALID_PLAYBACK_RATES, normalizePlaybackRate } from "@/lib/quran-audio";
export const PLAYBACK_RATE_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export {
  QURAN_FONT_MIN_PX,
  QURAN_FONT_MAX_PX,
  QURAN_FONT_STEP_PX,
  QURAN_FONT_DEFAULT_PX,
  QURAN_FONT_STORAGE_KEY,
  QURAN_FONT_LINE_HEIGHT_RATIO,
} from "@/lib/quran-font-size";

export { FONT_OPTIONS, quranFontStack, nextQuranFontId } from "@/lib/quran-font-options";

export { DEFAULT_TRANSLATION_EDITION } from "@/lib/quran-translation";
export { DEFAULT_TAFSEER_SOURCE } from "@/core/tafseer/TafseerService";

export { SURAH_START_PAGES } from "@/lib/quran-api";

/** Flutter `QuranReaderPage` immersive paper / type defaults. */
export {
  IMMERSIVE_PAPER_BG,
  IMMERSIVE_INK,
  IMMERSIVE_FONT_SIZE_PX,
  IMMERSIVE_LINE_HEIGHT_RATIO,
  IMMERSIVE_PAD_X_PX,
  IMMERSIVE_PAD_Y_PX,
<<<<<<< HEAD
  VERSE_SELECTED_BG,
  VERSE_SELECTED_INK,
  VERSE_SELECTED_RADIUS_PX,
  VERSE_ITEM_GAP_PX,
=======
  IMMERSIVE_LIST_PAD_Y_PX,
  VERSE_SELECTED_BROWN,
>>>>>>> origin/cursor/quran-immersive-controller-1f54
} from "@/lib/quran-immersive";
