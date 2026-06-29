export type NavLink = {
  href: string;
  label: string;
  description?: string;
};

export type NavGroup = {
  id: string;
  title: string;
  links: NavLink[];
};

/**
 * Phase 1B — Information Architecture
 * Five clear groups; no duplicate hrefs within groups; legacy routes unchanged.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "quran",
    title: "القرآن الكريم",
    links: [
      { href: "/quran/mushaf", label: "المصحف", description: "طبعة الكويت الرسمية" },
      { href: "/quran", label: "القراءة النصية", description: "تصفّح السور والآيات" },
      { href: "/quran/tafsir", label: "التفسير", description: "تفسير مختصر" },
      { href: "/quran-radio", label: "الإذاعة", description: "بث قرآني مباشر" },
      { href: "/quran-live", label: "البث المباشر", description: "قنوات قرآنية" },
      { href: "/quran/tajweed", label: "التجويد", description: "أحكام التلاوة" },
      { href: "/quran/search", label: "البحث في القرآن" },
      { href: "/quran/surah-stories", label: "قصص القرآن" },
      { href: "/daily-wird", label: "الورد اليومي" },
    ],
  },
  {
    id: "sharia",
    title: "العلوم الشرعية",
    links: [
      { href: "/lessons", label: "الدروس", description: "دروس علمية حية ومسجّلة" },
      { href: "/quran-scientific-circles", label: "المتون والحلقات", description: "حفظ ومتون ودراسة" },
      { href: "/research", label: "الأبحاث العلمية", description: "رسائل وأبحاث محكّمة" },
      { href: "/sheikhs", label: "العلماء والمشايخ" },
      { href: "/library", label: "المكتبة", description: "كتب ومراجع" },
      { href: "/question-answer", label: "سؤال وجواب", description: "لعبة المعلومات الإسلامية" },
      { href: "/qa", label: "فتاوى وأسئلة", description: "أرشيف الأسئلة الشرعية" },
      { href: "/fatwa", label: "الفتاوى" },
      { href: "/rulings", label: "الأحكام الشرعية" },
      { href: "/fiqh-council", label: "المجمع الفقهي" },
      { href: "/fawaid", label: "الفوائد العلمية" },
      { href: "/miracles", label: "الإعجاز العلمي" },
    ],
  },
  {
    id: "learning",
    title: "التعلّم",
    links: [
      { href: "/learning/paths", label: "المسارات العلمية", description: "من المبتدئ إلى المتقدّم" },
      { href: "/annual-courses", label: "الدورات العلمية" },
      { href: "/quran-scientific-circles", label: "الحلقات القرآنية", description: "حفظ ودراسة" },
      { href: "/calendar", label: "التقويم العلمي" },
      { href: "/topics", label: "الموضوعات العلمية" },
      { href: "/my-learning", label: "لوحتي التعليمية" },
      { href: "/quiz", label: "المسابقات" },
    ],
  },
  {
    id: "worship",
    title: "العبادة اليومية",
    links: [
      { href: "/adhkar?cat=morning", label: "أذكار الصباح" },
      { href: "/adhkar?cat=evening", label: "أذكار المساء" },
      { href: "/adhkar?cat=distress", label: "الدعاء" },
      { href: "/adhkar", label: "جميع الأذكار" },
      { href: "/tasbih", label: "التسابيح" },
      { href: "/prayer-times", label: "مواقيت الصلاة" },
      { href: "/prayer-ranks", label: "مراتب الصلاة" },
      { href: "/qibla", label: "القبلة" },
      { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
      { href: "/occasions", label: "المناسبات الإسلامية" },
    ],
  },
  {
    id: "services",
    title: "الخدمات",
    links: [
      { href: "/scholar-search", label: "الباحث العلمي", description: "بحث موحّد في المحتوى" },
      { href: "/assistant", label: "المساعد العلمي" },
      { href: "/search", label: "البحث العام" },
      { href: "/updates", label: "آخر المستجدات" },
      { href: "/contribute", label: "شارك محتوى", description: "مساهمة علمية" },
      { href: "/about", label: "عن المنصة" },
      { href: "/contact", label: "تواصل معنا" },
      { href: "/settings", label: "الإعدادات" },
    ],
  },
];

/** Top navigation — concise, mobile-friendly */
export const PRIMARY_NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/lessons", label: "الدروس" },
  { href: "/quran", label: "القرآن" },
  { href: "/quran-scientific-circles", label: "الحلقات" },
  { href: "/research", label: "الأبحاث" },
  { href: "/question-answer", label: "سؤال وجواب" },
  { href: "/library", label: "المكتبة" },
  { href: "/about", label: "عن المنصة" },
];

/** Mobile overflow menu */
export const MOBILE_MORE_NAV = [
  { href: "/sheikhs", label: "المشايخ" },
  { href: "/annual-courses", label: "الدورات العلمية" },
  { href: "/learning/paths", label: "المسارات العلمية" },
  { href: "/qa", label: "فتاوى وأسئلة" },
  { href: "/fatwa", label: "الفتاوى" },
  { href: "/fawaid", label: "الفوائد" },
  { href: "/adhkar", label: "الأذكار" },
  { href: "/prayer-times", label: "مواقيت الصلاة" },
  { href: "/calendar", label: "التقويم" },
  { href: "/quran-radio", label: "إذاعة القرآن" },
  { href: "/quran-live", label: "البث المباشر" },
  { href: "/quran/tajweed", label: "التجويد" },
  { href: "/scholar-search", label: "الباحث العلمي" },
  { href: "/assistant", label: "المساعد العلمي" },
  { href: "/contribute", label: "شارك محتوى" },
  { href: "/contact", label: "تواصل معنا" },
  { href: "/settings", label: "الإعدادات" },
];

/** Homepage quick-access cards (Lucide icon keys) */
export const HOME_FEATURE_CARDS = [
  { href: "/lessons", title: "الدروس", description: "دروس ومحاضرات علمية", icon: "graduation-cap" },
  { href: "/quran/mushaf", title: "المصحف", description: "قراءة وتصفّح", icon: "book-open" },
  { href: "/quran-scientific-circles", title: "الحلقات", description: "حفظ ومتون ودراسة", icon: "users" },
  { href: "/research", title: "الأبحاث", description: "رسائل وأبحاث محكّمة", icon: "file-text" },
  { href: "/question-answer", title: "سؤال وجواب", description: "لعبة المعلومات الإسلامية", icon: "gamepad-2" },
  { href: "/scholar-search", title: "الباحث العلمي", description: "بحث في كل المحتوى", icon: "search" },
  { href: "/adhkar", title: "الأذكار", description: "أذكار يومية موثّقة", icon: "sparkles" },
  { href: "/prayer-times", title: "مواقيت الصلاة", description: "مواقيت دقيقة", icon: "clock" },
  { href: "/quran-radio", title: "إذاعة القرآن", description: "بث مباشر", icon: "radio" },
  { href: "/library", title: "المكتبة", description: "كتب ومراجع", icon: "library" },
  { href: "/annual-courses", title: "الدورات", description: "برامج علمية", icon: "book-marked" },
  { href: "/assistant", title: "المساعد", description: "إرشاد علمي", icon: "bot" },
] as const;

/** Secondary homepage links — deduplicated */
export const HOME_MORE_SECTIONS = [
  { href: "/fatwa", title: "الفتاوى", description: "مركز الفتاوى الشرعية" },
  { href: "/rulings", title: "الأحكام الشرعية", description: "مكتبة الأحكام والأدلة" },
  { href: "/fiqh-council", title: "المجمع الفقهي", description: "قرارات وتوصيات" },
  { href: "/updates", title: "آخر المستجدات", description: "محتوى موثّق من المصادر" },
  { href: "/miracles", title: "الإعجاز العلمي", description: "آيات ومعجزات" },
  { href: "/topics", title: "الموضوعات العلمية", description: "فهرس الموضوعات" },
  { href: "/contribute", title: "شارك محتوى", description: "مساهمة علمية للمراجعة" },
  { href: "/condolences", title: "قوالب العزاء", description: "تعزية وإعلان" },
] as const;

/** Footer column groups — aligned with IA */
export const FOOTER_IA_GROUPS = [
  {
    title: "القرآن الكريم",
    links: [
      { href: "/quran/mushaf", label: "المصحف" },
      { href: "/quran/tafsir", label: "التفسير" },
      { href: "/quran-radio", label: "الإذاعة" },
      { href: "/quran/tajweed", label: "التجويد" },
    ],
  },
  {
    title: "العلوم الشرعية",
    links: [
      { href: "/lessons", label: "الدروس" },
      { href: "/research", label: "الأبحاث" },
      { href: "/sheikhs", label: "المشايخ" },
      { href: "/library", label: "المكتبة" },
      { href: "/question-answer", label: "سؤال وجواب" },
    ],
  },
  {
    title: "العبادة",
    links: [
      { href: "/adhkar", label: "الأذكار" },
      { href: "/prayer-times", label: "مواقيت الصلاة" },
      { href: "/tasbih", label: "التسابيح" },
      { href: "/calendar", label: "التقويم" },
    ],
  },
  {
    title: "المنصة",
    links: [
      { href: "/about", label: "عن المنصة" },
      { href: "/scholar-search", label: "الباحث العلمي" },
      { href: "/contact", label: "تواصل معنا" },
      { href: "/privacy", label: "الخصوصية" },
      { href: "/terms", label: "الشروط" },
    ],
  },
] as const;
