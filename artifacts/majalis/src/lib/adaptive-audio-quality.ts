/**
 * Adaptive recitation bitrate preference from Network Information API.
 * Maps ECT → preferred quality band; picks an alternate featured reciter
 * when the current one has no matching folder (no new streaming stack).
 */

import { getVerifiedRecitersSyncFallback } from "@/lib/audio-registry";
import { getAudioBufferPolicy } from "@/lib/audio-buffer-policy";
import { getReciter, type QuranReciter } from "@/lib/quran-audio";

export type AudioQualityBand = "low" | "mid" | "high";

export function preferredAudioQualityBand(
  ect = getAudioBufferPolicy().ect,
  saveData = false,
): AudioQualityBand {
  if (saveData) return "low";
  const e = String(ect || "unknown").toLowerCase();
  if (e === "slow-2g" || e === "2g") return "low";
  if (e === "3g") return "mid";
  if (e === "4g") return "high";
  const policy = getAudioBufferPolicy();
  if (policy.downlinkMbps != null && policy.downlinkMbps < 0.7) return "low";
  if (policy.downlinkMbps != null && policy.downlinkMbps < 2) return "mid";
  return "high";
}

function parseKbps(label: string): number {
  const m = /(\d+)\s*kbps/i.exec(label);
  return m ? Number(m[1]) : 128;
}

function bandMatches(kbps: number, band: AudioQualityBand): boolean {
  if (band === "low") return kbps > 0 && kbps <= 64;
  if (band === "mid") return kbps > 64 && kbps <= 128;
  return kbps >= 128;
}

/**
 * If the active reciter is too heavy for the network, return a featured
 * alternate with a matching everyayah folder; otherwise return the same id.
 */
export function resolveAdaptiveReciterId(currentReciterId: string): string {
  const conn =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
          .connection
      : undefined;
  const band = preferredAudioQualityBand(conn?.effectiveType, !!conn?.saveData);
  const current = getReciter(currentReciterId);
  const kbps = parseKbps(current.qualityLabel || "");

  if (band === "high") return currentReciterId;
  if (band === "mid" && kbps <= 128 && current.everyayahFolder) return currentReciterId;
  if (band === "low" && kbps <= 64 && current.everyayahFolder) return currentReciterId;

  const pool = getVerifiedRecitersSyncFallback().filter((r) => r.everyayahFolder);
  const scored = pool
    .map((r) => ({ r, k: parseKbps(r.qualityLabel || "") }))
    .filter(({ k }) => bandMatches(k, band))
    .sort((a, b) => {
      // Prefer same language / keep closeness to current kbps
      return Math.abs(a.k - (band === "low" ? 64 : 128)) - Math.abs(b.k - (band === "low" ? 64 : 128));
    });

  const pick: QuranReciter | undefined = scored[0]?.r;
  return pick?.id ?? currentReciterId;
}
