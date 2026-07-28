/**
 * Final polish boot — registers unload persistence producers early.
 * Logic-only; no UI. Called once from main.tsx.
 */

import { registerUnloadPersist, flushUnloadPersist } from "@/lib/unload-persist";
import { USER_STREAK_LS_KEY, getUserStreak } from "@/lib/user-streak";
import { DAILY_PROGRESS_LS_KEY } from "@/lib/daily-progress";
import { flushAudioResumeState } from "@/lib/quran-audio-resume";

let booted = false;

/**
 * Idempotent boot of Part-5 durability layer.
 * Ensures streak/progress keys are re-flushed on pagehide even if module
 * writers were never touched in this session (cold tab restore).
 */
export function initFinalPolish(): void {
  if (booted || typeof window === "undefined") return;
  booted = true;

  registerUnloadPersist("boot:user-streak", () => {
    try {
      const state = getUserStreak();
      return { [USER_STREAK_LS_KEY]: JSON.stringify(state) };
    } catch {
      return null;
    }
  });

  registerUnloadPersist("boot:daily-progress-touch", () => {
    try {
      const raw = localStorage.getItem(DAILY_PROGRESS_LS_KEY);
      if (!raw) return null;
      return { [DAILY_PROGRESS_LS_KEY]: raw };
    } catch {
      return null;
    }
  });

  // Extra safety: flush staged audio resume before browser kills the page
  const onHide = () => {
    try {
      flushAudioResumeState();
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("pagehide", onHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") onHide();
  });

  // Expose for diagnostics / tests only
  (window as unknown as { __majalisFlushUnload?: () => void }).__majalisFlushUnload = flushUnloadPersist;
}
