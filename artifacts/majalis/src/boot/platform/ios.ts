import { Capacitor } from "@capacitor/core";
import {
  BOOT_FADE_OUT_MS,
  BOOT_MAX_VISIBLE_MS,
  transitionBootPhase,
} from "../boot-state";
import { getBootLayerElement, hasBootSessionDone, removeBootLayer } from "../boot-layer";
import { armNativeHtmlBootDismiss } from "./web";

let nativeHidden = false;

export async function hideNativeLaunchScreen(immediate = false): Promise<void> {
  if (nativeHidden) return;
  nativeHidden = true;
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({
      fadeOutDuration: immediate ? 0 : BOOT_FADE_OUT_MS,
    });
  } catch {
    /* منصّة بلا ملحق */
  }
}

/** iOS: LaunchScreen أصلية → تسليم للطبقة HTML */
export function armIosBootHandoff(): void {
  if (!Capacitor.isNativePlatform()) return;
  if (hasBootSessionDone()) {
    void hideNativeLaunchScreen(true);
    removeBootLayer(true);
    return;
  }

  const layer = getBootLayerElement();
  if (!layer) return;
  transitionBootPhase("visible");

  armNativeHtmlBootDismiss();

  const deadline = window.setTimeout(() => {
    void hideNativeLaunchScreen(false);
    removeBootLayer(false);
  }, BOOT_MAX_VISIBLE_MS);

  const handoff = () => {
    window.clearTimeout(deadline);
    void hideNativeLaunchScreen(false);
  };

  window.addEventListener("mj:app-painted", handoff, { once: true });
  window.addEventListener("app:first-paint", handoff, { once: true });

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void hideNativeLaunchScreen(false);
      });
    });
  } else {
    window.setTimeout(() => void hideNativeLaunchScreen(false), 0);
  }
}
