/**
 * مصدر وحيد لتصميم المصحف في سُنّة — لا مسارات Legacy متفرقة.
 * أي فتح للمصحف يجب أن يمر عبر resolveSunnahMushafClassicPreset().
 */

export const SUNNAH_MUSHAF_CLASSIC_PRESET_ID = "sunnah-mushaf-classic-v1" as const;

export type SunnahMushafClassicPreset = {
  presetId: typeof SUNNAH_MUSHAF_CLASSIC_PRESET_ID;
  rendererId: "new-mushaf-reader";
  geometryVersion: string;
  fontId: string;
  fontVersion: string;
  layoutDataVersion: string;
  pageMappingVersion: string;
  markerStyle: "qpc-end";
  headerStyle: "nm-header";
  footerStyle: "nm-footer";
  backgroundStyle: "nm-paper";
  cacheVersion: string;
};

/** ارفع cacheVersion عند أي كسر بصري مقصود لتصميم المصحف. */
export const SUNNAH_MUSHAF_CACHE_VERSION = "smc-2026-09-13-a11y-iso";

export function resolveSunnahMushafClassicPreset(): SunnahMushafClassicPreset {
  return {
    presetId: SUNNAH_MUSHAF_CLASSIC_PRESET_ID,
    rendererId: "new-mushaf-reader",
    geometryVersion: "geo-v3",
    fontId: "qpc-v1",
    fontVersion: "qpc-v1.1",
    layoutDataVersion: "qpc-layout-v2",
    pageMappingVersion: "madinah-604-v1",
    markerStyle: "qpc-end",
    headerStyle: "nm-header",
    footerStyle: "nm-footer",
    backgroundStyle: "nm-paper",
    cacheVersion: SUNNAH_MUSHAF_CACHE_VERSION,
  };
}

/** مفتاح كاش الرسم — يجب أن يتضمّن كل حقول الثبات البصري. */
export function buildMushafRenderCacheKey(pageNumber: number): string {
  const p = resolveSunnahMushafClassicPreset();
  return [
    `p${pageNumber}`,
    p.presetId,
    p.rendererId,
    p.layoutDataVersion,
    p.pageMappingVersion,
    p.fontId,
    p.fontVersion,
    p.geometryVersion,
    p.markerStyle,
    p.cacheVersion,
  ].join("|");
}

const LEGACY_PRESET_KEYS = [
  "selectedMushafPreset",
  "mushafFont",
  "pageStyle",
  "legacyReaderMode",
  "experimentalReader",
] as const;

const MIGRATION_FLAG = "sunnah-mushaf-classic-migrated-v1";

/** ترحيل إعدادات قديمة مرة واحدة — Idempotent. */
export function migrateLegacyMushafReaderPrefs(storage: Storage = localStorage): boolean {
  try {
    if (storage.getItem(MIGRATION_FLAG) === "1") return false;
    for (const key of LEGACY_PRESET_KEYS) {
      const v = storage.getItem(key);
      if (!v) continue;
      /* أي قيمة legacy صريحة تُستبدل بالكلاسيكي */
      if (/legacy|old|v1-preview|experimental|image/i.test(v)) {
        storage.removeItem(key);
      }
    }
    storage.setItem("selectedMushafPreset", SUNNAH_MUSHAF_CLASSIC_PRESET_ID);
    storage.setItem(MIGRATION_FLAG, "1");
    return true;
  } catch {
    return false;
  }
}
