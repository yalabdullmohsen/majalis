/**
 * كاش نموذج رسم الصفحة — بيانات + مفتاح هندسة + جاهزية خط + إصدار Preset.
 * لا يعيد parsing أثناء السحب؛ يبطل فقط عند تغيّر geometry أو إصدار البيانات أو الـpreset.
 */
import type { MushafPageLayout } from "@/lib/quran-data/qpc-page-data";
import {
  buildMushafRenderCacheKey,
  resolveSunnahMushafClassicPreset,
} from "./sunnah-mushaf-classic-preset";

export type MushafPageRenderModel = {
  pageNumber: number;
  layout: MushafPageLayout;
  fontFamily: string;
  geometryKey: string;
  dataVersion: string;
  presetCacheKey: string;
  preparedAt: number;
};

const MAX_ENTRIES = 12;
const cache = new Map<number, MushafPageRenderModel>();

const classic = resolveSunnahMushafClassicPreset();
let geometryKey = "boot";
/** يتضمن cacheVersion للـpreset حتى تُبطَل الصفحات القديمة بعد توحيد التصميم. */
let dataVersion = `qpc-v2|${classic.cacheVersion}|${classic.presetId}`;

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
  const expectedPresetKey = buildMushafRenderCacheKey(pageNumber);
  if (
    hit.geometryKey !== geometryKey ||
    hit.dataVersion !== dataVersion ||
    hit.presetCacheKey !== expectedPresetKey
  ) {
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
    presetCacheKey: buildMushafRenderCacheKey(pageNumber),
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
