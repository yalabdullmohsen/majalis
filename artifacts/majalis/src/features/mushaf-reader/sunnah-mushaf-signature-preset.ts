/**
 * Sunnah Mushaf Signature — الـPreset الرسمي لمصحف سُنّة.
 * لا يغيّر نص القرآن ولا Page/Line Mapping — يصف الهوية الهندسية والمرخّصة فقط.
 */

import { MUSHAF_PROVENANCE } from "@/lib/mushaf-v2/provenance";

export const SUNNAH_MUSHAF_SIGNATURE_PRESET_ID = "sunnah-mushaf-signature-v1" as const;
export const SUNNAH_MUSHAF_SIGNATURE_VERSION = "1.0.0" as const;
export const SUNNAH_MUSHAF_SIGNATURE_CACHE_VERSION = "sms-2026-09-24-single-gold";

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
    /* sidePx=2 يوسّع contentWidth على 390 دون رفع fontSize فوق 24 */
    contentInsets: { headerPx: 36, footerPx: 40, sidePx: 2 },
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

/**
 * أحجام خط ثابتة حسب فئة عرض المحتوى — بلا auto-fit لكل صفحة.
 * سقف صريح 24px: 25 يسبب lineOverflow على القياسات الحالية.
 */
export const SIGNATURE_FONT_SIZE_MAX_PX = 24;

export const SIGNATURE_FONT_SIZE_BANDS = [
  { maxContentWidth: 300, fontSize: 22 },
  { maxContentWidth: 340, fontSize: 23 },
  { maxContentWidth: Number.POSITIVE_INFINITY, fontSize: 24 },
] as const;

/**
 * قاسم عرض يثبّت 24px على 390 مع contentWidth الأوسع (sidePx=2 → body≈386).
 * لا يُستخدم لرفع الخط فوق SIGNATURE_FONT_SIZE_MAX_PX على الهاتف.
 * على اللوح يستخدمه useStableMushafLayout لعرض الحبر الآمن.
 */
export const SIGNATURE_WIDTH_CAPACITY_EM = 15.8;

/**
 * حجم Signature من فئة الشاشة + سقف هندسي موحّد (عرض/ارتفاع).
 * مقفول عند 24 — مسار اللوح في useStableMushafLayout يوسّع بشكل منفصل.
 */
export function resolveSignatureFontSizePx(
  contentWidthPx: number,
  bodyHeightPx: number,
): number {
  const band =
    SIGNATURE_FONT_SIZE_BANDS.find((b) => contentWidthPx < b.maxContentWidth) ??
    SIGNATURE_FONT_SIZE_BANDS[SIGNATURE_FONT_SIZE_BANDS.length - 1]!;
  const byHeight =
    bodyHeightPx > 0 ? Math.floor(bodyHeightPx / 15 / 1.85) : band.fontSize;
  const byWidth =
    contentWidthPx > 0
      ? Math.floor(contentWidthPx / SIGNATURE_WIDTH_CAPACITY_EM)
      : band.fontSize;
  return Math.max(
    18,
    Math.min(band.fontSize, byHeight, byWidth, SIGNATURE_FONT_SIZE_MAX_PX),
  );
}

/** سقف خط اللوح — byHeight/byWidth يقيّدان؛ سعة السطر 15.8em */
export const TABLET_MUSHAF_FONT_SIZE_MAX_PX = 48;

/** عرض غلاف الصفحة على اللوح = عرض الحبر الآمن للخط + الحشو. */
export function resolveTabletPageMaxWidthPx(
  viewportW: number,
  fontSizePx: number,
  sidePadPx: number,
): number {
  const inkW = Math.ceil(fontSizePx * SIGNATURE_WIDTH_CAPACITY_EM);
  return Math.max(120, Math.min(viewportW, inkW + sidePadPx * 2));
}

/** حجم خط اللوح من الارتفاع/العرض — بلا رفع سقف الهاتف 24 في Signature. */
export function resolveTabletSignatureFontSizePx(
  contentWidthPx: number,
  bodyHeightPx: number,
): number {
  const byHeight =
    bodyHeightPx > 0 ? Math.floor(bodyHeightPx / 15 / 1.85) : 24;
  const byWidth =
    contentWidthPx > 0
      ? Math.floor(contentWidthPx / SIGNATURE_WIDTH_CAPACITY_EM)
      : 24;
  return Math.max(
    18,
    Math.min(byHeight, byWidth, TABLET_MUSHAF_FONT_SIZE_MAX_PX),
  );
}
