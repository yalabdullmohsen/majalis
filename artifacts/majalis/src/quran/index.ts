/**
 * Quran reading surface — RN-shaped layout façade.
 *
 * Mirrors the React Native sketch:
 * ```
 * /src
 *   /assets      → fonts, images, audio helpers
 *   /components  → Verse card, control bar, mushaf widgets
 *   /screens     → Reader, index, settings (web: views)
 *   /hooks       → audio, preferences, engine
 *   /context     → global reading state + night mode bridge
 *   /services    → storage, DB, fetch, audio/tafsir engines
 *   /constants   → surah list, reciters, font/speed presets
 * ```
 *
 * These barrels **re-export** existing modules under `components/`, `views/`,
 * `hooks/`, `core/`, and `lib/` — no duplicate implementations.
 *
 * Prefer deep imports for UI (they pull CSS):
 *   `import { QuranViewer } from "@/quran/components"`
 *   `import { MushafReaderScreen } from "@/quran/screens"`
 */

export * as assets from "./assets";
export * as hooks from "./hooks";
export * as context from "./context";
export * as services from "./services";
export * as constants from "./constants";

/** Path aliases for RN sketch folders that carry CSS side-effects. */
export const RN_UI_PATHS = {
  components: "@/quran/components",
  screens: "@/quran/screens",
} as const;
