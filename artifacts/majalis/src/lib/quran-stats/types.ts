/**
 * إحصاءات القرآن — أنواع محرَّرة يدويًا من مصادر مطبوعة فقط.
 * ممنوع أي اشتقاق رقمي من نص المصحف لعرضه في هذا القسم.
 */
export type QuranStatKind = "agreed" | "by-school" | "disputed";

/** أساس العدّ: لفظ بصيغته | مادة/جذر بكل اشتقاقاته | موضوع بمرادفاته */
export type CountBasis = "lafz" | "madda" | "mawdoo";

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

export type QuranStatSource = {
  book: string;
  author: string;
  /** مادة المعجم أو الجزء/الصفحة — إلزامي */
  ref: string;
};

export type QuranStat = {
  id: string;
  /** مفتاح موضوع لمنع تكرار رقمين لشيء واحد */
  topicKey?: string;
  label: string;
  value: number | string;
  note?: string;
  kind: QuranStatKind;
  /** إلزامي لمجموعات الألفاظ والموضوعات */
  basis?: CountBasis;
  /** بيان منهج العدّ المعروض في الشيت */
  method?: string;
  source: QuranStatSource;
  variants?: QuranStatVariant[];
  evidence?: QuranStatEvidence[];
  detail?: string;
  group: QuranStatGroup;
};

export const QURAN_STAT_KIND_LABEL: Record<QuranStatKind, string> = {
  agreed: "متفق عليه",
  "by-school": "بحسب العدّ",
  disputed: "مختلف فيه",
};

export const QURAN_STAT_GROUP_LABEL: Record<QuranStatGroup, string> = {
  bunya: "بنية القرآن",
  alfaz: "معجم الألفاظ",
  mawdoo: "ألفاظ وموضوعات",
  suwar: "السور",
  ajaib: "لطائف موثّقة",
};

export const QURAN_STAT_BASIS_LABEL: Record<CountBasis, string> = {
  lafz: "لفظ (صيغة محدّدة)",
  madda: "مادة / جذر",
  mawdoo: "موضوع",
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

/** مصطلحات تقنية ممنوعة في واجهة المستخدم */
export const FORBIDDEN_USER_FACING_TECH = [
  "في البيانات",
  "المكتشفة",
  "حسب بيانات التطبيق",
  "public/data",
  "surah-*.json",
  "mushaf=1",
  "revelationType",
  ".woff2",
  "stats.json",
] as const;

/** سطر مصدر مختصر للبطاقة */
export function formatStatSourceLine(source: QuranStatSource): string {
  return `${source.book} — ${source.ref}`;
}

export function formatStatSourceFull(source: QuranStatSource): string {
  return `${source.book} — ${source.author} — ${source.ref}`;
}
