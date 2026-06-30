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
      { href: "/lessons", label: "الدروس" },
      { href: "/annual-courses", label: "الدورات العلمية" },
      { href: "/fiqh-council", label: "المجمع الفقهي الإسلامي" },
      { href: "/fatwa", label: "الفتاوى" },
      { href: "/rulings", label: "الأحكام الشرعية" },
      { href: "/updates", label: "آخر المستجدات" },
      { href: "/calendar", label: "التقويم" },
      { href: "/fawaid", label: "الفوائد" },
      { href: "/hadith", label: "الأحاديث الموثقة" },
      { href: "/qa", label: "الأسئلة" },
    ],
  },
  {
    id: "quran",
    title: "القرآن",
    links: [
      { href: "/quran", label: "المصحف الشريف" },
      { href: "/quran/tajweed", label: "علم التجويد" },
      { href: "/quran/surah-stories", label: "قصص القرآن" },
      { href: "/quran-live", label: "البث المباشر" },
      { href: "/quran-radio", label: "إذاعات القرآن" },
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
      { href: "/hadith", label: "الأحاديث الموثقة" },
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
      { href: "/quiz", label: "لعبة سؤال وجواب" },
    ],
  },
];

export const PRIMARY_NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/lessons", label: "الدروس" },
  { href: "/quran", label: "القرآن" },
  { href: "/library", label: "المكتبة" },
  { href: "/adhkar", label: "الأذكار" },
  { href: "/prayer-times", label: "الصلاة" },
];

/** Mobile "المزيد" dropdown — full site navigation */
export const MOBILE_MORE_NAV = [
  { href: "/lessons", label: "الدروس" },
  { href: "/lessons", label: "المشايخ" },
  { href: "/library", label: "المكتبة" },
  { href: "/qa", label: "الأسئلة" },
  { href: "/hadith", label: "الأحاديث" },
  { href: "/quran", label: "القرآن" },
  { href: "/adhkar", label: "الأذكار" },
  { href: "/quran-radio", label: "إذاعة القرآن" },
  { href: "/quran-live", label: "البث المباشر" },
  { href: "/quran/tajweed", label: "التجويد" },
  { href: "/quran/surah-stories", label: "قصص القرآن" },
  { href: "/tasbih", label: "عداد التسبيح" },
  { href: "/prayer-ranks", label: "مراتب الصلاة" },
  { href: "/quiz", label: "لعبة سؤال وجواب" },
  { href: "/settings", label: "الإعدادات" },
  { href: "/submit", label: "أضف محتوى" },
  { href: "/contact", label: "تواصل معنا" },
];

export const HOME_FEATURE_CARDS = [
  {
    href: "/quran",
    title: "القرآن الكريم",
    description: "قراءة وتلاوة وبحث",
    icon: "book-open",
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
    href: "/hadith",
    title: "الأحاديث الموثقة",
    description: "أحاديث نبوية محققة",
    icon: "scroll-text",
  },
  {
    href: "/arbaeen-nawawi",
    title: "الأربعون النووية",
    description: "أحاديث مختصرة",
    icon: "scroll",
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
  { href: "/hadith", title: "الأحاديث الموثقة", description: "أحاديث نبوية محققة من مصادر موثوقة" },
  { href: "/fatwa", title: "الفتاوى", description: "مركز الفتاوى الشرعية" },
  { href: "/prayer-ranks", title: "مراتب الناس في الصلاة", description: "مراتب الخشوع وحضور القلب" },
  { href: "/rulings", title: "الأحكام الشرعية", description: "مكتبة الأحكام والأدلة" },
  { href: "/annual-courses", title: "الدورات العلمية", description: "برامج ودورات سنوية" },
  { href: "/updates", title: "آخر المستجدات", description: "قرارات وفتاوى ودروس جديدة" },
  { href: "/assistant", title: "المساعد العلمي", description: "إرشاد داخل المنصة" },
  { href: "/condolences", title: "قوالب العزاء", description: "تعزية وإعلان وفاة" },
  { href: "/library", title: "المكتبة", description: "كتب ومتون" },
  { href: "/learning/paths", title: "المسارات العلمية", description: "تعلم منظم من المبتدئ للمتقدم" },
  { href: "/my-learning", title: "لوحتي التعليمية", description: "تقدمك وإنجازاتك" },
  { href: "/quiz", title: "المسابقات", description: "اختبر معلوماتك" },
] as const;
