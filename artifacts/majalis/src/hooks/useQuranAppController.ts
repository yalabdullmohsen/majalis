/**
 * React binding for Flutter `QuranAppController` / `AnimatedBuilder`.
 */
import { useMemo, useSyncExternalStore } from "react";
import {
  createQuranAppController,
  type QuranAppController,
  type QuranAppControllerSnapshot,
} from "@/lib/quran-app-controller";

export type UseQuranAppControllerResult = QuranAppControllerSnapshot & {
  controller: QuranAppController;
  updateFontSize: (size: number) => void;
  toggleTheme: (dark: boolean) => void;
  selectVerse: (index: number) => void;
  toggleAudio: (index: number) => void;
  stopAudio: () => void;
};

export function useQuranAppController(
  external?: QuranAppController,
): UseQuranAppControllerResult {
  const controller = useMemo(
    () => external ?? createQuranAppController(),
    [external],
  );

  const snap = useSyncExternalStore(
    (cb) => controller.subscribe(cb),
    () => controller.getSnapshot(),
    () => controller.getSnapshot(),
  );

  return {
    ...snap,
    controller,
    updateFontSize: (s) => controller.updateFontSize(s),
    toggleTheme: (d) => controller.toggleTheme(d),
    selectVerse: (i) => controller.selectVerse(i),
    toggleAudio: (i) => controller.toggleAudio(i),
    stopAudio: () => controller.stopAudio(),
  };
}

export default useQuranAppController;
