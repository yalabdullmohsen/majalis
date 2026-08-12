/**
 * سلّم خطوط المصحف الموحّد — كل الأحجام مشتقة من S (حجم نص الصفحة العادية).
 * لا قيم px مثبّتة للعناصر المدرجة؛ استخدم calc(ratio * var(--mushaf-S)).
 */
import { MUSHAF_LAYOUT_BASELINE } from "./config";

/** الحجم الأساسي S — مرجع ص٢٨٣ */
export const MUSHAF_S_PX = MUSHAF_LAYOUT_BASELINE.fontSizePx;

export const MUSHAF_TYPESCALE = {
  /** نص المصحف + البسملة */
  body: 1,
  basmala: 1,
  /** اسم السورة داخل الشارة */
  surahBannerName: 0.78,
  /** رقم الصفحة داخل الخرطوش */
  pageNumeral: 0.46,
  /** «الجزء N» واسم السورة في الرأس */
  headerMeta: 0.42,
  /** وصف الحزب في الذيل */
  footerHizb: 0.4,
} as const;

export type MushafTypescaleKey = keyof typeof MUSHAF_TYPESCALE;

/** يبني خصائص CSS لـ --mushaf-S ومشتقاته (قيم px مطلقة حتى لا تُكسَر الوراثة) */
export function mushafTypescaleCssVars(S: number = MUSHAF_S_PX): Record<string, string> {
  const s = Number.isFinite(S) && S > 0 ? S : MUSHAF_S_PX;
  const px = (ratio: number) => `${+(s * ratio).toFixed(4)}px`;
  return {
    "--mushaf-S": `${s}px`,
    "--mushaf-fs-body": px(MUSHAF_TYPESCALE.body),
    "--mushaf-fs-basmala": px(MUSHAF_TYPESCALE.basmala),
    "--mushaf-fs-surah-banner": px(MUSHAF_TYPESCALE.surahBannerName),
    "--mushaf-fs-page-numeral": px(MUSHAF_TYPESCALE.pageNumeral),
    "--mushaf-fs-header-meta": px(MUSHAF_TYPESCALE.headerMeta),
    "--mushaf-fs-footer-hizb": px(MUSHAF_TYPESCALE.footerHizb),
  };
}
