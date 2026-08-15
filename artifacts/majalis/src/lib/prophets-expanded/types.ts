/**
 * توسعة قصص الأنبياء — أنواع ومصادر موثّقة.
 * أي فقرة بلا sourceReliability مرفوضة بالاختبار.
 */
export type SourceReliability =
  | "quran_explicit"
  | "sahih_hadith"
  | "tafsir_supported"
  | "historical_report"
  | "israiliyyat_avoid"
  | "uncertain";

export type StoryParagraph = {
  text: string;
  sourceReliability: SourceReliability;
  /** تخريج أو نسبة مختصرة: البخاري، مسلم، ذكر ابن كثير… */
  sourceNote?: string;
};

export type ExpandedProphetStory = {
  slug: string;
  /** عنوان القصة */
  title: string;
  /** نبذة مختصرة */
  brief: string;
  /** مواضع ذكره في القرآن */
  quranMentions: StoryParagraph[];
  /** أبرز الأحداث الثابتة */
  establishedEvents: StoryParagraph[];
  /** ما ثبت في السنة إن وجد */
  sunnah: StoryParagraph[];
  /** ما يذكره أهل التفسير مع التنبيه عند الحاجة */
  tafsir: StoryParagraph[];
  /** ما لا يصح الجزم به */
  doNotAssert: StoryParagraph[];
  /** الصفات والعبر */
  attributesAndLessons: StoryParagraph[];
  /** مراجع مختصرة */
  references: StoryParagraph[];
};

export const SOURCE_RELIABILITY_VALUES: readonly SourceReliability[] = [
  "quran_explicit",
  "sahih_hadith",
  "tafsir_supported",
  "historical_report",
  "israiliyyat_avoid",
  "uncertain",
] as const;

/** فقرات تُعرض للجمهور — تُستبعد الإسرائيليات الممنوعة من النشر */
export function publishableParagraphs(paras: StoryParagraph[]): StoryParagraph[] {
  return paras.filter((p) => p.sourceReliability !== "israiliyyat_avoid");
}

export function allParagraphs(story: ExpandedProphetStory): StoryParagraph[] {
  return [
    ...story.quranMentions,
    ...story.establishedEvents,
    ...story.sunnah,
    ...story.tafsir,
    ...story.doNotAssert,
    ...story.attributesAndLessons,
    ...story.references,
  ];
}

/** صيغ احترازية متوقعة للتقارير التاريخية / غير القطعية */
export const CAUTION_MARKERS = [
  "يُذكر",
  "ذُكر",
  "قيل",
  "ولا يثبت",
  "لا يثبت",
  "دون جزم",
  "بلا جزم",
  "لا يُجزم",
  "يُقتصر",
  "اختلف",
  "خلاف",
  "بعض كتب",
  "عند بعض",
  "لا يصح الجزم",
  "بصيغة التوقف",
  "إن احتيج",
] as const;
