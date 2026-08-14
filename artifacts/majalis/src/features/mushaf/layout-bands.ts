/**
 * نطاقات تخطيط المصحف — مرجع آية (٪ من ارتفاع الشاشة).
 * الترتيب: header → content (~٧٩–٨٠٪) → footer → toolbar → inset-bottom.
 * صفر تقاطع بين النطاقات والحبر.
 *
 * @see docs/mushaf-ref/aya/README.md
 */
export const MUSHAF_LAYOUT_REF_VIEWPORT_H = 844;
export const MUSHAF_LAYOUT_REF_VIEWPORT_W = 390;

/** نسب آية مقيسة من المرجع */
export const MUSHAF_AYA_BANDS_PCT = {
  headerBaseline: 8.3,
  contentTopMin: 11.5,
  contentTopMax: 12.1,
  contentBotMin: 91.1,
  contentBotMax: 91.8,
  contentFillMin: 79,
  contentFillMax: 80,
  footerTop: 93.2,
  footerBot: 95.5,
  sideMarginStart: 1.5,
  sideMarginEnd: 98.4,
  cartoucheOddStart: 84,
  cartoucheOddEnd: 97,
  cartoucheEvenStart: 3,
  cartoucheEvenEnd: 16,
  openingBannerTop: 27.7,
  openingBlockEnd: 74.8,
} as const;

/** هوامش صفحة اختيارية للواجهة (لا تغيّر شبكة QPC المطلقة) */
export const MUSHAF_PAGE_CHROME = {
  /** يطابق MUSHAF_OPTICAL_FONT_SCALE — سقف آمن للبوابات ≤١٫٠٢ */
  fontScaleBoost: 1.02,
  chromeHideMs: 3200,
} as const;

export const MUSHAF_LAYOUT_BANDS = {
  /** ارتفاع شريط الأدوات العائم + هامش داخلي */
  toolbarBandPx: 52,
  /**
   * نطاق الذيل: خرطوش ٣٠px · مركزه ٩٤٫٣٪ (٩٣٫٢٪–٩٥٫٥٪)
   */
  footerBandPx: 44,
  /**
   * فاصل ضيق بين نهاية الحبر (٩١٫٥٪) وأعلى الذيل (~٩١٫٧٪ عند مركز ٩٤٫٣٪)
   * — ١٦px السابقة كانت تُنهي الكتلة عند ~٨٩٫٩٪
   */
  contentFooterGapPx: 4,
  /** ارتفاع تقريبي للرأس عند خط أساس ٨٫٣٪ */
  headerBandPx: Math.round((MUSHAF_AYA_BANDS_PCT.headerBaseline / 100) * MUSHAF_LAYOUT_REF_VIEWPORT_H),
} as const;

export type MushafLayoutBandValues = {
  toolbarBandPx: number;
  footerBandPx: number;
  contentFooterGapPx: number;
  headerBandPx: number;
};

/**
 * نطاقات مشتقّة من ارتفاع نافذة العرض المقيس — لا قيم مضبوطة على مقاس واحد.
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
    contentFooterGapPx: Math.max(2, Math.round(MUSHAF_LAYOUT_BANDS.contentFooterGapPx * scale)),
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

/** يتحقق من صفر تقاطع بين النطاقات الأربعة */
export function assertMushafBandsDisjoint(bands: MushafLayoutBandValues, viewportH: number): boolean {
  const header = bands.headerBandPx;
  const footer = bands.footerBandPx;
  const toolbar = bands.toolbarBandPx;
  const gap = bands.contentFooterGapPx;
  const content = viewportH - header - footer - toolbar - gap;
  return content > 0 && header > 0 && footer > 0 && toolbar > 0 && gap >= 0;
}
