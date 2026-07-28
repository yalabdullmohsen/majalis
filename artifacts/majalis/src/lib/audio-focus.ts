/**
 * Audio focus / browser interruption helpers for HTML5 Audio.
 * Handles phone-call pauses, Bluetooth disconnects, page freeze — no UI.
 */

export type AudioFocusHandlers = {
  /** Persist resume state / mark interrupted */
  onInterrupted?: (reason: AudioInterruptReason) => void;
  /** Optional — system may allow resume after focus return */
  onMayResume?: () => void;
};

export type AudioInterruptReason =
  | "visibility"
  | "pagehide"
  | "freeze"
  | "stalled"
  | "error"
  | "pause";

/**
 * Bind lifecycle listeners that keep media state durable across interruptions.
 * Does NOT auto-pause on tab hide (background Quran/adhan must keep playing).
 * Returns a cleanup function for useEffect unmount.
 */
export function bindAudioFocusHandlers(
  audio: HTMLAudioElement,
  handlers: AudioFocusHandlers,
): () => void {
  const cleanups: Array<() => void> = [];

  const notify = (reason: AudioInterruptReason) => {
    try {
      handlers.onInterrupted?.(reason);
    } catch {
      /* never throw into browser media pipeline */
    }
  };

  const onPageHide = () => notify("pagehide");
  const onFreeze = () => notify("freeze");
  const onStalled = () => {
    if (!audio.paused) notify("stalled");
  };
  const onError = () => notify("error");
  const onPause = () => {
    // System interruptions (calls / BT) fire pause without a user gesture.
    // We still notify so callers can persist currentTime.
    if (!audio.ended) notify("pause");
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      notify("visibility");
    } else {
      try {
        handlers.onMayResume?.();
      } catch {
        /* ignore */
      }
    }
  };

  window.addEventListener("pagehide", onPageHide);
  cleanups.push(() => window.removeEventListener("pagehide", onPageHide));

  document.addEventListener("visibilitychange", onVisibility);
  cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

  // Page Lifecycle API (Chromium) — freeze when discarded to BFCache/background
  document.addEventListener("freeze", onFreeze as EventListener);
  cleanups.push(() => document.removeEventListener("freeze", onFreeze as EventListener));

  audio.addEventListener("stalled", onStalled);
  audio.addEventListener("error", onError);
  audio.addEventListener("pause", onPause);
  cleanups.push(() => {
    audio.removeEventListener("stalled", onStalled);
    audio.removeEventListener("error", onError);
    audio.removeEventListener("pause", onPause);
  });

  return () => {
    for (const c of cleanups) {
      try {
        c();
      } catch {
        /* ignore */
      }
    }
  };
}

/** Clear Media Session metadata + action handlers safely. */
export function clearMediaSession(): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const ms = navigator.mediaSession;
  try {
    ms.metadata = null;
    ms.playbackState = "none";
  } catch {
    /* ignore */
  }
  for (const action of ["play", "pause", "stop", "nexttrack", "previoustrack", "seekbackward", "seekforward"] as MediaSessionAction[]) {
    try {
      ms.setActionHandler(action, null);
    } catch {
      /* unsupported */
    }
  }
}
