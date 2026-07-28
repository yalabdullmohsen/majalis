/**
 * React binding for Flutter `QuranController` / `ChangeNotifier`.
 * Uses `useSyncExternalStore` so UI updates on `notifyListeners()`.
 */
import { useMemo, useSyncExternalStore } from "react";
import {
  createQuranController,
  type QuranController,
  type QuranControllerSnapshot,
} from "@/lib/quran-controller";

export type UseQuranControllerResult = QuranControllerSnapshot & {
  controller: QuranController;
  selectVerse: (index: number) => void;
  clearSelection: () => void;
  togglePlayback: () => void;
  setPlaying: (playing: boolean) => void;
};

/**
 * @param external — optional shared controller (SSOT across page + sheet).
 *                   If omitted, creates one per hook instance.
 */
export function useQuranController(external?: QuranController): UseQuranControllerResult {
  const controller = useMemo(
    () => external ?? createQuranController(),
    [external],
  );

  const snap = useSyncExternalStore(
    (onStoreChange) => controller.subscribe(onStoreChange),
    () => controller.getSnapshot(),
    () => controller.getSnapshot(),
  );

  return {
    ...snap,
    controller,
    selectVerse: (index: number) => controller.selectVerse(index),
    clearSelection: () => controller.clearSelection(),
    togglePlayback: () => controller.togglePlayback(),
    setPlaying: (playing: boolean) => controller.setPlaying(playing),
  };
}

export default useQuranController;
