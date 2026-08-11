/**
 * نقطة الدخول الوحيدة للبحث الشامل في التطبيق.
 * فهرس مطبّع مسبقًا + تطبيع مشترك + دمج دلالي اختياري (هجين) عند الاتصال.
 */
import {
  loadUnifiedSearchIndex,
  searchUnifiedIndex,
  searchUnifiedIndexAsync,
  type UnifiedSearchHit,
} from "@/features/search/unified-local";
import { kindPriority } from "@/features/search/kind-priority";
import { parseQuickNav } from "@/features/search/quick-nav";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { scoreTolerantMatch, type TolerantMatch } from "@/features/search/tolerant-match";
import {
  attachGroups,
  fetchSemanticHits,
  mergeHybridResults,
  readCachedHybridResults,
  writeCachedHybridResults,
  type HybridSearchSource,
} from "@/features/search/hybrid-search";
import { isOnline } from "@/lib/offline-db";
import { trackAnonymousSearch } from "@/lib/privacy-telemetry";

export type AppSearchResult = {
  id: string;
  kind: string;
  title: string;
  href: string;
  summary?: string;
  match?: TolerantMatch;
};

export type AppSearchResponse = {
  results: AppSearchResult[];
  groups: Record<string, AppSearchResult[]>;
  counts: Record<string, number>;
  /** @deprecated لم يعد يُستخدم للانتقال التلقائي — الاختصار ضمن results */
  quickNavHref?: string;
  suggestion?: string | null;
  /** أقرب ٣ بدائل عند انعدام النتائج */
  suggestions?: string[];
  responseMs: number;
  /** مصدر الدمج: lexical فقط / هجين / كاش */
  source?: HybridSearchSource;
  semanticHits?: number;
};

const KIND_ALIASES: Record<string, string> = {
  library: "book",
  books: "book",
  quran: "surah",
  sheikh: "scholar",
  scholars: "scholar",
  fatwas: "fatwa",
  lessons: "lesson",
  courses: "course",
  stories: "story",
  settings: "app",
};

function flattenGroups(groups: Record<string, UnifiedSearchHit[]>): AppSearchResult[] {
  const flat: AppSearchResult[] = [];
  for (const [kind, hits] of Object.entries(groups)) {
    for (const h of hits) {
      flat.push({
        id: h.id,
        kind: h.kind || kind,
        title: h.titleAr,
        href: h.href,
        summary: h.meta,
        match: h.match,
      });
    }
  }
  flat.sort((a, b) => {
    const ra = a.match?.rank ?? 9;
    const rb = b.match?.rank ?? 9;
    if (ra !== rb) return ra - rb;
    const da = a.match?.distance ?? 99;
    const db = b.match?.distance ?? 99;
    if (da !== db) return da - db;
    const pa = kindPriority(a.kind);
    const pb = kindPriority(b.kind);
    if (pa !== pb) return pa - pb;
    return a.title.localeCompare(b.title, "ar");
  });
  return flat;
}

/** أقرب عناوين في الفهرس عند انعدام النتائج (حتى ٣). */
export function findClosestSuggestions(
  docs: { titleAr: string; norm: string }[],
  query: string,
  limit = 3,
): string[] {
  const q = normalizeArabic(query);
  if (!q || q.length < 2) return [];
  type Cand = { title: string; rank: number; dist: number };
  const scored: Cand[] = [];
  const seen = new Set<string>();
  for (const d of docs) {
    const m = scoreTolerantMatch(d.titleAr, query, d.norm);
    if (!m) continue;
    if (seen.has(d.titleAr)) continue;
    seen.add(d.titleAr);
    scored.push({ title: d.titleAr, rank: m.rank, dist: m.distance });
  }
  scored.sort((a, b) => a.rank - b.rank || a.dist - b.dist || a.title.localeCompare(b.title, "ar"));
  return scored.slice(0, limit).map((s) => s.title);
}

/** @deprecated استخدم findClosestSuggestions */
export function findClosestSuggestion(
  docs: { titleAr: string; norm: string }[],
  query: string,
): string | null {
  return findClosestSuggestions(docs, query, 1)[0] ?? null;
}

export async function runAppSearch(
  rawQuery: string,
  opts: {
    limit?: number;
    kind?: string;
    signal?: AbortSignal;
    /** تعطيل الطبقة الدلالية (اختبارات/وضع محلي فقط) */
    lexicalOnly?: boolean;
  } = {},
): Promise<AppSearchResponse> {
  const t0 = performance.now();
  const query = rawQuery.trim();
  if (!query) {
    return { results: [], groups: {}, counts: {}, responseMs: 0, source: "lexical" };
  }

  trackAnonymousSearch(query);

  const quick = parseQuickNav(query);
  const quickHit: AppSearchResult | null = quick
    ? {
        id: `quick:${quick.href}`,
        kind: quick.href.includes("hadith") ? "hadith" : "surah",
        title: quick.titleAr || query,
        href: quick.href,
        summary: "انتقال سريع — اضغط للفتح",
      }
    : null;

  const { docs } = await loadUnifiedSearchIndex();
  if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const limit = opts.limit ?? 48;
  const grouped =
    docs.length > 2_500
      ? await searchUnifiedIndexAsync(docs, query, limit, opts.signal)
      : searchUnifiedIndex(docs, query, limit);

  let lexical = flattenGroups(grouped);
  if (opts.kind && opts.kind !== "all") {
    const want = KIND_ALIASES[opts.kind] ?? opts.kind;
    lexical = lexical.filter((r) => r.kind === want || r.kind === opts.kind);
  }

  let results = lexical;
  let source: HybridSearchSource = "lexical";
  let semanticHits = 0;

  if (!opts.lexicalOnly && isOnline() && normalizeArabic(query).length >= 2) {
    const semantic = await fetchSemanticHits(query, {
      limit: Math.min(24, limit),
      signal: opts.signal,
    });
    if (semantic.length) {
      const merged = mergeHybridResults(lexical, semantic, limit);
      results = merged.results;
      semanticHits = merged.semanticHits;
      source = "hybrid";
      void writeCachedHybridResults(query, results);
    }
  } else if (!opts.lexicalOnly && !isOnline()) {
    const cached = await readCachedHybridResults(query);
    if (cached?.length) {
      results = cached.slice(0, limit);
      source = "cache";
      semanticHits = cached.length;
    }
  }

  if (quickHit) {
    const seen = new Set(results.map((r) => r.href));
    if (!seen.has(quickHit.href)) {
      results = [quickHit, ...results];
    } else {
      results = [quickHit, ...results.filter((r) => r.href !== quickHit.href)];
    }
  }

  const { groups, counts } = attachGroups(results);
  const suggestions =
    results.length === 0 ? findClosestSuggestions(docs, query, 3) : [];

  return {
    results,
    groups,
    counts,
    suggestion: suggestions[0] ?? null,
    suggestions,
    responseMs: performance.now() - t0,
    source,
    semanticHits,
  };
}
