/**
 * إحصاءات القرآن — أنواع موثّقة (لا رقم بلا مصدر).
 */
export type QuranStatKind = "agreed" | "by-school" | "disputed" | "computed";

export type QuranStatVariant = {
  value: string;
  attribution: string;
  source: string;
};

export type QuranStat = {
  id: string;
  label: string;
  value: number | string;
  kind: QuranStatKind;
  /** مرجع محدد — إلزامي */
  source: string;
  method?: string;
  variants?: QuranStatVariant[];
  note?: string;
};

export const QURAN_STAT_KIND_LABEL: Record<QuranStatKind, string> = {
  agreed: "متفق عليه",
  "by-school": "بحسب العدّ",
  disputed: "مختلف فيه",
  computed: "حساب آلي",
};

/** مصادر ممنوعة — تفشل البوابة عند ورودها */
export const FORBIDDEN_STAT_SOURCES = [
  "الإعجاز العددي",
  "التناسق الرقمي",
  "numericmiracle",
  "harunyahya",
  "miraclequran",
  "reddit.com",
  "quora.com",
  "facebook.com",
  "tiktok.com",
  "wikipedia.org",
] as const;

/** مصادر معتمدة مسموحة في النصوص */
export const ALLOWED_STAT_SOURCE_MARKERS = [
  "مجمع الملك فهد",
  "البيان في عدّ آي القرآن",
  "الداني",
  "الإتقان",
  "السيوطي",
  "ناظمة الزهر",
  "مصحف المدينة",
  "نص المصحف العثماني",
  "public/data/quran",
] as const;

export type QuranComputedStats = {
  fingerprint: string;
  methodology: { arabic: string };
  totals: {
    surahs: number;
    ayahs: number;
    words: number;
    letters: number;
    meccanSurahs: number;
    medinanSurahs: number;
    sajdaMarksInData: number;
  };
  extremes: {
    longestAyah: { surah: number; ayah: number; len: number };
    shortestAyah: { surah: number; ayah: number; len: number };
    longestSurah: { number: number; ayahs: number; name: string };
    shortestSurah: { number: number; ayahs: number; name: string };
  };
};
