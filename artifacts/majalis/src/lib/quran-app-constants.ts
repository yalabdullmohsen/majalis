/**
 * Shared Quran immersive-reader constants (font bounds + theme backgrounds).
 * Extracted to break the majlis-local-storage ↔ quran-app-controller cycle.
 */

import { IMMERSIVE_PAPER_BG } from "@/lib/quran-immersive";

/** Flutter ImmersiveQuranApp Slider min/max. */
export const QURAN_APP_FONT_MIN = 20;
export const QURAN_APP_FONT_MAX = 42;
export const QURAN_APP_FONT_DEFAULT = 28;
/** Flutter `height: 2.1`. */
export const QURAN_APP_LINE_HEIGHT = 2.1;

export const QURAN_APP_DARK_BG = "#1A1A1A";
export const QURAN_APP_LIGHT_BG = IMMERSIVE_PAPER_BG;

/** Flutter `Colors.amber.withOpacity(0.3)` — currently recited. */
export const VERSE_PLAYING_BG = "rgba(255, 193, 7, 0.3)";

/** Flutter `Colors.brown.withOpacity(0.15)` — selected. */
export const VERSE_SELECTED_SOFT_BG = "rgba(121, 85, 72, 0.15)";
