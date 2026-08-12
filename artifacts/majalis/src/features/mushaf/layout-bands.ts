/**
 * نطاقات تخطيط المصحف — مصدر واحد للثوابت (CSS vars + JS).
 * الترتيب من الأعلى للأسفل: header → content → footer → toolbar → inset-bottom.
 * لا تتقاطع النطاقات؛ contentBand يُشتق بعد طرح الثلاثة الأخرى.
 *
 * الاشتقاق النسبي: عند قصر ارتفاع الشاشة عن المرجع (٨٤٤) تُصغَّر النطاقات
 * بنسبة الارتفاع مع أرضيات تحافظ على أهداف لمس ≥٤٤px للشريط.
 */
export const MUSHAF_LAYOUT_REF_VIEWPORT_H = 844;

export const MUSHAF_LAYOUT_BANDS = {
  /** ارتفاع شريط الأدوات العائم + هامش داخلي */
  toolbarBandPx: 52,
  /**
   * نطاق الذيل: خرطوش ٣٠px + ≥٨px فوق شريط الأدوات + هامش علوي
   * يضمن ≥٢٨px بين حبر آخر سطر وأعلى الخرطوش مع contentFooterGap.
   */
  footerBandPx: 46,
  /** فاصل إلزامي بين نهاية contentBand وبداية footerBand (≥٢٨px حبر→خرطوش) */
  contentFooterGapPx: 28,
  /** ارتفاع تقريبي للرأس (بدون inset-top) — للقياس/التوثيق */
  headerBandPx: 38,
} as const;

export type MushafLayoutBandValues = {
  toolbarBandPx: number;
  footerBandPx: number;
  contentFooterGapPx: number;
  headerBandPx: number;
};

/**
 * نطاقات مشتقّة من ارتفاع نافذة العرض المقيس — لا قيم مضبوطة على مقاس واحد.
 * على المقاسات ≥ المرجع تُبقى الثوابت كما هي (لا نكبّر الشريط بلا داعٍ).
 */
export function scaleMushafLayoutBands(
  viewportH: number,
  refH: number = MUSHAF_LAYOUT_REF_VIEWPORT_H,
): MushafLayoutBandValues {
  const h = Number.isFinite(viewportH) && viewportH > 0 ? viewportH : refH;
  if (h >= refH * 0.98) {
    return { ...MUSHAF_LAYOUT_BANDS };
  }
  const scale = Math.max(0.72, Math.min(1, h / refH));
  return {
    toolbarBandPx: Math.max(44, Math.round(MUSHAF_LAYOUT_BANDS.toolbarBandPx * scale)),
    footerBandPx: Math.max(34, Math.round(MUSHAF_LAYOUT_BANDS.footerBandPx * scale)),
    contentFooterGapPx: Math.max(16, Math.round(MUSHAF_LAYOUT_BANDS.contentFooterGapPx * scale)),
    headerBandPx: Math.max(28, Math.round(MUSHAF_LAYOUT_BANDS.headerBandPx * scale)),
  };
}

/** يطبّق متغيّرات CSS التي يقرأها quran.css لموضع الشريط والذيل. */
export function applyMushafLayoutBandCssVars(
  target: HTMLElement | CSSStyleDeclaration,
  bands: MushafLayoutBandValues,
): void {
  const style = "setProperty" in target ? target : (target as HTMLElement).style;
  style.setProperty("--mpv-toolbar-band", `${bands.toolbarBandPx}px`);
  style.setProperty("--mpv-footer-band", `${bands.footerBandPx}px`);
  style.setProperty("--mpv-content-footer-gap", `${bands.contentFooterGapPx}px`);
  style.setProperty("--mpv-header-band", `${bands.headerBandPx}px`);
}

/** الحجز السفلي الكلي تحت contentBand (مرجع) */
export const MUSHAF_BOTTOM_RESERVE_PX =
  MUSHAF_LAYOUT_BANDS.toolbarBandPx +
  MUSHAF_LAYOUT_BANDS.footerBandPx +
  MUSHAF_LAYOUT_BANDS.contentFooterGapPx;

export function mushafBottomReservePx(bands: MushafLayoutBandValues = MUSHAF_LAYOUT_BANDS): number {
  return bands.toolbarBandPx + bands.footerBandPx + bands.contentFooterGapPx;
}

export type MushafBandHeights = {
  viewportH: number;
  insetTop: number;
  insetBottom: number;
  headerBandPx: number;
  contentBandPx: number;
  footerBandPx: number;
  toolbarBandPx: number;
  contentFooterGapPx: number;
};
