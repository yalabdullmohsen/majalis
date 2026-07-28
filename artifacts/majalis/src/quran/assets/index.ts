/**
 * RN `/assets` — fonts, images, audio URL helpers.
 * Web assets live in `public/` + CSS `@font-face`; ayah audio is CDN-backed.
 */

export {
  getAyahAudioUrl,
  getSurahAudioUrl,
  getReciter,
  getFeaturedReciters,
  RECITERS,
  type QuranReciter,
} from "@/lib/quran-audio";

/** Public mushaf / Quran font CSS entry (loaded globally). */
export const QURAN_STYLESHEET = "@/styles/quran.css";

/** Quran Engine UI chrome stylesheet. */
export const QURAN_ENGINE_UI_STYLESHEET = "@/styles/quran-engine-ui.css";
