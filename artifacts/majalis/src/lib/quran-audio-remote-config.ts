/**
 * مفتاح تعطيل مركزي لقرّاء/مصادر التلاوة.
 * يُجلب من `/data/quran-audio-remote.json` في وقت التشغيل (مع كسر كاش)
 * فيمكن إخفاء قارئ أو مصدر خلال دقائق بنشر الملف فقط.
 */

export type QuranAudioRemoteSource = "everyayah" | "mp3quran";

export type QuranAudioRemoteConfig = {
  updatedAt?: string;
  disabledReciterIds: string[];
  disabledSources: QuranAudioRemoteSource[];
  notes?: string;
};

const EMPTY: QuranAudioRemoteConfig = {
  disabledReciterIds: [],
  disabledSources: [],
};

let cached: QuranAudioRemoteConfig = EMPTY;
let fetchPromise: Promise<QuranAudioRemoteConfig> | null = null;
let lastFetchAt = 0;

const TTL_MS = 5 * 60 * 1000;

function normalize(raw: unknown): QuranAudioRemoteConfig {
  if (!raw || typeof raw !== "object") return EMPTY;
  const o = raw as Record<string, unknown>;
  const ids = Array.isArray(o.disabledReciterIds)
    ? o.disabledReciterIds.filter((x): x is string => typeof x === "string")
    : [];
  const sources = Array.isArray(o.disabledSources)
    ? o.disabledSources.filter(
        (x): x is QuranAudioRemoteSource => x === "everyayah" || x === "mp3quran",
      )
    : [];
  return {
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
    disabledReciterIds: ids,
    disabledSources: sources,
    notes: typeof o.notes === "string" ? o.notes : undefined,
  };
}

/** آخر إعداد محمّل (متزامن) — فارغ حتى أول جلب ناجح. */
export function getQuranAudioRemoteConfig(): QuranAudioRemoteConfig {
  return cached;
}

export function isReciterDisabled(reciterId: string): boolean {
  return cached.disabledReciterIds.includes(reciterId);
}

export function isAudioSourceDisabled(source: QuranAudioRemoteSource): boolean {
  return cached.disabledSources.includes(source);
}

/** للاختبارات فقط. */
export function __setQuranAudioRemoteConfigForTests(cfg: QuranAudioRemoteConfig | null): void {
  cached = cfg ?? EMPTY;
  lastFetchAt = 0;
  fetchPromise = null;
}

/**
 * يجلب الإعداد من الشبكة. آمن للاستدعاء المتكرر؛ يحترم TTL.
 * الفشل يُبقي آخر قيمة ناجحة (أو فارغة) — لا يعطّل التلاوة.
 */
export async function refreshQuranAudioRemoteConfig(opts?: {
  force?: boolean;
}): Promise<QuranAudioRemoteConfig> {
  const now = Date.now();
  if (!opts?.force && now - lastFetchAt < TTL_MS && lastFetchAt > 0) {
    return cached;
  }
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const url = `/data/quran-audio-remote.json?t=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: unknown = await res.json();
      cached = normalize(json);
      lastFetchAt = Date.now();
    } catch {
      /* أبقِ القيمة السابقة */
      if (lastFetchAt === 0) lastFetchAt = Date.now();
    } finally {
      fetchPromise = null;
    }
    return cached;
  })();

  return fetchPromise;
}
