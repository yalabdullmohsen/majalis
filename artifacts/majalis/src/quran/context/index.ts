/**
 * RN `/context` — global reading state + theme bridge.
 */

export {
  QuranEngineProvider,
  useQuranEngineContext,
  useQuranEngineContextOptional,
  getQuranEngineContext,
  type QuranEngineContextApi,
  type QuranEngineState,
  type QuranEngineReactValue,
  type ActiveVerse,
} from "@/core/quran/QuranEngineContext";

/** App-wide night mode / theme (platform provider — not Quran-only). */
export { useThemePreference } from "@/components/ThemePreferenceProvider";
