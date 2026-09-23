/**
 * وجوه فلاتر من السجلات المنشورة فقط — لا فلتر بلا بيانات فعلية.
 */
import { listPublishedResearches } from "./service";
import type { AccessType, ResearchRecord } from "./types";

export const RESEARCH_ACCESS_LABELS: Readonly<Record<AccessType, string>> = {
  metadata_only: "بيانات وصفية فقط",
  abstract_only: "ملخص فقط",
  fulltext_view: "عرض النص الكامل",
  fulltext_download: "تحميل النص الكامل",
};

export type ResearchFacetOptions = {
  universities: string[];
  countries: string[];
  languages: string[];
  years: number[];
  accessTypes: AccessType[];
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ar"),
  );
}

/** يستخرج خيارات الفلاتر من الفهرس المنشور — فارغ إن لم توجد قيم. */
export function extractPublishedResearchFacets(
  pool: ResearchRecord[] = listPublishedResearches(),
): ResearchFacetOptions {
  const universities = uniqueSorted(pool.map((r) => r.university || ""));
  const countries = uniqueSorted(pool.map((r) => r.country || ""));
  const languages = uniqueSorted(pool.map((r) => r.language || ""));
  const years = [
    ...new Set(
      pool
        .map((r) => r.year)
        .filter((y): y is number => typeof y === "number" && Number.isFinite(y)),
    ),
  ].sort((a, b) => b - a);
  const accessTypes = [
    ...new Set(pool.map((r) => r.accessType)),
  ] as AccessType[];
  return { universities, countries, languages, years, accessTypes };
}
