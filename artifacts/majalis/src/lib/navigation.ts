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

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "content",
    title: "المحتوى",
    links: [
      { href: "/", label: "الرئيسية" },
      { href: "/search", label: "البحث" },
      { href: "/scholar-search", label: "الباحث العلمي" },
      { href: "/lessons", label: "الدروس" },
      { href: "/annual-courses", label: "الدورات العلمية" },
      { href: "/quran-scientific-circles", label: "الحلقات القرآنية والعلمية" },
      { href: "/fiqh-council", label: "المجمع الفقهي الإسلامي" },
      { href: "/fatwa", label: "الفتاوى" },
      { href: "/rulings", label: "الأحكام الشرعية" },
      { href: "/updates", label: "آخر المستجدات" },
      { href: "/calendar", label: "التقويم" },
      { href: "/fawaid", label: "الفوائد" },
      { href: "/qa", label: "الأسئلة" },
      { href: "/question-answer", label: "سؤال وجواب" },
      { href: "/research", label: "الأبحاث العلمية" },
    ],
  },
  {
    id: "quran",
    title: "القرآن",
    links: [
      { href: "/quran", label: "القراءة النصية" },
      { href: "/quran/mushaf", label: "المصحف الشريف (طبعة الكويت)" },
      { href: "/quran/search", label: "البحث في القرآن" },
      { href: "/quran/tafsir", label: "التفسير" },
      { href: "/quran-radio", label: "الاستماع" },
      { href: "/quran/tajweed", label: "علم التجويد" },
      { href: "/quran-scientific-circles", label: "الحلقات القرآنية والعلمية" },
      { href: "/quran/surah-stories", label: "قصص القرآن" },
      { href: "/daily-wird", label: "الورد اليومي" },
    ],
  },
  {
    id: "adhkar",
    title: "الأذكار",
    links: [
      { href: "/adhkar?cat=morning", label: "أذكار الصباح" },
      { href: "/adhkar?cat=evening", label: "أذكار المساء" },
      { href: "/adhkar?cat=distress", label: "الدعاء" },
      { href: "/tasbih", label: "التسابيح" },
    ],
  },
  {
    id: "sunnah",
    title: "السنة",
    links: [
      { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
      { href: "/adhkar", label: "سنن مؤقتة" },
      { href: "/adhkar?cat=misc", label: "سنن غير مؤقتة" },
      { href: "/quran", label: "فضائل القرآن" },
      { href: "/occasions", label: "اليوم النبوي" },
      { href: "/daily-wird", label: "متابعة النوافل" },
    ],
  },
  {
    id: "tools",
    title: "الأدوات",
    links: [
      { href: "/prayer-times", label: "مواقيت الصلاة" },
      { href: "/prayer-ranks", label: "مراتب الناس في الصلاة" },
      { href: "/qibla", label: "القبلة" },
      { href: "/occasions", label: "المناسبات الإسلامية" },
      { href: "/settings", label: "الإعدادات" },
    ],
  },
];

export const PRIMARY_NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/lessons", label: "الدروس" },
  { href: "/quran", label: "القرآن" },
  { href: "/quran-scientific-circles", label: "الحلقات" },
  { href: "/question-answer", label: "سؤال وجواب" },
  { href: "/library", label: "المكتبة" },
  { href: "/research", label: "الأبحاث العلمية" },
  { href: "/annual-courses", label: "الدورات" },
  { href: "/about", label: "عن المنصة" },
];

/** Mobile drawer — primary site navigation (replaces legacy MOBILE_MORE_NAV) */
export const MOBILE_DRAWER_GROUPS: NavGroup[] = [
  {
    id: "home",
    title: "التصفح",
    links: [{ href: "/", label: "الرئيسية" }],
  },
  {
    id: "content",
    title: "المحتوى",
    links: [
      { href: "/quran", label: "القرآن" },
      { href: "/quran/mushaf", label: "المصحف" },
      { href: "/quran/tafsir", label: "التفسير" },
      { href: "/lessons", label: "الدروس" },
      { href: "/sheikhs", label: "المشايخ" },
      { href: "/library", label: "المكتبة" },
      { href: "/library", label: "الكتب" },
      { href: "/updates", label: "المقالات" },
      { href: "/research", label: "الأبحاث" },
      { href: "/fatwa", label: "الفتاوى" },
      { href: "/question-answer", label: "سؤال وجواب" },
      { href: "/qa", label: "الأسئلة الشرعية" },
      { href: "/scholar-search", label: "الباحث العلمي" },
      { href: "/quran/tajweed", label: "علم التجويد" },
      { href: "/quran/surah-stories", label: "قصص القرآن" },
      { href: "/fiqh-council", label: "المجمع الفقهي" },
      { href: "/rulings", label: "الأحكام الشرعية" },
      { href: "/fawaid", label: "الفوائد" },
      { href: "/quran/search", label: "البحث في القرآن" },
    ],
  },
  {
    id: "learning",
    title: "التعلم",
    links: [
      { href: "/quran-scientific-circles", label: "الحلقات" },
      { href: "/annual-courses", label: "الدورات" },
      { href: "/learning/paths", label: "المسارات" },
      { href: "/quiz", label: "الاختبارات" },
      { href: "/learning/quiz", label: "اختبارات المسارات" },
    ],
  },
  {
    id: "services",
    title: "الخدمات",
    links: [
      { href: "/calendar", label: "التقويم" },
      { href: "/quran-radio", label: "إذاعة المجلس العلمي" },
      { href: "/quran-live", label: "البث المباشر" },
      { href: "/my-updates", label: "الإشعارات" },
      { href: "/contact", label: "التواصل" },
      { href: "/contribute", label: "الاقتراحات" },
      { href: "/adhkar", label: "الأذكار" },
      { href: "/prayer-times", label: "مواقيت الصلاة" },
      { href: "/prayer-ranks", label: "مراتب الصلاة" },
      { href: "/qibla", label: "القبلة" },
      { href: "/occasions", label: "المناسبات" },
      { href: "/daily-wird", label: "الورد اليومي" },
      { href: "/tasbih", label: "عداد التسبيح" },
      { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
    ],
  },
  {
    id: "platform",
    title: "المنصة",
    links: [
      { href: "/about", label: "عن المنصة" },
      { href: "/privacy", label: "سياسة الخصوصية" },
      { href: "/terms", label: "الشروط" },
      { href: "/contact", label: "تواصل معنا" },
    ],
  },
];

export type AccountMenuLink = NavLink & { adminOnly?: boolean };

/** Mobile account menu — personal actions (logged-in users) */
export const ACCOUNT_MENU_LINKS: AccountMenuLink[] = [
  { href: "/my-profile", label: "الملف الشخصي" },
  { href: "/my-library", label: "مكتبتي" },
  { href: "/sheikhs", label: "متابعة المشايخ" },
  { href: "/my-library", label: "المفضلة" },
  { href: "/my-updates", label: "الإشعارات" },
  { href: "/my-learning", label: "تقدمي" },
  { href: "/settings", label: "إعداداتي" },
  { href: "/admin", label: "لوحة التحكم", adminOnly: true },
];

/** @deprecated Replaced by MOBILE_DRAWER_GROUPS + ACCOUNT_MENU_LINKS */
export const MOBILE_MORE_NAV = MOBILE_DRAWER_GROUPS.flatMap((g) => g.links);

export const HOME_FEATURE_CARDS = [
  {
    href: "/quran",
    title: "القرآن الكريم",
    description: "قراءة وتلاوة وبحث",
    icon: "book-open",
  },
  {
    href: "/quran-scientific-circles",
    title: "الحلقات القرآنية",
    description: "حفظ ومتون ودراسة شرعية",
    icon: "graduation-cap",
  },
  {
    href: "/adhkar",
    title: "الأذكار",
    description: "أذكار يومية موثقة",
    icon: "sparkles",
  },
  {
    href: "/adhkar?cat=distress",
    title: "الدعاء",
    description: "أدعية من السنة",
    icon: "hands",
  },
  {
    href: "/prayer-times",
    title: "مواقيت الصلاة",
    description: "مواقيت دقيقة للكويت",
    icon: "clock",
  },
  {
    href: "/tasbih",
    title: "التسابيح",
    description: "مسبحة إلكترونية",
    icon: "circle-dot",
  },
  {
    href: "/quran-radio",
    title: "إذاعة القرآن",
    description: "بث مباشر للقرآن",
    icon: "radio",
  },
  {
    href: "/arbaeen-nawawi",
    title: "الأربعون النووية",
    description: "أحاديث مختصرة",
    icon: "scroll",
  },
  {
    href: "/question-answer",
    title: "سؤال وجواب",
    description: "لعبة المعلومات الإسلامية التفاعلية",
    icon: "gamepad",
  },
  {
    href: "/research",
    title: "الأبحاث العلمية",
    description: "رسائل جامعية وأبحاث محكمة",
    icon: "graduation-cap",
  },
  {
    href: "/qibla",
    title: "القبلة",
    description: "اتجاه الكعبة",
    icon: "compass",
  },
] as const;

export const HOME_MORE_SECTIONS = [
  { href: "/lessons", title: "الدروس", description: "دروس ودورات علمية" },
  { href: "/fatwa", title: "الفتاوى", description: "مركز الفتاوى الشرعية" },
  { href: "/prayer-ranks", title: "مراتب الناس في الصلاة", description: "مراتب الخشوع وحضور القلب" },
  { href: "/rulings", title: "الأحكام الشرعية", description: "مكتبة الأحكام والأدلة" },
  { href: "/annual-courses", title: "الدورات العلمية", description: "برامج ودورات سنوية" },
  { href: "/quran-scientific-circles", title: "الحلقات القرآنية والعلمية", description: "حفظ القرآن والمتون وفرص طلب العلم" },
  { href: "/updates", title: "آخر المستجدات", description: "قرارات وفتاوى ودروس جديدة" },
  { href: "/assistant", title: "المساعد العلمي", description: "إرشاد داخل المنصة" },
  { href: "/condolences", title: "قوالب العزاء", description: "تعزية وإعلان وفاة" },
  { href: "/library", title: "المكتبة", description: "كتب ومتون" },
  { href: "/research", title: "الأبحاث العلمية", description: "رسائل جامعية وأبحاث محكمة" },
  { href: "/learning/paths", title: "المسارات العلمية", description: "تعلم منظم من المبتدئ للمتقدم" },
  { href: "/my-dashboard", title: "لوحة المستخدم", description: "مساحتي العلمية الشخصية" },
  { href: "/my-profile", title: "ملفي العلمي", description: "إحصاءات وإنجازات" },
  { href: "/my-library", title: "مكتبتي العلمية", description: "احفظ ونظّم محتواك" },
  { href: "/my-learning-plan", title: "خطة طلب العلم", description: "خطة شخصية ذكية" },
  { href: "/my-updates", title: "آخر تحديثاتي", description: "دروس المشايخ المتابَعين" },
  { href: "/my-learning", title: "لوحتي التعليمية", description: "المسارات والشهادات" },
  { href: "/quiz", title: "المسابقات", description: "اختبر معلوماتك" },
  { href: "/topics", title: "الموضوعات العلمية", description: "فهرس الموضوعات الشرعية" },
  { href: "/scholar-search", title: "الباحث العلمي", description: "بحث موحّد في كل المحتوى" },
  { href: "/question-answer", title: "سؤال وجواب", description: "لعبة المعلومات الإسلامية" },
] as const;
