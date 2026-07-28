/**
 * Hardware capability detection → scale caches, fetch concurrency, prefetch.
 * Uses navigator.deviceMemory + hardwareConcurrency. Logic-only — no UI.
 */

export type DeviceTier = "low" | "mid" | "high";

export type DeviceCapabilities = {
  tier: DeviceTier;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number;
  /** Suggested in-memory LRU max entries */
  lruMax: number;
  /** Max concurrent pooled fetches */
  maxConcurrentFetches: number;
  /** Allow aggressive CDN prewarm */
  allowAggressivePrefetch: boolean;
  /** Mushaf font-fit binary search iterations */
  fontFitIterations: number;
  /** Knowledge-graph / heavy rAF state publish every N frames */
  rafPublishEvery: number;
};

let cached: DeviceCapabilities | null = null;

function readMemoryGb(): number | null {
  try {
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory > 0) return nav.deviceMemory;
  } catch {
    /* ignore */
  }
  return null;
}

function readCores(): number {
  try {
    const n = navigator.hardwareConcurrency;
    if (typeof n === "number" && n > 0) return n;
  } catch {
    /* ignore */
  }
  return 4;
}

export function getDeviceCapabilities(): DeviceCapabilities {
  if (cached) return cached;
  if (typeof navigator === "undefined") {
    cached = {
      tier: "mid",
      deviceMemoryGb: null,
      hardwareConcurrency: 4,
      lruMax: 32,
      maxConcurrentFetches: 4,
      allowAggressivePrefetch: true,
      fontFitIterations: 14,
      rafPublishEvery: 1,
    };
    return cached;
  }

  const mem = readMemoryGb();
  const cores = readCores();
  let tier: DeviceTier = "mid";
  if ((mem != null && mem <= 2) || cores <= 2) tier = "low";
  else if ((mem != null && mem >= 8) || cores >= 8) tier = "high";

  cached =
    tier === "low"
      ? {
          tier,
          deviceMemoryGb: mem,
          hardwareConcurrency: cores,
          lruMax: 12,
          maxConcurrentFetches: 2,
          allowAggressivePrefetch: false,
          fontFitIterations: 8,
          rafPublishEvery: 3,
        }
      : tier === "high"
        ? {
            tier,
            deviceMemoryGb: mem,
            hardwareConcurrency: cores,
            lruMax: 64,
            maxConcurrentFetches: 8,
            allowAggressivePrefetch: true,
            fontFitIterations: 14,
            rafPublishEvery: 1,
          }
        : {
            tier,
            deviceMemoryGb: mem,
            hardwareConcurrency: cores,
            lruMax: 32,
            maxConcurrentFetches: 4,
            allowAggressivePrefetch: true,
            fontFitIterations: 12,
            rafPublishEvery: 2,
          };

  return cached;
}

/** Scale a base LRU size by device tier. */
export function scaledLruSize(base: number): number {
  const { tier, lruMax } = getDeviceCapabilities();
  if (tier === "low") return Math.min(lruMax, Math.max(4, Math.floor(base * 0.4)));
  if (tier === "high") return Math.min(lruMax, Math.floor(base * 1.25));
  return Math.min(lruMax, base);
}

export function resetDeviceCapabilitiesForTests(): void {
  cached = null;
}

export function setDeviceCapabilitiesForTests(partial: Partial<DeviceCapabilities>): void {
  cached = { ...getDeviceCapabilities(), ...partial };
}
