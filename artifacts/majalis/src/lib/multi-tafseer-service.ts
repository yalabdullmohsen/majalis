/**
 * Multi-Tafseer comparison — fetch several editions for one ayah side-by-side.
 * Caches via quran-api + offline IndexedDB mirror. Silent fallbacks.
 */

import {
  fetchTafsirAyahs,
  type TafsirAyah,
} from "@/lib/quran-api";
import { MUSHAF_TAFSIR_EDITIONS, type MushafTafsirEdition } from "@/lib/tafsir-seed";
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import { findGhareebInText, lookupGhareeb, type GhareebEntry } from "@/lib/ghareeb-quran-dictionary";

export type TafseerColumn = {
  editionId: string;
  label: string;
  author: string;
  level?: string;
  caution?: string;
  text: string;
  ok: boolean;
  error?: string;
};

export type MultiTafseerResult = {
  surah: number;
  ayah: number;
  columns: TafseerColumn[];
  ghareeb: GhareebEntry[];
};

const DEFAULT_EDITIONS = ["ar.muyassar", "ar.jalalayn", "ar.baghawi"] as const;

function editionMeta(id: string): MushafTafsirEdition | undefined {
  return MUSHAF_TAFSIR_EDITIONS.find((e) => e.id === id);
}

function cacheKey(edition: string, surah: number): string {
  return `tafsir-cmp-${edition}-${surah}`;
}

async function fetchEditionAyahsCached(
  edition: string,
  surah: number,
): Promise<TafsirAyah[]> {
  try {
    const cached = await idbGetValue<TafsirAyah[]>(OFFLINE_STORES.quran, cacheKey(edition, surah));
    if (cached?.length) return cached;
  } catch {
    /* ignore */
  }
  const ayahs = await fetchTafsirAyahs(surah, edition);
  if (ayahs.length) {
    void idbPut(OFFLINE_STORES.quran, cacheKey(edition, surah), ayahs).catch(() => undefined);
  }
  return ayahs;
}

/**
 * Load multiple tafsir texts for one ayah in parallel.
 * Never throws — failed editions appear with ok:false.
 */
export async function fetchMultiTafseerForAyah(
  surah: number,
  ayah: number,
  editionIds: string[] = [...DEFAULT_EDITIONS],
  verseTextForGhareeb?: string,
): Promise<MultiTafseerResult> {
  const ids = editionIds.length ? editionIds : [...DEFAULT_EDITIONS];
  const columns = await Promise.all(
    ids.map(async (editionId): Promise<TafseerColumn> => {
      const meta = editionMeta(editionId);
      try {
        const ayahs = await fetchEditionAyahsCached(editionId, surah);
        const hit = ayahs.find((a) => a.numberInSurah === ayah);
        if (!hit?.text) {
          return {
            editionId,
            label: meta?.label || editionId,
            author: meta?.author || "",
            level: meta?.level,
            caution: meta?.caution,
            text: "",
            ok: false,
            error: "لا نص لهذا الموضع في الطبعة",
          };
        }
        return {
          editionId,
          label: meta?.label || editionId,
          author: meta?.author || "",
          level: meta?.level,
          caution: meta?.caution,
          text: hit.text,
          ok: true,
        };
      } catch (err) {
        return {
          editionId,
          label: meta?.label || editionId,
          author: meta?.author || "",
          level: meta?.level,
          caution: meta?.caution,
          text: "",
          ok: false,
          error: err instanceof Error ? err.message : "تعذّر التحميل",
        };
      }
    }),
  );

  let ghareeb: GhareebEntry[] = [];
  try {
    if (verseTextForGhareeb) {
      ghareeb = findGhareebInText(verseTextForGhareeb);
    } else {
      const joined = columns.filter((c) => c.ok).map((c) => c.text).join(" ");
      ghareeb = findGhareebInText(joined);
    }
  } catch {
    ghareeb = [];
  }

  return { surah, ayah, columns, ghareeb };
}

export function listComparableTafsirEditions(): MushafTafsirEdition[] {
  return [...MUSHAF_TAFSIR_EDITIONS];
}

export { lookupGhareeb, findGhareebInText };
