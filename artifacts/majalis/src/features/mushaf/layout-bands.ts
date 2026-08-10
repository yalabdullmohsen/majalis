/**
 * نطاقات تخطيط المصحف — مصدر واحد للثوابت (CSS vars + JS).
 * الترتيب من الأعلى للأسفل: header → content → footer → toolbar → inset-bottom.
 * لا تتقاطع النطاقات؛ contentBand يُشتق بعد طرح الثلاثة الأخرى.
 */
export const MUSHAF_LAYOUT_BANDS = {
  /** ارتفاع شريط الأدوات العائم + هامش داخلي */
  toolbarBandPx: 52,
  /**
   * نطاق الذيل: خرطوش ٣٠px + ≥٨px فوق شريط الأدوات + هامش علوي
   * يضمن ≥٢٨px بين حبر آخر سطر وأعلى الخرطوش مع contentFooterGap.
   */
  footerBandPx: 46,
  /** فاصل إلزامي بين نهاية contentBand وبداية footerBand (≥٢٨px حبر→خرطوش مع موضع الخرطوش) */
  contentFooterGapPx: 20,
  /** ارتفاع تقريبي للرأس (بدون inset-top) — للقياس/التوثيق */
  headerBandPx: 38,
} as const;

/** الحجز السفلي الكلي تحت contentBand */
export const MUSHAF_BOTTOM_RESERVE_PX =
  MUSHAF_LAYOUT_BANDS.toolbarBandPx +
  MUSHAF_LAYOUT_BANDS.footerBandPx +
  MUSHAF_LAYOUT_BANDS.contentFooterGapPx;

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
