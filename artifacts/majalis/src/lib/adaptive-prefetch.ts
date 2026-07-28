/**
 * Adaptive network & battery aware prefetch policy.
 * Throttles/disables aggressive pre-fetch when on 2G/3G, save-data, or low battery.
 * Logic-only — no UI.
 */

export type EffectiveConnectionType = "slow-2g" | "2g" | "3g" | "4g" | "unknown";

export type PrefetchBudget = {
  /** Allow DNS/TLS preconnect only */
  allowPreconnect: boolean;
  /** Allow warm GET of text APIs / mushaf JSON */
  allowTextPrefetch: boolean;
  /** Allow next-ayah / surah audio buffer warm */
  allowAudioPrefetch: boolean;
  /** Max concurrent speculative fetches */
  maxConcurrent: number;
  /** Reason codes for telemetry/debug */
  reasons: string[];
  ect: EffectiveConnectionType;
  saveData: boolean;
  batteryLevel: number | null;
  batteryCharging: boolean | null;
};

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
};

type BatteryManagerLike = {
  level: number;
  charging: boolean;
};

let cachedBattery: BatteryManagerLike | null = null;
let batteryProbe: Promise<void> | null = null;

function readEct(): EffectiveConnectionType {
  try {
    const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    const t = conn?.effectiveType;
    if (t === "slow-2g" || t === "2g" || t === "3g" || t === "4g") return t;
  } catch {
    /* ignore */
  }
  return "unknown";
}

function readSaveData(): boolean {
  try {
    const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    return !!conn?.saveData;
  } catch {
    return false;
  }
}

/** Best-effort battery probe (Chrome); caches result. */
export function probeBattery(): Promise<void> {
  if (typeof navigator === "undefined") return Promise.resolve();
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<BatteryManagerLike>;
  };
  if (typeof nav.getBattery !== "function") return Promise.resolve();
  if (batteryProbe) return batteryProbe;
  batteryProbe = nav
    .getBattery()
    .then((b) => {
      cachedBattery = { level: b.level, charging: b.charging };
      try {
        // BatteryManager is EventTarget in browsers
        (b as unknown as EventTarget).addEventListener?.("levelchange", () => {
          cachedBattery = { level: b.level, charging: b.charging };
        });
        (b as unknown as EventTarget).addEventListener?.("chargingchange", () => {
          cachedBattery = { level: b.level, charging: b.charging };
        });
      } catch {
        /* ignore */
      }
    })
    .catch(() => {
      cachedBattery = null;
    });
  return batteryProbe;
}

export function getPrefetchBudget(overrides?: {
  lowBatteryThreshold?: number;
}): PrefetchBudget {
  const lowBat = overrides?.lowBatteryThreshold ?? 0.15;
  const ect = typeof navigator !== "undefined" ? readEct() : "unknown";
  const saveData = typeof navigator !== "undefined" ? readSaveData() : false;
  const level = cachedBattery?.level ?? null;
  const charging = cachedBattery?.charging ?? null;
  const reasons: string[] = [];

  let allowPreconnect = true;
  let allowTextPrefetch = true;
  let allowAudioPrefetch = true;
  let maxConcurrent = 3;

  if (saveData) {
    reasons.push("save-data");
    allowAudioPrefetch = false;
    allowTextPrefetch = false;
    maxConcurrent = 0;
  }

  if (ect === "slow-2g" || ect === "2g") {
    reasons.push(`ect:${ect}`);
    allowAudioPrefetch = false;
    allowTextPrefetch = false;
    allowPreconnect = false;
    maxConcurrent = 0;
  } else if (ect === "3g") {
    reasons.push("ect:3g");
    allowAudioPrefetch = false;
    allowTextPrefetch = true;
    maxConcurrent = 1;
  }

  if (level != null && level < lowBat && charging !== true) {
    reasons.push(`battery:${Math.round(level * 100)}%`);
    allowAudioPrefetch = false;
    allowTextPrefetch = false;
    maxConcurrent = Math.min(maxConcurrent, 0);
  }

  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    reasons.push("hidden");
    allowAudioPrefetch = false;
    allowTextPrefetch = false;
  }

  return {
    allowPreconnect,
    allowTextPrefetch,
    allowAudioPrefetch,
    maxConcurrent,
    reasons,
    ect,
    saveData,
    batteryLevel: level,
    batteryCharging: charging,
  };
}

/** Gate a prefetch action; returns false when budget forbids it. */
export function shouldPrefetch(kind: "preconnect" | "text" | "audio"): boolean {
  const b = getPrefetchBudget();
  if (kind === "preconnect") return b.allowPreconnect;
  if (kind === "text") return b.allowTextPrefetch;
  return b.allowAudioPrefetch;
}

/** Test helper */
export function resetAdaptivePrefetchForTests(): void {
  cachedBattery = null;
  batteryProbe = null;
}

export function setBatteryForTests(b: BatteryManagerLike | null): void {
  cachedBattery = b;
}
