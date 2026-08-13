/** فهرس ثابت لمسارات التعلم — مرآة SEO لصفحات `/learning/paths/:slug`. */
export type LearningPathIndexEntry = {
  slug: string;
  title: string;
};

export const LEARNING_PATHS_INDEX: LearningPathIndexEntry[] = [
  { slug: "adab", title: "الآداب" },
  { slug: "akhlaq", title: "الأخلاق" },
  { slug: "aqeedah", title: "العقيدة" },
  { slug: "arabic", title: "اللغة العربية" },
  { slug: "dawah", title: "الدعوة" },
  { slug: "fiqh", title: "الفقه" },
  { slug: "hadith", title: "الحديث" },
  { slug: "mustalah-hadith", title: "مصطلح الحديث" },
  { slug: "nahw", title: "النحو" },
  { slug: "seerah", title: "السيرة" },
  { slug: "tafseer", title: "التفسير" },
  { slug: "tarbiyah", title: "التربية" },
  { slug: "tawheed", title: "التوحيد" },
  { slug: "uloom-quran", title: "علوم القرآن" },
  { slug: "usool-fiqh", title: "أصول الفقه" },
];
