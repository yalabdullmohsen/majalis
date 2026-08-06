import { requestFetch } from "@/lib/request-manager";
import { CONTENT_CURRICULUM_ENABLED, isCurriculumRuling } from "./content-flags";
import type { ShariaRulingExtended } from "./rulings-types";

export { RULINGS_ENCYCLOPEDIA_SEED, RULINGS_ENCYCLOPEDIA_TOTAL } from "./rulings-encyclopedia-seed.generated";

type Manifest = {
  version: number;
  total: number;
  chunks: { category: string; file: string; count: number }[];
};

let manifestCache: Manifest | null = null;
let allChunksCache: ShariaRulingExtended[] | null = null;

const BASE = "/data/rulings-encyclopedia";

export async function loadRulingsManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache;
  try {
    const res = await requestFetch(`${BASE}/manifest.json`);
    if (!res.ok) throw new Error(String(res.status));
    manifestCache = (await res.json()) as Manifest;
    return manifestCache;
  } catch {
    return { version: 1, total: 0, chunks: [] };
  }
}

export async function loadAllRulingsFromChunks(): Promise<ShariaRulingExtended[]> {
  if (allChunksCache) return allChunksCache;

  const manifest = await loadRulingsManifest();
  if (!manifest.chunks.length) {
    allChunksCache = [];
    return allChunksCache;
  }

  const chunks = await Promise.all(
    manifest.chunks.map(async (c) => {
      try {
        const res = await requestFetch(`${BASE}/${c.file}`);
        if (!res.ok) return [];
        return (await res.json()) as ShariaRulingExtended[];
      } catch {
        return [];
      }
    }),
  );

  const flat = chunks.flat();
  const allowed = flat.filter((item) => {
    const key = String(item.external_key || item.id || "");
    if (key.startsWith("qa-ruling") || key.startsWith("qa-")) return false;
    const title = String(item.title || "").trim();
    if (/[؟?]\s*$/u.test(title)) return false;
    if (/^(هل|كيف|متى|أين|لماذا|كم)\b/u.test(title)) return false;
    return true;
  });
  allChunksCache = CONTENT_CURRICULUM_ENABLED
    ? allowed
    : allowed.filter((item) => !isCurriculumRuling(item));
  return allChunksCache;
}

export function invalidateRulingsCache() {
  manifestCache = null;
  allChunksCache = null;
}
