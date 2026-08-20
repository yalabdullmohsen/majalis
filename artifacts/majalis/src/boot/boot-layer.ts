import {
  BOOT_FADE_OUT_MS,
  BOOT_SESSION_KEY,
  transitionBootPhase,
} from "./boot-state";

const LAYER_ID = "mj-boot-layer";
const OUT_CLASS = "mj-boot-layer--out";

export function getBootLayerElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(LAYER_ID);
}

export function markBootSessionDone(): void {
  try {
    sessionStorage.setItem(BOOT_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasBootSessionDone(): boolean {
  try {
    return sessionStorage.getItem(BOOT_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

let removing = false;

export function removeBootLayer(immediate = false): void {
  if (removing) return;
  const el = getBootLayerElement();
  if (!el?.parentNode) return;

  removing = true;
  markBootSessionDone();
  transitionBootPhase("dismissing");

  const finish = () => {
    try {
      el.remove();
    } catch {
      /* ignore */
    }
    transitionBootPhase("done");
  };

  if (immediate) {
    finish();
    return;
  }

  el.classList.add(OUT_CLASS);
  window.setTimeout(finish, BOOT_FADE_OUT_MS);
}
