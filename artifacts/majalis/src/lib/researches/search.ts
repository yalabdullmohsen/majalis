import { arabicMatchAny, normalizeArabic } from "@/lib/arabic-search";
import { PEER_REVIEWED_KINDS, THESIS_KINDS } from "./catalog";
import type { ResearchFilters, ResearchRecord, ResearchSort } from "./types";

function blob(r: ResearchRecord): string {
  return [
    r.title,
    r.titleEn,
    r.abstract,
    r.keywords.join(" "),
    r.authors.map((a) => a.name).join(" "),
    r.supervisor,
    r.university,
    r.college,
    r.department,
    r.doi,
    r.publisher,
    r.journalName,
  ]
    .filter(Boolean)
    .join(" ");
}

export function matchesResearchFilters(r: ResearchRecord, f: ResearchFilters): boolean {
  if (f.categoryId && !r.categoryIds.includes(f.categoryId)) return false;
  if (f.kind && r.kind !== f.kind) return false;
  if (f.academicLevel && r.academicLevel !== f.academicLevel) return false;
  if (f.university && !arabicMatchAny([r.university], f.university)) return false;
  if (f.college && !arabicMatchAny([r.college], f.college)) return false;
  if (f.country && !arabicMatchAny([r.country], f.country)) return false;
  if (f.author && !arabicMatchAny(r.authors.map((a) => a.name), f.author)) return false;
  if (f.supervisor && !arabicMatchAny([r.supervisor], f.supervisor)) return false;
  if (f.language && r.language !== f.language) return false;
  if (f.reviewStatus && r.reviewStatus !== f.reviewStatus) return false;
  if (f.accessType && r.accessType !== f.accessType) return false;
  if (f.peerReviewed && !r.peerReviewed && !PEER_REVIEWED_KINDS.includes(r.kind)) return false;
  if (f.thesesOnly && !THESIS_KINDS.includes(r.kind)) return false;
  if (f.yearFrom != null && (r.year == null || r.year < f.yearFrom)) return false;
  if (f.yearTo != null && (r.year == null || r.year > f.yearTo)) return false;
  if (f.pageMin != null && (r.pageCount == null || r.pageCount < f.pageMin)) return false;
  if (f.pageMax != null && (r.pageCount == null || r.pageCount > f.pageMax)) return false;
  if (f.keyword) {
    const k = normalizeArabic(f.keyword);
    if (!r.keywords.some((x) => normalizeArabic(x).includes(k)) && !arabicMatchAny([r.abstract, r.title], f.keyword)) {
      return false;
    }
  }
  if (f.q?.trim() && !arabicMatchAny([blob(r)], f.q)) return false;
  return true;
}

function relevanceScore(r: ResearchRecord, q?: string): number {
  if (!q?.trim()) return 0;
  const nq = normalizeArabic(q);
  let s = 0;
  if (normalizeArabic(r.title).includes(nq)) s += 50;
  if (r.keywords.some((k) => normalizeArabic(k).includes(nq))) s += 30;
  if (normalizeArabic(r.abstract).includes(nq)) s += 15;
  if (r.authors.some((a) => normalizeArabic(a.name).includes(nq))) s += 20;
  if (r.peerReviewed) s += 5;
  return s;
}

export function sortResearches(list: ResearchRecord[], sort: ResearchSort = "relevance", q?: string): ResearchRecord[] {
  const arr = [...list];
  switch (sort) {
    case "newest":
      return arr.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.publishedAt || "").localeCompare(a.publishedAt || ""));
    case "oldest":
      return arr.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    case "most_viewed":
      return arr.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    case "most_cited":
      return arr.sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0));
    case "reliability":
      return arr.sort((a, b) => (b.sourceReliability ?? 0) - (a.sourceReliability ?? 0));
    case "peer_reviewed":
      return arr.sort((a, b) => Number(!!b.peerReviewed) - Number(!!a.peerReviewed) || (b.year ?? 0) - (a.year ?? 0));
    case "theses":
      return arr.sort((a, b) => Number(THESIS_KINDS.includes(b.kind)) - Number(THESIS_KINDS.includes(a.kind)) || (b.year ?? 0) - (a.year ?? 0));
    case "relevance":
    default:
      return arr.sort((a, b) => relevanceScore(b, q) - relevanceScore(a, q) || (b.year ?? 0) - (a.year ?? 0));
  }
}

export function searchResearches(pool: ResearchRecord[], filters: ResearchFilters = {}): ResearchRecord[] {
  const filtered = pool.filter((r) => matchesResearchFilters(r, filters));
  return sortResearches(filtered, filters.sort ?? "relevance", filters.q);
}

export function suggestQueryCompletions(pool: ResearchRecord[], partial: string, limit = 8): string[] {
  const p = normalizeArabic(partial).trim();
  if (p.length < 2) return [];
  const out = new Set<string>();
  for (const r of pool) {
    if (normalizeArabic(r.title).includes(p)) out.add(r.title);
    for (const k of r.keywords) {
      if (normalizeArabic(k).includes(p)) out.add(k);
    }
    for (const a of r.authors) {
      if (normalizeArabic(a.name).includes(p)) out.add(a.name);
    }
    if (out.size >= limit) break;
  }
  return [...out].slice(0, limit);
}
