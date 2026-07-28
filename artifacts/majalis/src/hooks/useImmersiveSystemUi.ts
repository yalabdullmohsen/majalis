/**
 * Flutter `SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky)` port.
 * Cleanup on disable / unmount restores StatusBar + theme-color.
 *
 * Stylesheet: import `@/styles/quran-immersive-reader.css` from the reader shell
 * (kept out of this hook so Node unit tests can import hooks without Vite CSS).
 */
import { useEffect } from "react";
import {
  enterImmersiveSystemUi,
  exitImmersiveSystemUi,
  IMMERSIVE_PAPER_BG,
} from "@/lib/quran-immersive";

/**
 * @param enabled — when true, hide system / browser chrome chrome for reading.
 * @param paperBg — theme-color / CSS paper (default Flutter cream `#F5F5DC`).
 */
export function useImmersiveSystemUi(
  enabled: boolean,
  paperBg: string = IMMERSIVE_PAPER_BG,
): void {
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void enterImmersiveSystemUi(paperBg).then(() => {
      if (!active) void exitImmersiveSystemUi();
    });
    return () => {
      active = false;
      void exitImmersiveSystemUi();
    };
  }, [enabled, paperBg]);
}

export default useImmersiveSystemUi;
