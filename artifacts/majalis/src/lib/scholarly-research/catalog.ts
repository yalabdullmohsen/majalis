/**
 * كتالوج البحوث للعامة — فارغ في PR-0.
 */

import { isScholarlyResearchPubliclyVisible } from "./publication-states";
import type { ScholarlyResearchRecord } from "./types";

const RECORDS: readonly ScholarlyResearchRecord[] = [];

export function listAllScholarlyResearchInternal(): readonly ScholarlyResearchRecord[] {
  return RECORDS;
}

export function listPublishedScholarlyResearch(): ScholarlyResearchRecord[] {
  return RECORDS.filter(
    (r) =>
      isScholarlyResearchPubliclyVisible(r.publicationStatus) &&
      r.searchVisibility,
  );
}

export function getPublishedScholarlyResearchBySlug(
  slug: string,
): ScholarlyResearchRecord | null {
  const row = RECORDS.find((r) => r.slug === slug);
  if (!row || !isScholarlyResearchPubliclyVisible(row.publicationStatus)) {
    return null;
  }
  return row;
}

export function countPublishedScholarlyResearch(): number {
  return listPublishedScholarlyResearch().length;
}
