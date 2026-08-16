/**
 * إحصاءات القرآن — أنواع موثّقة (لا رقم بلا مصدر).
 */
export type QuranStatKind = "agreed" | "by-school" | "disputed" | "computed";

/** أساس العدّ — إلزامي لمداخل الألفاظ/الموضوعات اللفظية */
export type CountBasis = "exact-form" | "root" | "lemma" | "topic";

export type QuranStatGroup = "bunya" | "alfaz" | "mawdoo" | "suwar" | "ajaib";

export type QuranStatVariant = {
  value: string;
  attribution: string;
  source: string;
};

export type QuranStatEvidence = {
  surah: number;
  ayah: number;
  excerpt?: string;
};

export type QuranStat = {
  id: string;
  label: string;
  /** رقم أو نطاق رقمي قصير للبطاقة — ممنوع النص الوصفي */
  value: number | string;
  note?: string;
  kind: QuranStatKind;
  basis?: CountBasis;
  method?: string;
  /** مصدر يُعرض للمستخدم — بلا مسارات ملفات */
  source: string;
  /** مسار تقني داخلي — لا يُعرض */
  technicalSource?: string;
  variants?: QuranStatVariant[];
  evidence?: QuranStatEvidence[];
  detail?: string;
  group: QuranStatGroup;
};

export const QURAN_STAT_KIND_LABEL: Record<QuranStatKind, string> = {
  agreed: "متفق عليه",
  "by-school": "بحسب العدّ",
  disputed: "مختلف فيه",
  computed: "حساب آلي",
};

export const QURAN_STAT_GROUP_LABEL: Record<QuranStatGroup, string> = {
  bunya: "بنية القرآن",
  alfaz: "معجم الألفاظ",
  mawdoo: "ألفاظ وموضوعات",
  suwar: "السور",
  ajaib: "لطائف موثّقة",
};

export const QURAN_STAT_BASIS_LABEL: Record<CountBasis, string> = {
  "exact-form": "الصيغة الحرفية",
  root: "تقريب الجذر",
  lemma: "المادة المعجمية",
  topic: "موضوع (لا لفظ)",
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

/** مسارات/مصطلحات تقنية ممنوعة في النص المعروض للمستخدم */
export const FORBIDDEN_USER_FACING_TECH = [
  "public/data",
  "surah-*.json",
  "mushaf=1",
  "revelationType",
  ".woff2",
  "stats.json",
] as const;

export type WordFreqRow = {
  form: string;
  count: number;
  letters: number;
};

export type SurahStatRow = {
  number: number;
  name: string;
  revelationType: string;
  ayahs: number;
  words: number;
  letters: number;
  pageStart?: number;
  juz?: number;
};

export type QuranComputedStats = {
  fingerprint: string;
  methodology: { arabic: string };
  totals: {
    surahs: number;
    ayahs: number;
    words: number;
    letters: number;
    basmalaOccurrencesDetected?: number;
    meccanSurahs: number;
    medinanSurahs: number;
    sajdaMarksInData: number;
  };
  extremes: {
    longestAyah: { surah: number; ayah: number; len: number; text?: string };
    shortestAyah: { surah: number; ayah: number; len: number; text?: string };
    longestSurah: { number: number; ayahs: number; name: string };
    shortestSurah: { number: number; ayahs: number; name: string };
  };
  perSurah?: SurahStatRow[];
  wordFreq?: {
    allTop: WordFreqRow[];
    contentTop: WordFreqRow[];
    longestWords: Array<WordFreqRow & { surah: number; ayah: number }>;
    topicCounts: Record<string, number>;
    allahCount: number;
    rahmanCount: number;
  };
  sajda?: Array<{ surah: number; ayah: number }>;
};
