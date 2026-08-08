/**
 * نموذج بيانات خريطة أحداث السيرة النبوية.
 * المرحلة: ما قبل البعثة / المكية / المدنية.
 * كل حدث منشور يلزم بمصدر (عمل + مرجع)؛ الناقص يُدرج في قائمة المراجعة.
 */

export type SeerahPhase = "pre_prophethood" | "makki" | "madani";

/** أعمال معتمدة في منهج القسم (وما وافق الصحيحين والسنن). */
export type SeerahSourceWork =
  | "ibn_hisham"
  | "ibn_saad"
  | "ibn_al_qayyim_zad"
  | "ibn_kathir_bidayah"
  | "al_dhahabi_seerah"
  | "qadi_iyad_shifa"
  | "akram_diya_umari"
  | "faruq_hamada"
  | "mahdi_rizqallah"
  | "mubarakfuri_rahiq"
  | "sahih_bukhari"
  | "sahih_muslim";

export type SeerahDateCertainty = "certain" | "approximate" | "disputed" | "not_applicable";

export type SeerahSource = {
  work: SeerahSourceWork;
  /** موضع المرجع: جزء/باب/رقم حديث أو فصل في السيرة */
  reference: string;
  note?: string;
};

export type SeerahEvent = {
  id: string;
  titleAr: string;
  phase: SeerahPhase;
  /** السنة الهجرية إن انطبقت؛ قبل الهجرة تُترك null */
  yearHijri: number | null;
  /** السنة الميلادية التقريبية عند الحاجة */
  yearGregorian: number | null;
  place: string;
  people: string[];
  shortDescription: string;
  sources: SeerahSource[];
  dateCertainty: SeerahDateCertainty;
  /** تحفّظ يُعرض مع التاريخ أو الرواية عند الخلاف */
  caveat?: string;
};

export type SeerahReviewKind =
  | "missing_source"
  | "disputed_date"
  | "needs_grade"
  | "needs_verification"
  | "popular_unverified";

export type SeerahReviewQueueItem = {
  id: string;
  titleAr: string;
  reasonAr: string;
  kind: SeerahReviewKind;
  relatedEventId?: string;
  notesAr?: string;
};
