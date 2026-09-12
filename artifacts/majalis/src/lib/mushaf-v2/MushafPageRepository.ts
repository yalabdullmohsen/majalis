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
import { QURAN_EXPERIENCE_NEXT } from "./flags";

function neighbors(page: number, radius = 1): number[] {
  const p = clampMushafPage(page);
  const out: number[] = [];
  for (let d = 1; d <= radius; d++) {
    if (p - d >= MUSHAF_PAGE_MIN) out.push(p - d);
    if (p + d <= MUSHAF_PAGE_MAX) out.push(p + d);
  }
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

  /** ±1 إلزامي؛ ±2 عند تفعيل prefetchPlus2 */
  prefetchAdjacent(page: number): void {
    const radius = QURAN_EXPERIENCE_NEXT.prefetchPlus2 ? 2 : 1;
    for (const n of neighbors(page, radius)) prefetchMushafPage(n);
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
