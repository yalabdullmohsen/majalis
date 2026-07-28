/**
 * Transparent network-drop / buffer-stall recovery for HTMLAudioElement.
 * Preserves currentTime and does not reset UI timeline markers.
 * Logic-only — no DOM/layout changes.
 */

export type StallRecoveryPhase = "idle" | "buffering" | "recovering" | "failed";

export type StallRecoveryCallbacks = {
  onPhaseChange?: (phase: StallRecoveryPhase) => void;
  /** Called when a transparent resume is attempted (same src, seek preserved). */
  onRecoverAttempt?: (attempt: number, savedTime: number) => void;
};

export type StallRecoveryOptions = StallRecoveryCallbacks & {
  /** Max transparent resume attempts per continuous stall sequence. Default 3. */
  maxAttempts?: number;
  /** Ignore micro-stalls shorter than this (ms). Default 600. */
  stallGraceMs?: number;
  /** Delay between recover attempts (ms). Default 400. */
  retryDelayMs?: number;
};

export type StallRecoveryHandle = {
  getPhase: () => StallRecoveryPhase;
  getSavedTime: () => number;
  reset: () => void;
  dispose: () => void;
};

/**
 * Attach waiting/stalled/error listeners that transparently re-open the
 * same media URL (byte-range friendly) and seek back to the stall position.
 */
export function attachAudioStallRecovery(
  audio: HTMLAudioElement,
  opts: StallRecoveryOptions = {},
): StallRecoveryHandle {
  const maxAttempts = opts.maxAttempts ?? 3;
  const stallGraceMs = opts.stallGraceMs ?? 600;
  const retryDelayMs = opts.retryDelayMs ?? 400;

  let phase: StallRecoveryPhase = "idle";
  let attempts = 0;
  let savedTime = 0;
  let graceTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  /** User intentionally paused — do not auto-resume. */
  let userPaused = false;

  const setPhase = (next: StallRecoveryPhase) => {
    if (phase === next) return;
    phase = next;
    opts.onPhaseChange?.(next);
  };

  const clearTimers = () => {
    if (graceTimer != null) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }
    if (retryTimer != null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  const captureTime = () => {
    const t = audio.currentTime;
    if (Number.isFinite(t) && t > 0) savedTime = t;
  };

  const seekAndPlay = () => {
    if (disposed || userPaused) return;
    try {
      if (Number.isFinite(savedTime) && savedTime > 0) {
        const dur = audio.duration;
        const target =
          Number.isFinite(dur) && dur > 0 ? Math.min(savedTime, Math.max(0, dur - 0.05)) : savedTime;
        if (Math.abs(audio.currentTime - target) > 0.25) {
          audio.currentTime = target;
        }
      }
    } catch {
      /* seek may throw while metadata not ready */
    }
    void audio.play().catch(() => {
      /* play rejection handled via error/waiting listeners */
    });
  };

  const rebindSameSrc = () => {
    const src = audio.currentSrc || audio.getAttribute("src") || "";
    if (!src) return false;
    // Re-assign identical URL so the UA opens a fresh connection / range request
    // without changing the logical track (UI ayah / timeline stay put).
    audio.src = src;
    audio.load();
    return true;
  };

  const attemptRecover = () => {
    if (disposed || userPaused) return;
    if (attempts >= maxAttempts) {
      setPhase("failed");
      return;
    }
    attempts += 1;
    setPhase("recovering");
    captureTime();
    opts.onRecoverAttempt?.(attempts, savedTime);

    const rebound = rebindSameSrc();
    if (!rebound) {
      seekAndPlay();
      return;
    }

    const onReady = () => {
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("loadedmetadata", onReady);
      seekAndPlay();
    };
    audio.addEventListener("canplay", onReady, { once: true });
    audio.addEventListener("loadedmetadata", onReady, { once: true });
  };

  const scheduleRecover = () => {
    if (disposed || userPaused || retryTimer != null) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      attemptRecover();
    }, retryDelayMs);
  };

  const onWaiting = () => {
    if (disposed || userPaused || audio.ended) return;
    if (phase === "recovering") return;
    captureTime();
    setPhase("buffering");
    if (graceTimer != null) clearTimeout(graceTimer);
    graceTimer = setTimeout(() => {
      graceTimer = null;
      if (disposed || userPaused || audio.ended) return;
      // Still starved for data?
      if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA && !audio.paused) {
        scheduleRecover();
      } else if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        setPhase("idle");
        attempts = 0;
      }
    }, stallGraceMs);
  };

  const onStalled = () => onWaiting();

  const onPlaying = () => {
    clearTimers();
    attempts = 0;
    setPhase("idle");
  };

  const onCanPlay = () => {
    if (phase === "buffering" || phase === "recovering") {
      // Data arrived — ensure we stay at saved position without UI reset
      try {
        if (Number.isFinite(savedTime) && savedTime > 0 && Math.abs(audio.currentTime - savedTime) > 0.5) {
          audio.currentTime = savedTime;
        }
      } catch {
        /* ignore */
      }
    }
  };

  const onPause = () => {
    // Distinguish ended vs intentional pause: ended fires separately.
    if (!audio.ended && audio.readyState > 0) {
      // Heuristic: if network idle and user didn't call play, treat as user pause
      // only when pause was not caused by buffer underrun (waiting sets buffering first).
      if (phase === "idle") userPaused = true;
    }
  };

  const onPlay = () => {
    userPaused = false;
  };

  const onError = () => {
    if (disposed || userPaused) return;
    const code = audio.error?.code;
    // MEDIA_ERR_NETWORK (2) or MEDIA_ERR_SRC_NOT_SUPPORTED (4) after partial play → resume
    if (code === 2 || code === 4 || code === 1) {
      captureTime();
      setPhase("buffering");
      scheduleRecover();
    }
  };

  audio.addEventListener("waiting", onWaiting);
  audio.addEventListener("stalled", onStalled);
  audio.addEventListener("playing", onPlaying);
  audio.addEventListener("canplay", onCanPlay);
  audio.addEventListener("pause", onPause);
  audio.addEventListener("play", onPlay);
  audio.addEventListener("error", onError);

  return {
    getPhase: () => phase,
    getSavedTime: () => savedTime,
    reset: () => {
      clearTimers();
      attempts = 0;
      savedTime = 0;
      userPaused = false;
      setPhase("idle");
    },
    dispose: () => {
      disposed = true;
      clearTimers();
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("stalled", onStalled);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("error", onError);
    },
  };
}

/**
 * Release decoded audio buffers by clearing src and calling load().
 * Call on unmount / surah change after pause.
 */
export function releaseAudioElement(audio: HTMLAudioElement | null | undefined): void {
  if (!audio) return;
  try {
    audio.pause();
  } catch {
    /* ignore */
  }
  try {
    audio.removeAttribute("src");
    audio.src = "";
    audio.load();
  } catch {
    /* ignore */
  }
}
