/**
 * Instant grouped autocomplete (<100ms target) from the local unified index.
 * Groups: آيات · أحاديث · كتب وفقه · علماء
 */
import { loadUnifiedSearchIndex, searchUnifiedIndex } from "@/features/search/unified-local";
import { normalizeArabic } from "@/shared/arabic-normalize";
import type { AppSearchResult } from "@/features/search/app-search";

export type AutocompleteGroupId = "quran" | "hadith" | "books" | "scholars";

export const AUTOCOMPLETE_GROUP_LABELS: Record<AutocompleteGroupId, string> = {
  quran: "آيات قرآنية",
  hadith: "أحاديث نبوية",
  books: "كتب وفقه",
  scholars: "ترجمة علماء",
};

const KIND_TO_GROUP: Record<string, AutocompleteGroupId> = {
  surah: "quran",
  quran: "quran",
  ayah: "quran",
  page: "quran",
  tafsir: "quran",
  "tafsir-audio": "quran",
  hadith: "hadith",
  book: "books",
  library: "books",
  lesson: "books",
  course: "books",
  fatwa: "books",
  qa: "books",
  ruling: "books",
  fiqh: "books",
  fiqh_decision: "books",
  fawaid: "books",
  scholar: "scholars",
  sheikh: "scholars",
  person: "scholars",
};

export type AutocompleteGroup = {
  id: AutocompleteGroupId;
  label: string;
  items: AppSearchResult[];
};

export type AutocompleteResponse = {
  query: string;
  groups: AutocompleteGroup[];
  responseMs: number;
  source: "local-index";
};

const MAX_PER_GROUP = 5;

function toGroup(kind: string): AutocompleteGroupId | null {
  return KIND_TO_GROUP[kind] ?? null;
}

/**
 * Local-only autocomplete — no network. Suitable for NavBar / GlobalSearch.
 */
export async function runAutocomplete(
  rawQuery: string,
  opts: { perGroup?: number; signal?: AbortSignal } = {},
): Promise<AutocompleteResponse> {
  const t0 = performance.now();
  const query = rawQuery.trim();
  const empty: AutocompleteResponse = {
    query,
    groups: [],
    responseMs: 0,
    source: "local-index",
  };
  if (!query || normalizeArabic(query).length < 1) {
    return { ...empty, responseMs: performance.now() - t0 };
  }

  const { docs } = await loadUnifiedSearchIndex();
  if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const perGroup = opts.perGroup ?? MAX_PER_GROUP;
  const grouped = searchUnifiedIndex(docs, query, perGroup * 8);

  const buckets: Record<AutocompleteGroupId, AppSearchResult[]> = {
    quran: [],
    hadith: [],
    books: [],
    scholars: [],
  };

  for (const [kind, hits] of Object.entries(grouped)) {
    const gid = toGroup(kind);
    if (!gid) continue;
    for (const h of hits) {
      if (buckets[gid].length >= perGroup) break;
      buckets[gid].push({
        id: h.id,
        kind: h.kind || kind,
        title: h.titleAr,
        href: h.href,
        summary: h.meta,
        match: h.match,
      });
    }
  }

  const order: AutocompleteGroupId[] = ["quran", "hadith", "books", "scholars"];
  const groups: AutocompleteGroup[] = order
    .filter((id) => buckets[id].length > 0)
    .map((id) => ({
      id,
      label: AUTOCOMPLETE_GROUP_LABELS[id],
      items: buckets[id],
    }));

  return {
    query,
    groups,
    responseMs: performance.now() - t0,
    source: "local-index",
  };
}
