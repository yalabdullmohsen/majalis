/**
 * وحدة الإقلاع — مالك واحد لدورة الحياة.
 * mountBoot() / dismissBoot() — الاستدعاء الوحيد من main.tsx
 */
import { isNative } from "@/lib/capacitor-utils";
import { transitionBootPhase } from "./boot-state";
import { getBootLayerElement, hasBootSessionDone, removeBootLayer } from "./boot-layer";
import { armWebBootDismiss } from "./platform/web";
import { armNativeBootHandoff } from "./platform/android";

/** إطفاء سريع بلا نشر — VITE_BOOT_LAYER_ENABLED=false */
export const BOOT_LAYER_ENABLED =
  typeof import.meta.env.VITE_BOOT_LAYER_ENABLED === "undefined" ||
  import.meta.env.VITE_BOOT_LAYER_ENABLED !== "false";

export function dismissBoot(immediate = false): void {
  removeBootLayer(immediate);
}

export function mountBoot(): void {
  if (!BOOT_LAYER_ENABLED) {
    removeBootLayer(true);
    return;
  }

  if (hasBootSessionDone()) {
    removeBootLayer(true);
    return;
  }

  const layer = getBootLayerElement();
  if (!layer) {
    transitionBootPhase("done");
    return;
  }

  transitionBootPhase("visible");

  if (isNative) {
    armNativeBootHandoff();
  } else {
    armWebBootDismiss();
  }
}

export {
  BOOT_FADE_OUT_MS,
  BOOT_HARD_CAP_MS,
  BOOT_MAX_VISIBLE_MS,
  BOOT_MIN_VISIBLE_MS,
  BOOT_SESSION_KEY,
} from "./boot-state";
