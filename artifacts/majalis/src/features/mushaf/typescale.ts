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

/** يبني خصائص CSS لـ --mushaf-S ومشتقاته */
export function mushafTypescaleCssVars(S: number = MUSHAF_S_PX): Record<string, string> {
  const s = Number.isFinite(S) && S > 0 ? S : MUSHAF_S_PX;
  return {
    "--mushaf-S": `${s}px`,
    "--mushaf-fs-body": `calc(${MUSHAF_TYPESCALE.body} * var(--mushaf-S))`,
    "--mushaf-fs-basmala": `calc(${MUSHAF_TYPESCALE.basmala} * var(--mushaf-S))`,
    "--mushaf-fs-surah-banner": `calc(${MUSHAF_TYPESCALE.surahBannerName} * var(--mushaf-S))`,
    "--mushaf-fs-page-numeral": `calc(${MUSHAF_TYPESCALE.pageNumeral} * var(--mushaf-S))`,
    "--mushaf-fs-header-meta": `calc(${MUSHAF_TYPESCALE.headerMeta} * var(--mushaf-S))`,
    "--mushaf-fs-footer-hizb": `calc(${MUSHAF_TYPESCALE.footerHizb} * var(--mushaf-S))`,
  };
}
