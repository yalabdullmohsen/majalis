/**
 * MushafPageRepository — جلب صفحة + كاش + prefetch للعمل دون شبكة في القراءة الأساسية.
 */

import {
  getCachedMushafPage,
  loadMushafPage,
  prefetchMushafPage,
  type MushafPageLayout,
} from "@/lib/quran-data/qpc-page-data";
import { clampMushafPage, MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";

function neighbors(page: number): number[] {
  const p = clampMushafPage(page);
  const out: number[] = [];
  if (p > MUSHAF_PAGE_MIN) out.push(p - 1);
  if (p < MUSHAF_PAGE_MAX) out.push(p + 1);
  return out;
}

export const MushafPageRepository = {
  getCached(page: number): MushafPageLayout | null {
    return getCachedMushafPage(clampMushafPage(page));
  },

  async getPage(page: number): Promise<MushafPageLayout> {
    const n = clampMushafPage(page);
    const hit = getCachedMushafPage(n);
    if (hit) return hit;
    return loadMushafPage(n);
  },

  prefetchAdjacent(page: number): void {
    for (const n of neighbors(page)) prefetchMushafPage(n);
  },

  assertPageIntegrity(layout: MushafPageLayout): boolean {
    if (!layout || typeof layout.pageNumber !== "number") return false;
    if (layout.pageNumber < MUSHAF_PAGE_MIN || layout.pageNumber > MUSHAF_PAGE_MAX) {
      return false;
    }
    if (!Array.isArray(layout.rows) || layout.rows.length === 0) return false;
    return true;
  },
} as const;
