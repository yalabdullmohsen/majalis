import type { QuranNavigationSource } from "@/lib/quran-navigation";

/** مواضع مصحف منظَّمة لكل نبي — أرقام فقط، بلا استخراج من النص. */
export type ProphetMushafMention = {
  surahId: number;
  ayahId: number;
  noteAr: string;
};

/**
 * P0: آيات قصة آدم الأربع (سجود الملائكة وإباء إبليس).
 * البقرة 34 · الأعراف 11 · الحجر 31 · ص 74
 */
export const PROPHET_MUSHAF_MENTIONS: Record<string, readonly ProphetMushafMention[]> = {
  adam: [
    { surahId: 2, ayahId: 34, noteAr: "أمر الملائكة بالسجود وإباء إبليس" },
    { surahId: 7, ayahId: 11, noteAr: "خلق آدم وأمر الملائكة بالسجود" },
    { surahId: 15, ayahId: 31, noteAr: "إباء إبليس عن السجود" },
    { surahId: 38, ayahId: 74, noteAr: "استكبار إبليس عن السجود" },
  ],
};

export const PROPHET_MUSHAF_NAV_SOURCE: QuranNavigationSource = "prophets-stories";
