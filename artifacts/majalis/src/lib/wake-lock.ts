/**
 * Screen Wake Lock lifecycle — acquire during active audio/reading,
 * release on pause / blur / hidden to save battery.
 * Logic-only — no UI.
 */

export type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: "release", listener: () => void) => void;
  removeEventListener?: (type: "release", listener: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

export type WakeLockHandle = {
  /** Currently holding an active lock */
  isHeld: () => boolean;
  /** Request lock if active session and page visible */
  request: () => Promise<boolean>;
  /** Release if held */
  release: () => Promise<void>;
  /** Mark study session active/inactive (audio playing / reading) */
  setSessionActive: (active: boolean) => void;
  dispose: () => void;
};

/**
 * Create a wake-lock controller. Re-acquires on visibility visible while session active.
 */
export function createWakeLockController(): WakeLockHandle {
  let sentinel: WakeLockSentinelLike | null = null;
  let sessionActive = false;
  let disposed = false;
  let requesting = false;

  const onVisibility = () => {
    if (disposed) return;
    if (document.visibilityState === "hidden") {
      void releaseInternal();
    } else if (sessionActive) {
      void requestInternal();
    }
  };

  const onPageHide = () => {
    void releaseInternal();
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
  }

  async function releaseInternal(): Promise<void> {
    const s = sentinel;
    sentinel = null;
    if (!s || s.released) return;
    try {
      await s.release();
    } catch {
      /* ignore */
    }
  }

  async function requestInternal(): Promise<boolean> {
    if (disposed || !sessionActive || requesting) return !!sentinel && !sentinel.released;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return false;
    }
    const nav = typeof navigator !== "undefined" ? (navigator as WakeLockNavigator) : null;
    if (!nav?.wakeLock?.request) return false;

    requesting = true;
    try {
      // Release stale sentinel first
      await releaseInternal();
      const lock = await nav.wakeLock.request("screen");
      sentinel = lock;
      lock.addEventListener?.("release", () => {
        if (sentinel === lock) sentinel = null;
      });
      return true;
    } catch {
      sentinel = null;
      return false;
    } finally {
      requesting = false;
    }
  }

  return {
    isHeld: () => !!sentinel && !sentinel.released,

    request: () => requestInternal(),

    release: () => releaseInternal(),

    setSessionActive: (active: boolean) => {
      sessionActive = active;
      if (active) void requestInternal();
      else void releaseInternal();
    },

    dispose: () => {
      disposed = true;
      sessionActive = false;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", onPageHide);
      }
      void releaseInternal();
    },
  };
}

/** Is Screen Wake Lock API available? */
export function isWakeLockSupported(): boolean {
  try {
    return typeof navigator !== "undefined" && !!(navigator as WakeLockNavigator).wakeLock?.request;
  } catch {
    return false;
  }
}
