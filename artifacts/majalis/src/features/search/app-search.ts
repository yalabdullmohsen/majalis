/**
 * نقطة الدخول الوحيدة للبحث الشامل في التطبيق.
 * فهرس مطبّع مسبقًا + تطبيع مشترك + إلغاء الاستعلام السابق.
 */
import {
  loadUnifiedSearchIndex,
  searchUnifiedIndex,
  searchUnifiedIndexAsync,
  type UnifiedSearchDoc,
  type UnifiedSearchHit,
} from "@/features/search/unified-local";
import { kindPriority } from "@/features/search/kind-priority";
import { parseQuickNav } from "@/features/search/quick-nav";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { scoreTolerantMatch, type TolerantMatch } from "@/features/search/tolerant-match";
import {
  filterDocsByScope,
  isSearchScopeId,
  type SearchScopeId,
} from "@/features/search/search-scopes";

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
  scope: SearchScopeId;
};

const KIND_ALIASES: Record<string, string> = {
  library: "book",
  books: "book",
  quran: "quran",
  surah: "quran",
  sheikh: "scholar",
  scholars: "scholar",
  fatwas: "fatwa",
  fatwa: "fiqh",
  qa: "fiqh",
  lessons: "lesson",
  courses: "lesson",
  course: "lesson",
  stories: "prophet",
  story: "prophet",
  prophets: "prophet",
  settings: "app",
  تفسير: "tafsir",
  سيرة: "seerah",
  قرآن: "quran",
  فقه: "fiqh",
  حديث: "hadith",
};

function resolveScope(opts: { scope?: string; kind?: string }): SearchScopeId {
  const raw = (opts.scope || opts.kind || "all").trim();
  if (isSearchScopeId(raw)) return raw;
  const aliased = KIND_ALIASES[raw] ?? raw;
  if (isSearchScopeId(aliased)) return aliased;
  return "all";
}

function titleFirstRank(item: AppSearchResult, query: string): number {
  if (!query) return item.match?.rank ?? 9;
  const titleHit = scoreTolerantMatch(item.title, query);
  if (titleHit) return titleHit.rank;
  const summaryHit = item.summary ? scoreTolerantMatch(item.summary, query) : null;
  if (summaryHit) return 4 + summaryHit.rank;
  return 8 + (item.match?.rank ?? 3);
}

function flattenGroups(groups: Record<string, UnifiedSearchHit[]>, query = ""): AppSearchResult[] {
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
    const ra = titleFirstRank(a, query);
    const rb = titleFirstRank(b, query);
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

function pack(results: AppSearchResult[], extra: Partial<AppSearchResponse> = {}): AppSearchResponse {
  const groups: Record<string, AppSearchResult[]> = {};
  const counts: Record<string, number> = {};
  for (const r of results) {
    (groups[r.kind] ??= []).push(r);
    counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  }
  return {
    results,
    groups,
    counts,
    suggestion: extra.suggestion ?? null,
    suggestions: extra.suggestions ?? [],
    responseMs: extra.responseMs ?? 0,
    scope: extra.scope ?? "all",
    ...extra,
  };
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

function browseDocs(docs: UnifiedSearchDoc[], limit: number): AppSearchResult[] {
  return docs.slice(0, limit).map((d) => ({
    id: d.id,
    kind: d.kind,
    title: d.titleAr,
    href: d.href,
    summary: d.meta,
  }));
}

async function mergeLazySources(
  query: string,
  scope: SearchScopeId,
  results: AppSearchResult[],
  signal?: AbortSignal,
): Promise<AppSearchResult[]> {
  if (!query) return results;
  let next = results;
  const seen = () => new Set(next.map((r) => r.href));

  if (scope === "hadith") {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const { searchHadithCorpus } = await import("@/lib/hadith-corpus");
    const corpusHits = searchHadithCorpus(query, 8).map((h) => ({
      id: `corpus:${h.id}`,
      kind: "hadith" as const,
      title: h.isMawdu ? `⚠ موضوع — ${h.id}` : h.id,
      href: h.href,
      summary: h.isMawdu
        ? `حديث موضوع لا يصحّ · ${h.matnPreview}`
        : [h.narrator, h.matnPreview].filter(Boolean).join(" · "),
    }));
    const have = seen();
    next = [...corpusHits.filter((h) => !have.has(h.href)), ...next];
  }

  if (scope === "fiqh") {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const { searchFiqhLessons } = await import("@/lib/fiqh-books");
    const fiqhHits = searchFiqhLessons(query)
      .slice(0, 8)
      .map((h) => ({
        id: `fiqh:${h.lesson.id}`,
        kind: "fiqh",
        title: h.lesson.title,
        href: h.href.startsWith("/quiz") ? h.href : h.href,
        summary: h.path,
      }));
    const have = seen();
    next = [...fiqhHits.filter((h) => !have.has(h.href)), ...next];
  }

  if (scope === "fawaid") {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const { searchFawaid } = await import("@/lib/fawaid-seed");
    const fawaidHits = searchFawaid(query)
      .slice(0, 8)
      .map((f) => ({
        id: `fawaid:${f.id}`,
        kind: "fawaid",
        title: String(f.text || "").slice(0, 90),
        href: `/fawaid#${encodeURIComponent(String(f.id))}`,
        summary: f.category || f.author_name || "فائدة",
      }));
    const have = seen();
    next = [...fawaidHits.filter((h) => !have.has(h.href)), ...next];
  }

  return next;
}

function fallbackQueryToken(query: string): string | null {
  const parts = normalizeArabic(query).split(/\s+/).filter((w) => w.length >= 3);
  if (parts.length < 2) return null;
  parts.sort((a, b) => b.length - a.length);
  return parts[0] ?? null;
}

export async function runAppSearch(
  rawQuery: string,
  opts: { limit?: number; kind?: string; scope?: string; signal?: AbortSignal } = {},
): Promise<AppSearchResponse> {
  const t0 = performance.now();
  const query = rawQuery.trim();
  const scope = resolveScope(opts);
  const limit = opts.limit ?? 48;

  const empty = () =>
    pack([], { responseMs: performance.now() - t0, scope, suggestions: [] });

  const { docs } = await loadUnifiedSearchIndex();
  if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const scopedDocs = filterDocsByScope(docs, scope);

  if (!query) {
    if (scope === "all") return empty();
    let browsed = browseDocs(scopedDocs, limit);
    if (scope === "fawaid" && browsed.length === 0) {
      const { searchFawaid } = await import("@/lib/fawaid-seed");
      browsed = searchFawaid("")
        .slice(0, limit)
        .map((f) => ({
          id: `fawaid:${f.id}`,
          kind: "fawaid",
          title: String(f.text || "").slice(0, 90),
          href: `/fawaid#${encodeURIComponent(String(f.id))}`,
          summary: f.category || "فائدة",
        }));
    }
    return pack(browsed, { responseMs: performance.now() - t0, scope });
  }

  const pool = scopedDocs.length ? scopedDocs : docs;
  const searchLimit = scope === "all" ? limit : Math.max(limit, 80);
  const searchPool = async (q: string) => {
    const grouped =
      pool.length > 2_500
        ? await searchUnifiedIndexAsync(pool, q, searchLimit, opts.signal)
        : searchUnifiedIndex(pool, q, searchLimit);
    return flattenGroups(grouped, q);
  };

  let results = await searchPool(query);
  if (results.length === 0) {
    const token = fallbackQueryToken(query);
    if (token) results = await searchPool(token);
  }

  const quick = parseQuickNav(query);
  const allowQuick =
    quick && (scope === "all" || (scope === "quran" && quick.href.includes("mushaf")) || (scope === "hadith" && quick.href.includes("hadith")));
  if (allowQuick && quick) {
    const quickHit: AppSearchResult = {
      id: `quick:${quick.href}`,
      kind: quick.href.includes("hadith") ? "hadith" : "surah",
      title: quick.titleAr || query,
      href: quick.href,
      summary: "انتقال سريع — اضغط للفتح",
    };
    const seen = new Set(results.map((r) => r.href));
    results = seen.has(quickHit.href)
      ? [quickHit, ...results.filter((r) => r.href !== quickHit.href)]
      : [quickHit, ...results];
  }

  results = await mergeLazySources(query, scope, results, opts.signal);
  if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  results.sort((a, b) => titleFirstRank(a, query) - titleFirstRank(b, query));
  if (results.length > limit) results = results.slice(0, limit);

  const suggestions =
    results.length === 0 ? findClosestSuggestions(scopedDocs.length ? scopedDocs : docs, query, 3) : [];

  return pack(results, {
    suggestion: suggestions[0] ?? null,
    suggestions,
    responseMs: performance.now() - t0,
    scope,
  });
}
