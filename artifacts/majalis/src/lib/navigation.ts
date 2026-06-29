export type NavLink = {
  href: string;
  label: string;
  description?: string;
  icon?: string;
};

export type NavGroup = {
  id: string;
  title: string;
  links: NavLink[];
};

/** Side drawer — logical groups, no duplicate hrefs within a group */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "discover",
    title: "استكشف",
    links: [
      { href: "/", label: "الرئيسية", icon: "bookOpen" },
      { href: "/search", label: "البحث", icon: "search" },
      { href: "/scholar-search", label: "الباحث العلمي", icon: "search" },
      { href: "/about", label: "عن المنصة", icon: "book" },
      { href: "/contact", label: "تواصل", icon: "hand" },
    ],
  },
  {
    id: "content",
    title: "المحتوى العلمي",
    links: [
      { href: "/lessons", label: "الدروس", icon: "graduationCap" },
      { href: "/sheikhs", label: "المشايخ", icon: "users" },
      { href: "/annual-courses", label: "الدورات العلمية", icon: "graduationCap" },
      { href: "/library", label: "المكتبة", icon: "library" },
      { href: "/research", label: "الأبحاث العلمية", icon: "book" },
      { href: "/quran-scientific-circles", label: "الحلقات القرآنية والعلمية", icon: "graduationCap" },
      { href: "/fiqh-council", label: "المجمع الفقهي", icon: "scroll" },
      { href: "/fatwa", label: "الفتاوى", icon: "scroll" },
      { href: "/rulings", label: "الأحكام الشرعية", icon: "book" },
      { href: "/fawaid", label: "الفوائد", icon: "sparkles" },
      { href: "/qa", label: "الأسئلة الشرعية", icon: "bookOpen" },
      { href: "/question-answer", label: "سؤال وجواب", icon: "gamepad" },
      { href: "/updates", label: "آخر المستجدات", icon: "calendar" },
      { href: "/calendar", label: "التقويم العلمي", icon: "calendar" },
    ],
  },
  {
    id: "quran",
    title: "القرآن والعبادة",
    links: [
      { href: "/quran", label: "القراءة النصية", icon: "bookOpen" },
      { href: "/quran/mushaf", label: "المصحف الشريف", icon: "book" },
      { href: "/quran/search", label: "البحث في القرآن", icon: "search" },
      { href: "/quran/tafsir", label: "التفسير", icon: "scroll" },
      { href: "/quran-radio", label: "إذاعة القرآن", icon: "radio" },
      { href: "/quran-live", label: "البث المباشر", icon: "headphones" },
      { href: "/quran/tajweed", label: "علم التجويد", icon: "mic" },
      { href: "/quran/surah-stories", label: "قصص القرآن", icon: "bookOpen" },
      { href: "/adhkar", label: "الأذكار", icon: "sparkles" },
      { href: "/daily-wird", label: "الورد اليومي", icon: "sun" },
      { href: "/tasbih", label: "التسابيح", icon: "circleDot" },
    ],
  },
  {
    id: "worship",
    title: "العبادات والأدوات",
    links: [
      { href: "/prayer-times", label: "مواقيت الصلاة", icon: "clock" },
      { href: "/prayer-ranks", label: "مراتب الصلاة", icon: "star" },
      { href: "/qibla", label: "القبلة", icon: "compass" },
      { href: "/occasions", label: "المناسبات الإسلامية", icon: "calendar" },
      { href: "/arbaeen-nawawi", label: "الأربعون النووية", icon: "scroll" },
      { href: "/assistant", label: "المساعد العلمي", icon: "sparkles" },
      { href: "/learning/paths", label: "مسارات التعلم", icon: "graduationCap" },
      { href: "/settings", label: "الإعدادات", icon: "compass" },
    ],
  },
];

/** Top navbar — 8 items max for clarity */
export const PRIMARY_NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/lessons", label: "الدروس" },
  { href: "/quran", label: "القرآن" },
  { href: "/research", label: "الأبحاث" },
  { href: "/quran-scientific-circles", label: "الحلقات" },
  { href: "/question-answer", label: "سؤال وجواب" },
  { href: "/library", label: "المكتبة" },
  { href: "/contact", label: "تواصل" },
] as const;

/** Mobile "المزيد" — supplementary links not in primary nav */
export const MOBILE_MORE_NAV = [
  { href: "/about", label: "عن المنصة" },
  { href: "/sheikhs", label: "المشايخ" },
  { href: "/annual-courses", label: "الدورات" },
  { href: "/quran/mushaf", label: "المصحف الشريف" },
  { href: "/quran-radio", label: "إذاعة القرآن" },
  { href: "/quran-live", label: "البث المباشر" },
  { href: "/adhkar", label: "الأذكار" },
  { href: "/prayer-times", label: "مواقيت الصلاة" },
  { href: "/calendar", label: "التقويم" },
  { href: "/scholar-search", label: "الباحث العلمي" },
  { href: "/fawaid", label: "الفوائد" },
  { href: "/qa", label: "الأسئلة" },
  { href: "/fatwa", label: "الفتاوى" },
  { href: "/fiqh-council", label: "المجمع الفقهي" },
  { href: "/learning/paths", label: "مسارات التعلم" },
  { href: "/tasbih", label: "التسبيح" },
  { href: "/qibla", label: "القبلة" },
  { href: "/settings", label: "الإعدادات" },
  { href: "/contact", label: "صفحة التواصل" },
] as const;

export const HOME_FEATURE_CARDS = [
  { href: "/quran/mushaf", title: "المصحف الشريف", description: "604 صفحة — طبعة الكويت", icon: "book" },
  { href: "/quran", title: "القرآن الكريم", description: "قراءة وتلاوة وبحث", icon: "book-open" },
  { href: "/lessons", title: "الدروس", description: "دروس علمية حية ومسجّلة", icon: "graduation-cap" },
  { href: "/research", title: "الأبحاث العلمية", description: "رسائل وأبحاث محكمة", icon: "graduation-cap" },
  { href: "/quran-scientific-circles", title: "الحلقات", description: "حفظ ومتون ودراسة", icon: "graduation-cap" },
  { href: "/sheikhs", title: "المشايخ", description: "علماء المنصة", icon: "users" },
  { href: "/library", title: "المكتبة", description: "كتب ومتون", icon: "library" },
  { href: "/question-answer", title: "سؤال وجواب", description: "لعبة معلومات إسلامية", icon: "gamepad" },
  { href: "/quran-radio", title: "إذاعة القرآن", description: "بث مباشر للقرّاء", icon: "radio" },
  { href: "/adhkar", title: "الأذكار", description: "أذكار يومية موثقة", icon: "sparkles" },
  { href: "/prayer-times", title: "مواقيت الصلاة", description: "مواقيت دقيقة", icon: "clock" },
  { href: "/scholar-search", title: "الباحث العلمي", description: "بحث موحّد", icon: "search" },
] as const;

export const HOME_MORE_SECTIONS = [
  { href: "/annual-courses", title: "الدورات العلمية", description: "برامج ودورات سنوية" },
  { href: "/fatwa", title: "الفتاوى", description: "مركز الفتاوى الشرعية" },
  { href: "/rulings", title: "الأحكام الشرعية", description: "مكتبة الأحكام والأدلة" },
  { href: "/updates", title: "آخر المستجدات", description: "قرارات وفتاوى جديدة" },
  { href: "/calendar", title: "التقويم العلمي", description: "مواعيد ومناسبات" },
  { href: "/assistant", title: "المساعد العلمي", description: "إرشاد داخل المنصة" },
  { href: "/quran-live", title: "البث المباشر", description: "من الحرمين" },
  { href: "/quran/tajweed", title: "علم التجويد", description: "دروس التجويد" },
  { href: "/learning/paths", title: "مسارات التعلم", description: "من المبتدئ للمتقدم" },
  { href: "/my-learning", title: "لوحتي التعليمية", description: "تقدمك وإنجازاتك" },
  { href: "/quiz", title: "المسابقات", description: "اختبر معلوماتك" },
  { href: "/topics", title: "الموضوعات العلمية", description: "فهرس الموضوعات" },
  { href: "/condolences", title: "قوالب العزاء", description: "تعزية وإعلان وفاة" },
  { href: "/contact", title: "تواصل", description: "تواصل مع إدارة المنصة" },
] as const;
