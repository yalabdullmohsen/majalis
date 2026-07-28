/**
 * RN `/hooks` — reusable logic (audio, location/progress, preferences).
 */

export { useQuranEngine } from "@/hooks/useQuranEngine";
export { useQuranEngineCore } from "@/hooks/useQuranEngineCore";
export { useQuranAudioToggle } from "@/hooks/useQuranAudioToggle";
export { useQuranAudio } from "@/hooks/useQuranAudio";
export type { QuranAudioApi } from "@/hooks/useQuranAudio";
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
export { useImmersiveSystemUi } from "@/hooks/useImmersiveSystemUi";
export { useQuranController } from "@/hooks/useQuranController";
export type { UseQuranControllerResult } from "@/hooks/useQuranController";
export { useAppController } from "@/hooks/useAppController";
export type { UseAppControllerResult } from "@/hooks/useAppController";
export { useAudioTrackingCursor } from "@/hooks/useAudioTrackingCursor";
export type { AudioTrackingCursor } from "@/hooks/useAudioTrackingCursor";
export { useQuranAppController } from "@/hooks/useQuranAppController";
export type { UseQuranAppControllerResult } from "@/hooks/useQuranAppController";
