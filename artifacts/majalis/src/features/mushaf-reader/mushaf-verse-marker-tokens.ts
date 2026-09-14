/**
 * Printed Mushaf Gold — ذهب ورقي هادئ للعلامات والزخارف داخل صفحة المصحف فقط.
 * لا يغيّر لون النص القرآني ولا Page/Line Mapping ولا هندسة العلامات.
 *
 * CSS mirrors (mushaf-reader.css on `.nm-root`):
 *   --mushaf-verse-marker-gold | --mushaf-verse-marker-border | --mushaf-verse-marker-text
 */
export const mushafVerseMarkerGold = "#A3864D" as const;
export const mushafVerseMarkerBorder = "#8A7042" as const;
export const mushafVerseMarkerText = "#6B5530" as const;

/** ثانوي عسلي أخف للتعبئة/الزخارف الناعمة */
export const mushafVerseMarkerGoldSoft = "#B59A63" as const;

/** ليلي — أفتح قليلًا مع بقاء الطابع المطبعي غير المعدني */
export const mushafVerseMarkerGoldNight = "#B59A63" as const;
export const mushafVerseMarkerBorderNight = "#A3864D" as const;
export const mushafVerseMarkerTextNight = "#D2BE8E" as const;
