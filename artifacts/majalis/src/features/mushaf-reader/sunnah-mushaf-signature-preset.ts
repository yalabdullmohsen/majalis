/**
 * Sunnah Mushaf Signature — الـPreset الرسمي لمصحف سُنّة.
 * لا يغيّر نص القرآن ولا Page/Line Mapping — يصف الهوية الهندسية والمرخّصة فقط.
 */

import { MUSHAF_PROVENANCE } from "@/lib/mushaf-v2/provenance";

export const SUNNAH_MUSHAF_SIGNATURE_PRESET_ID = "sunnah-mushaf-signature-v1" as const;
export const SUNNAH_MUSHAF_SIGNATURE_VERSION = "1.0.0" as const;
export const SUNNAH_MUSHAF_SIGNATURE_CACHE_VERSION = "sms-2026-09-13-p0-immersive";

export type SunnahMushafSignaturePreset = {
  presetId: typeof SUNNAH_MUSHAF_SIGNATURE_PRESET_ID;
  presetVersion: typeof SUNNAH_MUSHAF_SIGNATURE_VERSION;
  quranDataVersion: string;
  riwayah: "hafs-an-asim";
  pageMappingVersion: string;
  lineMappingVersion: string;
  rendererId: "new-mushaf-reader";
  rendererVersion: string;
  fontId: "qpc-v2";
  fontVersion: string;
  fontLicenseId: string;
  linesPerPage: 15;
  lineHeight: number;
  pageScale: 1;
  contentInsets: { headerPx: number; footerPx: number; sidePx: number };
  headerStyle: "nm-header";
  surahFrameStyle: "sunnah-surah-frame-v1";
  basmalaStyle: "qpc-basmala";
  verseMarkerStyle: "qpc-end";
  footerStyle: "nm-footer";
  backgroundStyle: "nm-paper";
  geometryVersion: string;
  renderCacheVersion: string;
  mushafId: 1;
  displayBrand: "سُنّة";
};

export function resolveSunnahMushafSignaturePreset(): SunnahMushafSignaturePreset {
  return {
    presetId: SUNNAH_MUSHAF_SIGNATURE_PRESET_ID,
    presetVersion: SUNNAH_MUSHAF_SIGNATURE_VERSION,
    quranDataVersion: `quran-v2-mushaf${MUSHAF_PROVENANCE.mushafId}`,
    riwayah: "hafs-an-asim",
    pageMappingVersion: "madinah-604-v1",
    lineMappingVersion: "qpc-layout-v2",
    rendererId: "new-mushaf-reader",
    rendererVersion: "nm-2026-09",
    fontId: "qpc-v2",
    fontVersion: "qpc-v2-woff2-604",
    fontLicenseId: "kfgqpc-qpc-v2-pending-store-signoff",
    linesPerPage: 15,
    lineHeight: 1.85,
    pageScale: 1,
    contentInsets: { headerPx: 36, footerPx: 40, sidePx: 5 },
    headerStyle: "nm-header",
    surahFrameStyle: "sunnah-surah-frame-v1",
    basmalaStyle: "qpc-basmala",
    verseMarkerStyle: "qpc-end",
    footerStyle: "nm-footer",
    backgroundStyle: "nm-paper",
    geometryVersion: "geo-v3-signature",
    renderCacheVersion: SUNNAH_MUSHAF_SIGNATURE_CACHE_VERSION,
    mushafId: 1,
    displayBrand: "سُنّة",
  };
}

export function buildSignatureRenderCacheKey(pageNumber: number): string {
  const p = resolveSunnahMushafSignaturePreset();
  return [
    `p${pageNumber}`,
    p.presetId,
    p.presetVersion,
    p.quranDataVersion,
    p.pageMappingVersion,
    p.lineMappingVersion,
    p.rendererId,
    p.fontId,
    p.fontVersion,
    p.geometryVersion,
    p.renderCacheVersion,
  ].join("|");
}

const SIGNATURE_MIGRATION_FLAG = "sunnah-mushaf-signature-migrated-v1";

/** ترحيل كل المسارات إلى Signature — Idempotent. لا يمس نص القرآن. */
export function migrateToSunnahMushafSignature(storage: Storage = localStorage): boolean {
  try {
    if (storage.getItem(SIGNATURE_MIGRATION_FLAG) === "1") return false;
    storage.setItem("selectedMushafPreset", SUNNAH_MUSHAF_SIGNATURE_PRESET_ID);
    storage.setItem(SIGNATURE_MIGRATION_FLAG, "1");
    return true;
  } catch {
    return false;
  }
}

/** أحجام خط ثابتة حسب فئة عرض المحتوى — بلا auto-fit لكل صفحة */
export const SIGNATURE_FONT_SIZE_BANDS = [
  { maxContentWidth: 300, fontSize: 21 },
  { maxContentWidth: 340, fontSize: 23 },
  { maxContentWidth: 370, fontSize: 25 },
  { maxContentWidth: 400, fontSize: 27 },
  { maxContentWidth: 440, fontSize: 29 },
  { maxContentWidth: Number.POSITIVE_INFINITY, fontSize: 31 },
] as const;

export function resolveSignatureFontSizePx(
  contentWidthPx: number,
  bodyHeightPx: number,
): number {
  const band =
    SIGNATURE_FONT_SIZE_BANDS.find((b) => contentWidthPx < b.maxContentWidth) ??
    SIGNATURE_FONT_SIZE_BANDS[SIGNATURE_FONT_SIZE_BANDS.length - 1]!;
  const byHeight =
    bodyHeightPx > 0 ? Math.floor(bodyHeightPx / 15 / 1.85) : band.fontSize;
  return Math.max(18, Math.min(band.fontSize, byHeight, 34));
}
