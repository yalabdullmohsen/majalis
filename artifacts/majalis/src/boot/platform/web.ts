import {
  BOOT_FADE_OUT_MS,
  BOOT_HARD_CAP_MS,
  BOOT_MAX_VISIBLE_MS,
  BOOT_MIN_VISIBLE_MS,
  transitionBootPhase,
} from "../boot-state";
import { getBootLayerElement, hasBootSessionDone, removeBootLayer } from "../boot-layer";

declare global {
  interface Window {
    __mjBootStart?: number;
    __mjBootDismiss?: (immediate?: boolean) => void;
  }
}

/** يُزال الهيكل الويبي عند أول رسم فعلي لـ React */
export function armWebBootDismiss(): void {
  if (typeof window === "undefined") return;
  if (hasBootSessionDone()) {
    removeBootLayer(true);
    return;
  }

  const layer = getBootLayerElement();
  if (!layer) return;
  transitionBootPhase("visible");

  let done = false;
  const dismiss = (immediate = false) => {
    if (done) return;
    done = true;
    removeBootLayer(immediate);
  };

  window.__mjBootDismiss = dismiss;

  const onPaint = () => dismiss(true);

  window.addEventListener("mj:app-painted", onPaint, { once: true });
  window.addEventListener("app:first-paint", onPaint, { once: true });
  window.setTimeout(() => dismiss(true), BOOT_HARD_CAP_MS);
}

/** تنسيق إخفاء طبقة HTML الأصلية 900–1500ms بعد أول رسم */
export function armNativeHtmlBootDismiss(): void {
  if (typeof window === "undefined") return;

  const dismiss = window.__mjBootDismiss;
  if (typeof dismiss !== "function") return;

  const start =
    typeof window.__mjBootStart === "number" ? window.__mjBootStart : performance.now();
  const reduced = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  const onPaint = () => {
    const elapsed = performance.now() - start;
    const maxStartExitAt = Math.max(0, BOOT_MAX_VISIBLE_MS - BOOT_FADE_OUT_MS - 60);
    const plannedExitAt = Math.min(Math.max(elapsed, BOOT_MIN_VISIBLE_MS), maxStartExitAt);
    const delay = Math.max(0, plannedExitAt - elapsed);
    window.setTimeout(() => dismiss(reduced), delay);
  };

  window.addEventListener("mj:app-painted", onPaint, { once: true });
}
