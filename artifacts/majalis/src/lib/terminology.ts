/**
 * مرجع موحّد لمصطلحات واجهة المجلس العلمي.
 * لا تُستخدم مرادفات مختلفة لنفس المفهوم خارج هذا الملف.
 */
export const T = {
  siteName: "المجلس العلمي",
  siteTagline: "المنصة العلمية الشرعية",

  home: "الرئيسية",
  search: "البحث",
  assistant: "المساعد العلمي",
  lessons: "الدروس",
  courses: "الدورات العلمية",
  sheikhs: "المشايخ",
  quran: "القرآن الكريم",
  mushaf: "المصحف الشريف",
  fatwa: "الفتاوى",
  qa: "الأسئلة الشرعية",
  library: "المكتبة",
  fawaid: "الفوائد",
  calendar: "التقويم",
  updates: "آخر الإضافات",
  adhkar: "الأذكار",
  rulings: "الأحكام الشرعية",
  fiqhCouncil: "المجمع الفقهي الإسلامي",

  tajweed: "علم التجويد",
  quranRadio: "إذاعات القرآن",
  quranLive: "البث المباشر",
  tasbih: "التسابيح",
  prayerTimes: "مواقيت الصلاة",

  updatesPageTitle: "آخر الإضافات",
  updatesPageSubtitle:
    "أحدث الدروس والفتاوى والقرارات والكتب والإعلانات المضافة للمنصة — مرتّبة زمنياً.",
  updatesEmpty: "لا توجد إضافات حالياً.",
  updatesHomeTitle: "آخر الإضافات",
  updatesHomeLink: "جميع الإضافات",

  qaPageTitle: "الأسئلة الشرعية",
  qaPageSubtitle: "أسئلة علمية منظّمة — بحث وتصنيف وأحدث الأسئلة.",
  qaSearchPlaceholder: "ابحث في الأسئلة الشرعية...",

  assistantDesc: "إرشاد علمي داخل المنصة دون ادعاء الإفتاء",
  searchPlaceholder: "ابحث عن درس، ذكر، سورة، فائدة...",

  adminUpdates: "آخر الإضافات",
  adminQa: "الأسئلة الشرعية",
} as const;

export type Terminology = typeof T;
