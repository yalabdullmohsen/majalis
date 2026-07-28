/**
 * Adaptive audio buffer policy from network throughput / latency hints.
 * Logic-only — no UI.
 */

export type AudioPreloadMode = "none" | "metadata" | "auto";

export type AudioBufferPolicy = {
  preload: AudioPreloadMode;
  /** Stall grace before recovery (ms) */
  stallGraceMs: number;
  /** Max transparent stall retries */
  maxStallAttempts: number;
  /** Warm next ayah audio when true */
  warmNextAyah: boolean;
  /** Hint for Media Source / future MSE window (seconds of content to prefer buffered) */
  targetBufferSec: number;
  reasons: string[];
  rttMs: number | null;
  downlinkMbps: number | null;
  ect: string;
};

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
};

let lastSampleAt = 0;
let lastRtt: number | null = null;
let lastDownlink: number | null = null;

function readConnection(): NetworkInformationLike | null {
  try {
    return (
      (navigator as Navigator & { connection?: NetworkInformationLike }).connection ?? null
    );
  } catch {
    return null;
  }
}

/** Record an observed transfer sample (bytes, durationMs) to refine downlink estimate. */
export function observeAudioThroughput(bytes: number, durationMs: number): void {
  if (!Number.isFinite(bytes) || !Number.isFinite(durationMs) || durationMs <= 0) return;
  const mbps = (bytes * 8) / (durationMs / 1000) / 1_000_000;
  if (!Number.isFinite(mbps) || mbps <= 0) return;
  lastDownlink = lastDownlink == null ? mbps : lastDownlink * 0.7 + mbps * 0.3;
  lastSampleAt = Date.now();
}

export function observeAudioLatency(rttMs: number): void {
  if (!Number.isFinite(rttMs) || rttMs < 0) return;
  lastRtt = lastRtt == null ? rttMs : lastRtt * 0.6 + rttMs * 0.4;
  lastSampleAt = Date.now();
}

export function getAudioBufferPolicy(): AudioBufferPolicy {
  const conn = typeof navigator !== "undefined" ? readConnection() : null;
  const ect = conn?.effectiveType ?? "unknown";
  const saveData = !!conn?.saveData;
  const downlink = lastDownlink ?? conn?.downlink ?? null;
  const rtt = lastRtt ?? conn?.rtt ?? null;
  const reasons: string[] = [];

  let preload: AudioPreloadMode = "metadata";
  let stallGraceMs = 600;
  let maxStallAttempts = 3;
  let warmNextAyah = true;
  let targetBufferSec = 8;

  if (saveData) {
    reasons.push("save-data");
    preload = "none";
    warmNextAyah = false;
    targetBufferSec = 3;
    stallGraceMs = 900;
  }

  if (ect === "slow-2g" || ect === "2g") {
    reasons.push(`ect:${ect}`);
    preload = "auto"; // expand buffer window on slow links
    warmNextAyah = false;
    targetBufferSec = 20;
    stallGraceMs = 1_200;
    maxStallAttempts = 5;
  } else if (ect === "3g") {
    reasons.push("ect:3g");
    preload = "auto";
    warmNextAyah = true;
    targetBufferSec = 14;
    stallGraceMs = 900;
    maxStallAttempts = 4;
  } else if (ect === "4g" || ect === "unknown") {
    reasons.push(`ect:${ect}`);
    // Fast path: minimize start latency
    preload = "metadata";
    warmNextAyah = true;
    targetBufferSec = 6;
    stallGraceMs = 500;
  }

  if (rtt != null && rtt > 400) {
    reasons.push(`rtt:${Math.round(rtt)}`);
    preload = "auto";
    targetBufferSec = Math.max(targetBufferSec, 16);
    stallGraceMs = Math.max(stallGraceMs, 1_000);
  }

  if (downlink != null && downlink < 0.5) {
    reasons.push(`downlink:${downlink.toFixed(2)}`);
    preload = "auto";
    warmNextAyah = false;
    targetBufferSec = Math.max(targetBufferSec, 18);
  } else if (downlink != null && downlink > 5) {
    reasons.push("downlink:fast");
    preload = preload === "auto" ? "metadata" : preload;
    targetBufferSec = Math.min(targetBufferSec, 5);
  }

  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    reasons.push("hidden");
    warmNextAyah = false;
  }

  void lastSampleAt;
  return {
    preload,
    stallGraceMs,
    maxStallAttempts,
    warmNextAyah,
    targetBufferSec,
    reasons,
    rttMs: rtt,
    downlinkMbps: downlink,
    ect,
  };
}

/** Apply policy to an HTMLAudioElement (preload + no layout). */
export function applyAudioBufferPolicy(audio: HTMLAudioElement, policy = getAudioBufferPolicy()): void {
  try {
    audio.preload = policy.preload;
  } catch {
    /* ignore */
  }
}

export function resetAudioBufferPolicyForTests(): void {
  lastSampleAt = 0;
  lastRtt = null;
  lastDownlink = null;
}
