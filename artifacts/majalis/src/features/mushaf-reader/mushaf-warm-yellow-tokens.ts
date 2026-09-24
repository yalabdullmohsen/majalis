/**
 * Sunnah Warm Yellow Ivory Mushaf — توكنات بصرية مركزية.
 * مرجع بصري فقط (لا OCR / لا نسخ زخارف الصور).
 * لا تغيّر النص القرآني ولا Page/Line Mapping ولا أبعاد العلامات.
 *
 * CSS on `.nm-root` mirrors these names as kebab-case custom properties.
 */

/** ورق عاجي دافئ أفتح (Warm Ivory) — راحة بصرية بلا أبيض وبلا أصفر فاقع */
export const mushafPaperWarmYellow = "#FCF6E3" as const;
export const mushafPaperWarmYellowDark = "#2A2418" as const;
export const mushafPaperEdge = "#C9B06A" as const;
export const mushafPaperInnerGlow = "#FFFEF6" as const;
export const mushafPaperReadingSurface = "#FFFBEF" as const;

/** حبر قرآني دافئ قريب من الأسود */
export const mushafInk = "#1C160E" as const;
export const mushafInkPrimary = mushafInk;
export const mushafInkSecondary = "#3A2E1A" as const;
export const mushafWaqfInk = "#2A2014" as const;
export const mushafMetadataInk = "#5F4814" as const;

/** ذهب مطبعي موحّد — Quran Gold Token (إطار + علامات + زخارف) */
export const mushafPrintedGold = "#C9A82E" as const;
export const mushafPrintedGoldDark = "#A8881A" as const;
export const mushafPrintedGoldBorder = "#B89620" as const;
export const mushafPrintedGoldText = "#5F4814" as const;
export const mushafOrnamentMuted = "#C4A84A" as const;

/** Quran Gold — نفس الدرجة للعلامات والإطار (لا درجات ذهبية متعددة) */
export const quranGold = mushafPrintedGold;
export const quranGoldDeep = mushafPrintedGoldBorder;
export const quranGoldInk = mushafPrintedGoldText;

/** علامات الآيات — نفس Quran Gold Token */
export const mushafVerseMarkerFill = quranGold;
export const mushafVerseMarkerBorder = quranGoldDeep;
export const mushafVerseMarkerNumber = quranGoldInk;
export const mushafVerseMarkerHighlight = "#E4C038" as const;

/** ليلي — ذهبي مطفأ على ورق فحمي دافئ */
export const mushafVerseMarkerDarkFill = "#C4A030" as const;
export const mushafVerseMarkerDarkBorder = "#A88618" as const;
export const mushafVerseMarkerDarkNumber = "#F0E2B8" as const;

/**
 * First Spread — لم يعد له Accent زمردي منفصل؛ العلامة ذهبية عالميًا.
 * الثوابت أدناه توافق تاريخي فقط (لا تُستخدم كافتراضي للمصحف).
 */
export const mushafOpeningTurquoise = "#C9A82E" as const;
export const mushafOpeningTurquoiseDeep = "#B89620" as const;
export const mushafOpeningMarkerFill = mushafVerseMarkerFill;
export const mushafOpeningMarkerBorder = mushafVerseMarkerBorder;
export const mushafOpeningMarkerNumber = mushafVerseMarkerNumber;
export const mushafOpeningGoldAccent = mushafPrintedGold;
export const mushafOpeningMetadataSurface = "#F3EBD8" as const;
export const mushafOpeningMetadataText = "#3A2E1A" as const;

/** @deprecated مرادفات قديمة — تشير للذهب */
export const mushafEmeraldPrimary = mushafVerseMarkerFill;
export const mushafEmeraldSecondary = mushafVerseMarkerBorder;

/** توافق خلفي مع التوكنات السابقة */
export const mushafVerseMarkerGold = mushafVerseMarkerFill;
export const mushafVerseMarkerText = mushafVerseMarkerNumber;
