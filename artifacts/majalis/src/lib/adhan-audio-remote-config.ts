/**
 * مفتاح تعطيل مركزي لتسجيلات/مصادر/أنماط الأذان.
 * يُجلب من `/data/adhan-audio-remote.json` (مع كسر كاش) — إخفاء خلال دقائق بلا إصدار جديد.
 */

import type { AdhanPatternId } from "./adhan-patterns";

export type AdhanAudioRemoteSource = "mohsalvi-adhan-audio";

export type AdhanAudioRemoteConfig = {
  updatedAt?: string;
  disabledRecordingIds: string[];
  disabledSources: AdhanAudioRemoteSource[];
  disabledPatternIds: AdhanPatternId[];
  notes?: string;
};

const EMPTY: AdhanAudioRemoteConfig = {
  disabledRecordingIds: [],
  disabledSources: [],
  disabledPatternIds: [],
};

const PATTERN_IDS = new Set<AdhanPatternId>([
  "makki",
  "madani",
  "aqsa",
  "egyptian",
  "levantine",
  "turkish",
]);

let cached: AdhanAudioRemoteConfig = EMPTY;
let fetchPromise: Promise<AdhanAudioRemoteConfig> | null = null;
let lastFetchAt = 0;

const TTL_MS = 5 * 60 * 1000;

function normalize(raw: unknown): AdhanAudioRemoteConfig {
  if (!raw || typeof raw !== "object") return EMPTY;
  const o = raw as Record<string, unknown>;
  const ids = Array.isArray(o.disabledRecordingIds)
    ? o.disabledRecordingIds.filter((x): x is string => typeof x === "string")
    : [];
  const sources = Array.isArray(o.disabledSources)
    ? o.disabledSources.filter(
        (x): x is AdhanAudioRemoteSource => x === "mohsalvi-adhan-audio",
      )
    : [];
  const patterns = Array.isArray(o.disabledPatternIds)
    ? o.disabledPatternIds.filter((x): x is AdhanPatternId =>
        typeof x === "string" && PATTERN_IDS.has(x as AdhanPatternId),
      )
    : [];
  return {
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
    disabledRecordingIds: ids,
    disabledSources: sources,
    disabledPatternIds: patterns,
    notes: typeof o.notes === "string" ? o.notes : undefined,
  };
}

export function getAdhanAudioRemoteConfig(): AdhanAudioRemoteConfig {
  return cached;
}

export function isAdhanRecordingDisabled(recordingId: string): boolean {
  return cached.disabledRecordingIds.includes(recordingId);
}

export function isAdhanSourceDisabled(source: AdhanAudioRemoteSource): boolean {
  return cached.disabledSources.includes(source);
}

export function isAdhanPatternDisabled(patternId: AdhanPatternId): boolean {
  return cached.disabledPatternIds.includes(patternId);
}

/** للاختبارات فقط. */
export function __setAdhanAudioRemoteConfigForTests(
  cfg: AdhanAudioRemoteConfig | null,
): void {
  cached = cfg ?? EMPTY;
  lastFetchAt = 0;
  fetchPromise = null;
}

export async function refreshAdhanAudioRemoteConfig(opts?: {
  force?: boolean;
}): Promise<AdhanAudioRemoteConfig> {
  const now = Date.now();
  if (!opts?.force && now - lastFetchAt < TTL_MS && lastFetchAt > 0) {
    return cached;
  }
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const url = `/data/adhan-audio-remote.json?t=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: unknown = await res.json();
      cached = normalize(json);
      lastFetchAt = Date.now();
    } catch {
      if (lastFetchAt === 0) lastFetchAt = Date.now();
    } finally {
      fetchPromise = null;
    }
    return cached;
  })();

  return fetchPromise;
}
