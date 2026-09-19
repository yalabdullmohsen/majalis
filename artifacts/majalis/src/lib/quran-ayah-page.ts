/**
 * آية ↔ صفحة mushaf=1 — بلا تخزين فواصل (مسار إقلاع خفيف).
 */
import {
  findPageByFirstAyah,
  legacyPageFirstAyahKey,
  legacyPageToCurrentPageNum,
  pageFirstAyahMushaf1,
} from "@/lib/quran-data/ayah-page-index.generated";

function clampPage(page: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(604, Math.max(1, Math.floor(page)));
}

export function legacyPageToAyahKey(page: number): string {
  return legacyPageFirstAyahKey(page);
}

export function legacyPageToCurrentPage(page: number): number {
  return legacyPageToCurrentPageNum(page);
}

export function currentPageFirstAyah(page: number): string {
  return pageFirstAyahMushaf1(page);
}

export function ayahKeyToPage(ayahKey: string, fallbackPage?: number): number {
  const hit = findPageByFirstAyah(ayahKey);
  if (hit != null) return hit;
  if (typeof fallbackPage === "number") return clampPage(fallbackPage);
  return 1;
}

export { clampPage as clampMushafPageNum };
