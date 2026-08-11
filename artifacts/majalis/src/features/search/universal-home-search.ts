/**
 * بحث موحّد للشاشة الرئيسية — أقسام ثابتة + قفز مصحف + فهرس كسول.
 * لا يستورد فهرس البحث بشكل ساكن (يبقى خارج الحزمة الأولى).
 */
import { parseMushafJumpQuery } from "@/features/search/mushaf-jump";
import {
  loadUnifiedSearchIndex,
  searchUnifiedIndex,
  type UnifiedSearchHit,
} from "@/features/search/unified-local";
import { kindPriority } from "@/features/search/kind-priority";
import { findClosestSuggestions, type AppSearchResult } from "@/features/search/app-search";
import { searchVersesInCorpus } from "@/lib/quran-search-verses";
import { getSurahMeta } from "@/lib/quran-api";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { toArabicDigits } from "@/lib/utils";

export const UNIVERSAL_SECTION_ORDER = [
  "quran",
  "book",
  "scholar",
  "adhkar",
  "quiz",
] as const;

export type UniversalSectionId = (typeof UNIVERSAL_SECTION_ORDER)[number];

export const UNIVERSAL_SECTION_LABELS: Record<UniversalSectionId, string> = {
  quran: "آيات القرآن",
  book: "الكتب",
  scholar: "العلماء",
  adhkar: "الأذكار",
  quiz: "أسئلة المسابقة",
};

export const UNIVERSAL_PREVIEW = 3;
export const UNIVERSAL_DEBOUNCE_MS = 120;

/** أنواع الفهرس الداخلة في البحث الموحّد */
const UNIVERSAL_KINDS = new Set([
  "surah",
  "quran",
  "book",
  "library",
  "scholar",
  "sheikh",
  "person",
  "adhkar",
  "dua",
  "qa",
]);

const KIND_TO_SECTION: Record<string, UniversalSectionId> = {
  surah: "quran",
  quran: "quran",
  book: "book",
  library: "book",
  scholar: "scholar",
  sheikh: "scholar",
  person: "scholar",
  adhkar: "adhkar",
  dua: "adhkar",
  qa: "quiz",
};

export type UniversalHit = AppSearchResult & { section: UniversalSectionId };

export type UniversalSection = {
  id: UniversalSectionId;
  label: string;
  total: number;
  preview: UniversalHit[];
  all: UniversalHit[];
};

export type UniversalSearchResponse = {
  sections: UniversalSection[];
  hits: UniversalHit[];
  counts: Record<UniversalSectionId, number>;
  responseMs: number;
  suggestion?: string | null;
  suggestions?: string[];
};

function jumpToHits(query: string): UniversalHit[] {
  const jump = parseMushafJumpQuery(query);
  if (!jump) return [];
  if (jump.kind === "page") {
    return [
      {
        id: `jump:page:${jump.page}`,
        kind: "surah",
        section: "quran",
        title: `صفحة ${toArabicDigits(jump.page)}`,
        href: `/mushaf/page/${jump.page}`,
        summary: "انتقال إلى صفحة المصحف",
      },
    ];
  }
  return [
    {
      id: `jump:ayah:${jump.surah}:${jump.ayah}`,
      kind: "surah",
      section: "quran",
      title: `${getSurahMeta(jump.surah).name.replace(/^سُورَةُ\s*/u, "")} · آية ${toArabicDigits(jump.ayah)}`,
      href: `/mushaf/page/${jump.pageHint}?ayah=${jump.surah}:${jump.ayah}`,
      summary: "انتقال إلى الآية",
    },
  ];
}

function mapHit(r: AppSearchResult): UniversalHit | null {
  const section = KIND_TO_SECTION[r.kind];
  if (!section) return null;
  return { ...r, section };
}

function flattenGrouped(groups: Record<string, UnifiedSearchHit[]>): AppSearchResult[] {
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

function emptyCounts(): Record<UniversalSectionId, number> {
  return { quran: 0, book: 0, scholar: 0, adhkar: 0, quiz: 0 };
}

/** بحث موحّد سريع على شريحة الفهرس ذات الصلة (+ قفز مصحف). */
export async function runUniversalSearch(
  rawQuery: string,
  opts: { signal?: AbortSignal } = {},
): Promise<UniversalSearchResponse> {
  const t0 = performance.now();
  const query = rawQuery.trim();
  if (!query) {
    return {
      sections: [],
      hits: [],
      counts: emptyCounts(),
      responseMs: 0,
    };
  }

  const jumpHits = jumpToHits(query);
  const { docs: allDocs } = await loadUnifiedSearchIndex();
  if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const docs = allDocs.filter((d) => UNIVERSAL_KINDS.has(d.kind));
  const priorityDocs = docs.filter((d) => d.kind !== "qa");
  const qaDocs = docs.filter((d) => d.kind === "qa");

  // مسار سريع: الأنواع الصغيرة بالتطابق المتسامح الكامل، والأسئلة بمسح خفيف مع قطع مبكر
  const grouped = searchUnifiedIndex(priorityDocs, query, 48);
  const qNorm = normalizeArabic(query);
  if (qNorm && qaDocs.length > 0) {
    const qaHits: UnifiedSearchHit[] = [];
    for (const d of qaDocs) {
      if (!d.norm.includes(qNorm) && !d.titleAr.includes(query)) continue;
      qaHits.push({
        id: d.id,
        kind: d.kind,
        titleAr: d.titleAr,
        href: d.href,
        meta: d.meta,
      });
      if (qaHits.length >= 24) break;
    }
    if (qaHits.length) grouped.qa = qaHits;
  }
  if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const mapped = flattenGrouped(grouped)
    .map(mapHit)
    .filter((h): h is UniversalHit => h != null);

  const seen = new Set<string>();
  const hits: UniversalHit[] = [];
  for (const h of [...jumpHits, ...mapped]) {
    const key = h.href || h.id;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push(h);
  }

  const counts = emptyCounts();
  const bySection: Record<UniversalSectionId, UniversalHit[]> = {
    quran: [],
    book: [],
    scholar: [],
    adhkar: [],
    quiz: [],
  };
  for (const h of hits) {
    bySection[h.section].push(h);
    counts[h.section] += 1;
  }

  const sections: UniversalSection[] = UNIVERSAL_SECTION_ORDER.filter(
    (id) => bySection[id].length > 0,
  ).map((id) => ({
    id,
    label: UNIVERSAL_SECTION_LABELS[id],
    total: bySection[id].length,
    preview: bySection[id].slice(0, UNIVERSAL_PREVIEW),
    all: bySection[id],
  }));

  const suggestions = hits.length === 0 ? findClosestSuggestions(docs, query, 3) : [];

  return {
    sections,
    hits,
    counts,
    responseMs: performance.now() - t0,
    suggestion: suggestions[0] ?? null,
    suggestions,
  };
}

/** إثراء قسم القرآن بنتائج نص الآيات — كسول، لا يحجب مسار الفهرس. */
export async function enrichWithVerseHits(
  query: string,
  existing: UniversalSearchResponse,
  limit = 8,
): Promise<UniversalSearchResponse> {
  const q = query.trim();
  if (q.length < 3) return existing;
  if (/^[\d\u0660-\u0669\s:]+$/u.test(q)) return existing;

  try {
    const list = await searchVersesInCorpus(q, limit);
    if (list.length === 0) return existing;

    const verseHits: UniversalHit[] = list.map((v) => ({
      id: `ayah:${v.surahNumber}:${v.ayahNumber}`,
      kind: "quran",
      section: "quran" as const,
      title: `${v.surahName} · آية ${toArabicDigits(v.ayahNumber)}`,
      href: `/mushaf/page/${v.page}?ayah=${v.surahNumber}:${v.ayahNumber}`,
      summary: v.text.slice(0, 96) + (v.text.length > 96 ? "…" : ""),
    }));

    const seen = new Set(existing.hits.map((h) => h.href || h.id));
    const mergedQuran = [...existing.hits.filter((h) => h.section === "quran")];
    for (const h of verseHits) {
      if (seen.has(h.href)) continue;
      seen.add(h.href);
      mergedQuran.push(h);
    }
    const other = existing.hits.filter((h) => h.section !== "quran");
    const hits = [...mergedQuran, ...other];
    const counts = emptyCounts();
    for (const h of hits) counts[h.section] += 1;

    const sections: UniversalSection[] = UNIVERSAL_SECTION_ORDER.filter(
      (id) => counts[id] > 0,
    ).map((id) => {
      const all = hits.filter((h) => h.section === id);
      return {
        id,
        label: UNIVERSAL_SECTION_LABELS[id],
        total: all.length,
        preview: all.slice(0, UNIVERSAL_PREVIEW),
        all,
      };
    });

    return { ...existing, hits, counts, sections };
  } catch {
    return existing;
  }
}
