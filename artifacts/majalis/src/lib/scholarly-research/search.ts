/**
 * بحث كتالوج scholarly-research — المنشور فقط (فارغ حتى اعتماد سجلات).
 * التطبيع العربي عبر arabic-search؛ لا يغيّر النص الأكاديمي الأصلي.
 */
import { arabicMatchAny, normalizeArabic } from "@/lib/arabic-search";
import { listPublishedScholarlyResearch } from "./catalog";
import type { ScholarlyDegreeType, ScholarlyDiscipline, ScholarlyResearchRecord } from "./types";

export type ScholarlySearchFilters = {
  q?: string;
  discipline?: ScholarlyDiscipline;
  degreeType?: ScholarlyDegreeType;
  institution?: string;
  country?: string;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  accessType?: ScholarlyResearchRecord["accessType"];
  repositoryName?: string;
};

function blob(r: ScholarlyResearchRecord): string {
  return [
    r.titleArabic,
    r.titleOriginal,
    r.authorName,
    r.institution,
    r.college,
    r.department,
    r.abstract,
    r.keywords.join(" "),
    r.doi,
    r.repositoryName,
    String(r.publicationYear ?? ""),
    String(r.academicYear ?? ""),
  ]
    .filter(Boolean)
    .join(" ");
}

export function matchesScholarlyFilters(
  r: ScholarlyResearchRecord,
  f: ScholarlySearchFilters,
): boolean {
  if (f.discipline && r.discipline !== f.discipline) return false;
  if (f.degreeType && r.degreeType !== f.degreeType) return false;
  if (f.accessType && r.accessType !== f.accessType) return false;
  if (f.language && r.language !== f.language) return false;
  if (f.institution && !arabicMatchAny([r.institution], f.institution)) return false;
  if (f.country && !arabicMatchAny([r.country ?? ""], f.country)) return false;
  if (
    f.repositoryName &&
    !arabicMatchAny([r.repositoryName ?? ""], f.repositoryName)
  ) {
    return false;
  }
  const year = r.publicationYear ?? null;
  if (f.yearFrom != null && (year == null || year < f.yearFrom)) return false;
  if (f.yearTo != null && (year == null || year > f.yearTo)) return false;
  if (f.q?.trim() && !arabicMatchAny([blob(r)], f.q)) return false;
  return true;
}

/** المنشور فقط — DRAFT/SUBMITTED/REJECTED لا تدخل. */
export function searchPublishedScholarlyResearch(
  filters: ScholarlySearchFilters = {},
): ScholarlyResearchRecord[] {
  const pool = listPublishedScholarlyResearch();
  return pool
    .filter((r) => matchesScholarlyFilters(r, filters))
    .sort((a, b) => {
      if (filters.q?.trim()) {
        const nq = normalizeArabic(filters.q);
        const sa = normalizeArabic(a.titleArabic).includes(nq) ? 1 : 0;
        const sb = normalizeArabic(b.titleArabic).includes(nq) ? 1 : 0;
        if (sb !== sa) return sb - sa;
      }
      return (b.publicationYear ?? 0) - (a.publicationYear ?? 0);
    });
}
