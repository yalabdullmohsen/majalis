/** دورة حياة الإقلاع — لا عودة للخلف بعد done */
export type BootPhase = "idle" | "visible" | "dismissing" | "done";

let phase: BootPhase = "idle";

export function getBootPhase(): BootPhase {
  return phase;
}

export function transitionBootPhase(next: BootPhase): void {
  if (phase === "done") return;
  const order: BootPhase[] = ["idle", "visible", "dismissing", "done"];
  const cur = order.indexOf(phase);
  const nxt = order.indexOf(next);
  if (nxt < cur) return;
  phase = next;
}

export function resetBootPhaseForTests(): void {
  phase = "idle";
}

export const BOOT_MIN_VISIBLE_MS = 900;
export const BOOT_MAX_VISIBLE_MS = 1500;
export const BOOT_FADE_OUT_MS = 250;
/** سقف احتياطي — يمنع بقاء الطبقة لو تعثّر React */
export const BOOT_HARD_CAP_MS = 3000;

export const BOOT_SESSION_KEY = "mj.boot.session.v1";
