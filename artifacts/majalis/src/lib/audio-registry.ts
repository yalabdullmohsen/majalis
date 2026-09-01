/**
 * Audio registry loader
 *
 * الهدف: قائمة القرّاء “المعروضة للمستخدم” تبنى من `public/data/audio/audio-registry.json`
 * بعد QA (verified=true) بدل الاعتماد على RECITERS ثابت.
 *
 * ملاحظة: RECITERS تبقى مصدر URL generation (everyayah/mp3quran) والتوافق مع باقي كود
 * تشغيل الآية-بآية.
 */
import type { QuranReciter } from "@/lib/quran-audio";
import { RECITERS } from "@/lib/quran-audio";
import { getEnabledReciters, isReciterEnabled } from "@/config/quranReciters";

export type AudioRegistryReciter = {
  id: string;
  name?: string;
  style?: string;
  granularity?: "ayah" | "surah";
  bitrate?: number | null;
  source?: string;
  verified?: boolean;
};

export type AudioRegistry = {
  version: number;
  updatedAt?: string;
  reciters: AudioRegistryReciter[];
  adhan?: unknown;
  tafsir?: unknown;
};

const REGISTRY_URL = "/data/audio/audio-registry.json";

// البداية المطلوبة: قرّاء مُحقَّقون QA (يشمل ياسر الدوسري وسعود الشريم).
export const DEFAULT_VERIFIED_RECITER_IDS = [
  "husary",
  "minshawi",
  "alafasy",
  "dosari",
  "shuraim",
] as const;

function fallbackVerifiedReciters(): QuranReciter[] {
  const order = new Set<string>(DEFAULT_VERIFIED_RECITER_IDS as readonly string[]);
  // Preserve order defined in DEFAULT_VERIFIED_RECITER_IDS.
  const byId = new Map(RECITERS.map((r) => [r.id, r] as const));
  const out: QuranReciter[] = [];
  for (const id of DEFAULT_VERIFIED_RECITER_IDS) {
    const r = byId.get(id);
    if (r) out.push(r);
  }
  // If for some reason mapping failed, degrade gracefully.
  if (out.length > 0) return out;
  return RECITERS.filter((r) => order.has(r.id));
}

let registryPromise: Promise<AudioRegistry | null> | null = null;
let verifiedRecitersCache: QuranReciter[] | null = null;

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
    verifiedRecitersCache = fallbackVerifiedReciters();
    return verifiedRecitersCache;
  }

  // verified=true only.
  const byId = new Map(RECITERS.map((r) => [r.id, r] as const));
  const verified = registry.reciters
    .filter((r) => Boolean(r.verified) && typeof r.id === "string")
    .map((r) => byId.get(r.id))
    .filter((x): x is QuranReciter => Boolean(x));

  verifiedRecitersCache = (verified.length > 0 ? verified : fallbackVerifiedReciters()).filter(
    (r) => Boolean(r.everyayahFolder) && isReciterEnabled(r.id),
  );
  if (verifiedRecitersCache.length === 0) {
    verifiedRecitersCache = fallbackVerifiedReciters();
  }
  return verifiedRecitersCache;
}

/**
 * Sync fallback for initial render (before the registry fetch completes).
 * UI will update once `getVerifiedReciters()` resolves.
 */
export function getVerifiedRecitersSyncFallback(): QuranReciter[] {
  const enabledIds = new Set(getEnabledReciters().map((r) => r.id));
  return fallbackVerifiedReciters().filter((r) => enabledIds.has(r.id));
}

/** يُعيد id قارئ مُحقَّق QA أو أول قارئ افتراضي. */
export function clampToVerifiedReciterId(id: string): string {
  const list = getVerifiedRecitersSyncFallback();
  if (list.some((r) => r.id === id)) return id;
  return list[0]?.id ?? "alafasy";
}

export function isVerifiedReciterId(id: string): boolean {
  return getVerifiedRecitersSyncFallback().some((r) => r.id === id);
}

export function __resetAudioRegistryForTests(): void {
  registryPromise = null;
  verifiedRecitersCache = null;
}

