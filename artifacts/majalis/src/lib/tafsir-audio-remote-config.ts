/**
 * مفتاح تعطيل مركزي لمقاطع التفسير الصوتي.
 * يُجلب من `/data/tafsir-audio-remote.json` (TTL 5 دقائق، fail-open جزئي).
 */

export type TafsirAudioRemoteConfig = {
  updatedAt?: string;
  globalDisabled: boolean;
  disabledClipIds: string[];
  disabledScholarIds: string[];
  disabledSources: string[];
  notes?: string;
};

const EMPTY: TafsirAudioRemoteConfig = {
  globalDisabled: false,
  disabledClipIds: [],
  disabledScholarIds: [],
  disabledSources: [],
};

let cached: TafsirAudioRemoteConfig = EMPTY;
let fetchPromise: Promise<TafsirAudioRemoteConfig> | null = null;
let lastFetchAt = 0;
const TTL_MS = 5 * 60 * 1000;

function normalize(raw: unknown): TafsirAudioRemoteConfig {
  if (!raw || typeof raw !== "object") return EMPTY;
  const o = raw as Record<string, unknown>;
  const strArr = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  return {
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
    globalDisabled: o.globalDisabled === true,
    disabledClipIds: strArr(o.disabledClipIds),
    disabledScholarIds: strArr(o.disabledScholarIds),
    disabledSources: strArr(o.disabledSources),
    notes: typeof o.notes === "string" ? o.notes : undefined,
  };
}

export function getTafsirAudioRemoteConfig(): TafsirAudioRemoteConfig {
  return cached;
}

export function isTafsirAudioGloballyDisabled(): boolean {
  return cached.globalDisabled;
}

export function isTafsirClipDisabled(clipId: string, scholarId?: string, sourceId?: string): boolean {
  if (cached.globalDisabled) return true;
  if (cached.disabledClipIds.includes(clipId)) return true;
  if (scholarId && cached.disabledScholarIds.includes(scholarId)) return true;
  if (sourceId && cached.disabledSources.includes(sourceId)) return true;
  return false;
}

export function __setTafsirAudioRemoteConfigForTests(cfg: TafsirAudioRemoteConfig | null): void {
  cached = cfg ?? EMPTY;
  lastFetchAt = 0;
  fetchPromise = null;
}

export async function refreshTafsirAudioRemoteConfig(opts?: {
  force?: boolean;
}): Promise<TafsirAudioRemoteConfig> {
  const now = Date.now();
  if (!opts?.force && now - lastFetchAt < TTL_MS && lastFetchAt > 0) return cached;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch(`/data/tafsir-audio-remote.json?t=${now}`, {
        cache: "no-store",
        credentials: "omit",
      });
      if (res.ok) {
        cached = normalize(await res.json());
        lastFetchAt = Date.now();
      }
    } catch {
      /* fail-open: أبقِ آخر قيمة */
    } finally {
      fetchPromise = null;
    }
    return cached;
  })();

  return fetchPromise;
}
