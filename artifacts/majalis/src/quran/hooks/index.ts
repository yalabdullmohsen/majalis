/**
 * RN `/hooks` — reusable logic (audio, location/progress, preferences).
 */

export { useQuranEngine } from "@/hooks/useQuranEngine";
export { useQuranEngineCore } from "@/hooks/useQuranEngineCore";
export { useQuranAudioToggle } from "@/hooks/useQuranAudioToggle";
export { useQuranPreferences } from "@/hooks/useQuranPreferences";
export type {
  QuranPreferences,
  QuranFontId,
  QuranReadingTheme,
  QuranPageMode,
} from "@/hooks/useQuranPreferences";
export { useAyahPlayer } from "@/hooks/useAyahPlayer";
export { useReadingBreakReminder } from "@/hooks/useReadingBreakReminder";
export { useRestoreLastPage } from "@/hooks/useRestoreLastPage";
export { useKeepAwake } from "@/hooks/useKeepAwake";
export { useColorScheme } from "@/hooks/useColorScheme";
