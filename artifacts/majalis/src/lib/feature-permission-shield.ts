/**
 * Unified permission / feature capability shield.
 * Probes Web APIs and returns structured fallbacks — never throws into UI.
 * Logic-only — no layout/CSS.
 */

export type FeatureKey =
  | "microphone"
  | "notifications"
  | "storagePersist"
  | "autoplay"
  | "orientation";

export type FeatureState = "granted" | "denied" | "prompt" | "unsupported" | "unknown";

export type FeatureProbeResult = {
  key: FeatureKey;
  supported: boolean;
  state: FeatureState;
  /** Safe to attempt the privileged API. */
  canUse: boolean;
  /** Machine-readable fallback code for callers. */
  fallback: "ok" | "unsupported" | "denied" | "blocked" | "unavailable";
};

function asState(v: PermissionState | string | undefined): FeatureState {
  if (v === "granted" || v === "denied" || v === "prompt") return v;
  return "unknown";
}

async function queryPermission(name: PermissionName): Promise<FeatureState> {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const status = await navigator.permissions.query({ name });
    return asState(status.state);
  } catch {
    return "unknown";
  }
}

export async function probeFeature(key: FeatureKey): Promise<FeatureProbeResult> {
  // Autoplay is always soft-available; tryAutoplay handles NotAllowedError.
  if (key === "autoplay") {
    return { key, supported: true, state: "unknown", canUse: true, fallback: "ok" };
  }

  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { key, supported: false, state: "unsupported", canUse: false, fallback: "unsupported" };
  }

  switch (key) {
    case "microphone": {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      if (!supported) {
        return { key, supported: false, state: "unsupported", canUse: false, fallback: "unsupported" };
      }
      const state = await queryPermission("microphone" as PermissionName);
      if (state === "denied") {
        return { key, supported: true, state, canUse: false, fallback: "denied" };
      }
      return {
        key,
        supported: true,
        state,
        canUse: state === "granted" || state === "prompt" || state === "unknown",
        fallback: state === "granted" || state === "prompt" || state === "unknown" ? "ok" : "denied",
      };
    }
    case "notifications": {
      const supported = typeof Notification !== "undefined";
      if (!supported) {
        return { key, supported: false, state: "unsupported", canUse: false, fallback: "unsupported" };
      }
      const perm = Notification.permission;
      const state = asState(perm);
      return {
        key,
        supported: true,
        state,
        canUse: perm === "granted" || perm === "default",
        fallback: perm === "denied" ? "denied" : perm === "granted" ? "ok" : "ok",
      };
    }
    case "storagePersist": {
      const supported = !!(navigator.storage && typeof navigator.storage.persist === "function");
      if (!supported) {
        return { key, supported: false, state: "unsupported", canUse: false, fallback: "unsupported" };
      }
      try {
        const persisted = await navigator.storage.persisted?.();
        if (persisted) {
          return { key, supported: true, state: "granted", canUse: true, fallback: "ok" };
        }
        return { key, supported: true, state: "prompt", canUse: true, fallback: "ok" };
      } catch {
        return { key, supported: true, state: "unknown", canUse: false, fallback: "unavailable" };
      }
    }
    case "orientation": {
      const DOE = (
        window as unknown as {
          DeviceOrientationEvent?: { requestPermission?: () => Promise<PermissionState> };
        }
      ).DeviceOrientationEvent;
      const needsPrompt = typeof DOE?.requestPermission === "function";
      const supported = "DeviceOrientationEvent" in window;
      if (!supported) {
        return { key, supported: false, state: "unsupported", canUse: false, fallback: "unsupported" };
      }
      return {
        key,
        supported: true,
        state: needsPrompt ? "prompt" : "granted",
        canUse: true,
        fallback: "ok",
      };
    }
    default:
      return { key, supported: false, state: "unsupported", canUse: false, fallback: "unsupported" };
  }
}

/**
 * Attempt to enable a feature. Never throws.
 * For microphone: does not open a stream (callers use getUserMedia); only probes.
 * For storagePersist: calls persist() when available.
 * For notifications: calls requestPermission when default.
 */
export async function ensureFeature(key: FeatureKey): Promise<FeatureProbeResult> {
  const probe = await probeFeature(key);
  if (!probe.supported) return probe;

  if (key === "storagePersist" && probe.state !== "granted") {
    try {
      const ok = await navigator.storage!.persist!();
      return {
        key,
        supported: true,
        state: ok ? "granted" : "denied",
        canUse: ok,
        fallback: ok ? "ok" : "denied",
      };
    } catch {
      return { ...probe, canUse: false, fallback: "blocked" };
    }
  }

  if (key === "notifications" && Notification.permission === "default") {
    try {
      const perm = await Notification.requestPermission();
      return {
        key,
        supported: true,
        state: asState(perm),
        canUse: perm === "granted",
        fallback: perm === "granted" ? "ok" : "denied",
      };
    } catch {
      return { ...probe, canUse: false, fallback: "blocked" };
    }
  }

  return probe;
}

/** Soft autoplay attempt — returns false on NotAllowedError without throwing. */
export async function tryAutoplay(el: HTMLMediaElement): Promise<boolean> {
  try {
    await el.play();
    return true;
  } catch {
    return false;
  }
}

/** Request persistent storage once at boot (best-effort). */
export function initStoragePersistence(): void {
  if (typeof window === "undefined") return;
  const kick = () => {
    void ensureFeature("storagePersist");
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(kick, { timeout: 8_000 });
  } else {
    setTimeout(kick, 4_000);
  }
}
