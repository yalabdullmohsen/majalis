/**
 * كاش نموذج رسم الصفحة — بيانات + مفتاح هندسة + جاهزية خط.
 * لا يعيد parsing أثناء السحب؛ يبطل فقط عند تغيّر geometry أو إصدار البيانات.
 */
import type { MushafPageLayout } from "@/lib/quran-data/qpc-page-data";

export type MushafPageRenderModel = {
  pageNumber: number;
  layout: MushafPageLayout;
  fontFamily: string;
  geometryKey: string;
  dataVersion: string;
  preparedAt: number;
};

const MAX_ENTRIES = 12;
const cache = new Map<number, MushafPageRenderModel>();

let geometryKey = "boot";
let dataVersion = "qpc-v2";

export function setMushafGeometryKey(key: string): void {
  if (!key || key === geometryKey) return;
  geometryKey = key;
  cache.clear();
}

export function getMushafGeometryKey(): string {
  return geometryKey;
}

export function setMushafDataVersion(version: string): void {
  if (!version || version === dataVersion) return;
  dataVersion = version;
  cache.clear();
}

export function getCachedPageRenderModel(pageNumber: number): MushafPageRenderModel | null {
  const hit = cache.get(pageNumber);
  if (!hit) return null;
  if (hit.geometryKey !== geometryKey || hit.dataVersion !== dataVersion) {
    cache.delete(pageNumber);
    return null;
  }
  /* LRU soft */
  cache.delete(pageNumber);
  cache.set(pageNumber, hit);
  return hit;
}

export function putPageRenderModel(
  pageNumber: number,
  layout: MushafPageLayout,
  fontFamily: string,
): MushafPageRenderModel {
  const model: MushafPageRenderModel = {
    pageNumber,
    layout,
    fontFamily,
    geometryKey,
    dataVersion,
    preparedAt: Date.now(),
  };
  if (cache.has(pageNumber)) cache.delete(pageNumber);
  cache.set(pageNumber, model);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest == null) break;
    cache.delete(oldest);
  }
  return model;
}

export function clearMushafPageRenderCache(): void {
  cache.clear();
}

export function mushafPageRenderCacheSize(): number {
  return cache.size;
}
