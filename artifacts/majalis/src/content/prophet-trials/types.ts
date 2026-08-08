/**
 * نموذج بيانات «ابتلاءات الأنبياء».
 * كل عنصر منشور يلزم بشاهد: آية (سورة:آية) أو حديث مُدرَّج مع المصدر والدرجة.
 * ما اشتهر بلا سند محرَّر أو من الإسرائيليات يُدرَج في review-queue فقط.
 */

export type ProphetTrialCitationKind = "ayah" | "hadith";

export type ProphetTrialCitation = {
  kind: ProphetTrialCitationKind;
  /** اسم المصدر: القرآن / صحيح البخاري / صحيح مسلم / سنن… */
  source: string;
  /** مرجع: سورة:آية أو رقم الحديث/الباب */
  reference: string;
  /** للحديث: صحيح/حسن…؛ للقرآن: «قرآن» */
  grade: string;
  textExcerpt?: string;
};

export type ProphetTrial = {
  id: string;
  prophetSlug: string;
  prophetNameAr: string;
  trialTitleAr: string;
  /** سياق الابتلاء باختصار */
  contextAr: string;
  /** موقف النبي من الابتلاء */
  stanceAr: string;
  /** ثمرة الابتلاء / العاقبة */
  fruitAr: string;
  lessonsAr: string[];
  citations: ProphetTrialCitation[];
};

export type ProphetTrialReviewKind =
  | "israiliyyat"
  | "missing_source"
  | "needs_grade"
  | "popular_unverified"
  | "needs_verification";

export type ProphetTrialReviewQueueItem = {
  id: string;
  titleAr: string;
  reasonAr: string;
  kind: ProphetTrialReviewKind;
  relatedTrialId?: string;
  notesAr?: string;
};
