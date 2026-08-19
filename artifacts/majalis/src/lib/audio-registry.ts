/**
 * Audio registry loader
 *
 * قائمة القرّاء المعروضة تُبنى من `public/data/audio/audio-registry.json`
 * بعد QA (verified=true فقط) — لا fallback ثابت يتجاوز الفحص.
 */
import type { QuranReciter } from "@/lib/quran-audio";
import { RECITERS } from "@/lib/quran-audio";

export type AudioRegistryReciter = {
  id: string;
  name?: string;
  style?: string;
  granularity?: "ayah" | "surah";
  bitrate?: number | null;
  source?: string;
  verified?: boolean;
  folder?: string;
  urlPattern?: string;
  filesPresent?: number;
  qaPassedAt?: string;
};

export type AudioRegistry = {
  version: number;
  updatedAt?: string;
  reciters: AudioRegistryReciter[];
  adhan?: unknown;
  tafsir?: unknown;
};

const REGISTRY_URL = "/data/audio/audio-registry.json";

/** ترتيب مفضّل عند العرض — لا يُفعّل قرّاءً لم يجتزوا QA. */
export const PREFERRED_RECITER_ORDER = ["husary", "minshawi", "alafasy"] as const;

function sortByPreferredOrder(reciters: QuranReciter[]): QuranReciter[] {
  const rank = new Map(PREFERRED_RECITER_ORDER.map((id, i) => [id, i]));
  return [...reciters].sort((a, b) => {
    const ra = rank.get(a.id as (typeof PREFERRED_RECITER_ORDER)[number]) ?? 999;
    const rb = rank.get(b.id as (typeof PREFERRED_RECITER_ORDER)[number]) ?? 999;
    return ra - rb;
  });
}

function mapVerifiedReciters(registry: AudioRegistry): QuranReciter[] {
  const byId = new Map(RECITERS.map((r) => [r.id, r] as const));
  const verified = registry.reciters
    .filter((r) => Boolean(r.verified) && typeof r.id === "string")
    .map((r) => byId.get(r.id))
    .filter((x): x is QuranReciter => Boolean(x));
  return sortByPreferredOrder(verified);
}

let registryPromise: Promise<AudioRegistry | null> | null = null;
let verifiedRecitersCache: QuranReciter[] | null = null;
let verifiedRegistryEntriesCache: AudioRegistryReciter[] | null = null;

export async function loadAudioRegistry(): Promise<AudioRegistry | null> {
  if (registryPromise) return registryPromise;
  registryPromise = (async () => {
    try {
      const res = await fetch(REGISTRY_URL, { credentials: "omit", cache: "no-store" });
      if (!res.ok) return null;
      const json = (await res.json()) as AudioRegistry;
      if (!json || !Array.isArray(json.reciters)) return null;
      return json;
    } catch {
      return null;
    }
  })();
  return registryPromise;
}

export async function getVerifiedReciters(): Promise<QuranReciter[]> {
  if (verifiedRecitersCache) return verifiedRecitersCache;

  const registry = await loadAudioRegistry();
  if (!registry) {
    verifiedRecitersCache = [];
    return verifiedRecitersCache;
  }

  verifiedRecitersCache = mapVerifiedReciters(registry);
  return verifiedRecitersCache;
}

/** مداخل السجل المُحقَّقة QA — لشاشة المصادر. */
export async function getVerifiedAudioRegistryEntries(): Promise<AudioRegistryReciter[]> {
  if (verifiedRegistryEntriesCache) return verifiedRegistryEntriesCache;
  const registry = await loadAudioRegistry();
  if (!registry) {
    verifiedRegistryEntriesCache = [];
    return verifiedRegistryEntriesCache;
  }
  const order = new Map(PREFERRED_RECITER_ORDER.map((id, i) => [id, i]));
  verifiedRegistryEntriesCache = registry.reciters
    .filter((r) => Boolean(r.verified) && typeof r.id === "string")
    .sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  return verifiedRegistryEntriesCache;
}

/**
 * Sync fallback قبل اكتمال fetch — فارغ حتى لا نعرض قرّاءً لم يجتزوا QA.
 */
export function getVerifiedRecitersSyncFallback(): QuranReciter[] {
  return verifiedRecitersCache ?? [];
}

/** @deprecated استخدم PREFERRED_RECITER_ORDER */
export const DEFAULT_VERIFIED_RECITER_IDS = PREFERRED_RECITER_ORDER;

/** يُعيد id قارئ مُحقَّق QA أو أول قارئ متاح. */
export function clampToVerifiedReciterId(id: string): string {
  const list = getVerifiedRecitersSyncFallback();
  if (list.some((r) => r.id === id)) return id;
  return list[0]?.id ?? id;
}

export function isVerifiedReciterId(id: string): boolean {
  return getVerifiedRecitersSyncFallback().some((r) => r.id === id);
}

export function __resetAudioRegistryForTests(): void {
  registryPromise = null;
  verifiedRecitersCache = null;
  verifiedRegistryEntriesCache = null;
}
