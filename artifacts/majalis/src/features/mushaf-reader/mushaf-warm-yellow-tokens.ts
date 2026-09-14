/**
 * Sunnah Warm Yellow Ivory Mushaf — توكنات بصرية مركزية.
 * مرجع بصري فقط (لا OCR / لا نسخ زخارف الصور).
 * لا تغيّر النص القرآني ولا Page/Line Mapping ولا أبعاد العلامات.
 *
 * CSS on `.nm-root` mirrors these names as kebab-case custom properties.
 */

/** ورق عاجي أصفر هادئ — أقل تشبعًا من الإصدار السابق */
export const mushafPaperWarmYellow = "#FBF4D7" as const;
export const mushafPaperWarmYellowDark = "#2A2418" as const;
export const mushafPaperEdge = "#D7B73C" as const;
export const mushafPaperInnerGlow = "#FFF9E5" as const;
export const mushafPaperReadingSurface = "#FCF5DB" as const;

/** حبر قرآني دافئ قريب من الأسود */
export const mushafInk = "#1C160E" as const;
export const mushafInkPrimary = mushafInk;
export const mushafInkSecondary = "#3A2E1A" as const;
export const mushafWaqfInk = "#2A2014" as const;
export const mushafMetadataInk = "#5F4814" as const;

/** ذهب مطبعي هادئ — لإطار الصفحة والزخارف (أخف من العلامات) */
export const mushafPrintedGold = "#C9A82E" as const;
export const mushafPrintedGoldDark = "#A8881A" as const;
export const mushafPrintedGoldBorder = "#B89620" as const;
export const mushafPrintedGoldText = "#5F4814" as const;

/** علامات الآيات — أصفر ذهبي مطفأ (SunnahVerseRosette) */
export const mushafVerseMarkerFill = "#DCB424" as const;
export const mushafVerseMarkerBorder = "#B58F16" as const;
export const mushafVerseMarkerNumber = "#5F4812" as const;
export const mushafVerseMarkerHighlight = "#E4C038" as const;

/** ليلي — ذهبي مطفأ على ورق فحمي دافئ */
export const mushafVerseMarkerDarkFill = "#C4A030" as const;
export const mushafVerseMarkerDarkBorder = "#A88618" as const;
export const mushafVerseMarkerDarkNumber = "#F0E2B8" as const;

/** توافق خلفي مع التوكنات السابقة */
export const mushafVerseMarkerGold = mushafVerseMarkerFill;
export const mushafVerseMarkerText = mushafVerseMarkerNumber;
