/**
 * Sunnah Warm Yellow Printed Mushaf — توكنات بصرية مركزية.
 * مرجع بصري فقط (لا OCR / لا نسخ زخارف الصور).
 * لا تغيّر النص القرآني ولا Page/Line Mapping ولا أبعاد العلامات.
 *
 * CSS on `.nm-root` mirrors these names as kebab-case custom properties.
 */

/** ورق عاجي أصفر دافئ — أقرب للمرجع المطبوع */
export const mushafPaperWarmYellow = "#F8F1D4" as const;
export const mushafPaperWarmYellowDark = "#2A2418" as const;
export const mushafPaperEdge = "#E0CC7A" as const;
export const mushafPaperInnerGlow = "#FFFBE8" as const;

/** حبر قرآني دافئ قريب من الأسود */
export const mushafInk = "#1C160E" as const;
export const mushafInkPrimary = mushafInk;
export const mushafInkSecondary = "#3A2E1A" as const;
export const mushafWaqfInk = "#2A2014" as const;
export const mushafMetadataInk = "#5F4814" as const;

/** ذهب مطبعي أصفر خردلي — لإطار الصفحة والزخارف (أخف من العلامات) */
export const mushafPrintedGold = "#D4B12A" as const;
export const mushafPrintedGoldDark = "#A88618" as const;
export const mushafPrintedGoldBorder = "#B89218" as const;
export const mushafPrintedGoldText = "#5F4814" as const;

/** علامات الآيات — أصفر ذهبي واضح غير معدني */
export const mushafVerseMarkerFill = "#DDBA28" as const;
export const mushafVerseMarkerBorder = "#C49918" as const;
export const mushafVerseMarkerNumber = "#5F4814" as const;
export const mushafVerseMarkerHighlight = "#E8C94A" as const;

/** ليلي — ذهبي مطفأ على ورق فحمي دافئ */
export const mushafVerseMarkerDarkFill = "#C4A030" as const;
export const mushafVerseMarkerDarkBorder = "#A88618" as const;
export const mushafVerseMarkerDarkNumber = "#F0E2B8" as const;

/** توافق خلفي مع التوكنات السابقة */
export const mushafVerseMarkerGold = mushafVerseMarkerFill;
export const mushafVerseMarkerText = mushafVerseMarkerNumber;
