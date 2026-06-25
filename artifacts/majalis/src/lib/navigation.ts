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
      { href: "/calendar", label: "التقويم" },
      { href: "/sheikhs", label: "المشايخ" },
      { href: "/fawaid", label: "الفوائد" },
      { href: "/qa", label: "الأسئلة" },
    ],
  },
  {
    id: "quran",
    title: "القرآن",
    links: [
      { href: "/quran", label: "القرآن الكريم" },
      { href: "/quran-radio", label: "إذاعة القرآن" },
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
      { href: "/qibla", label: "القبلة" },
      { href: "/occasions", label: "المناسبات الإسلامية" },
      { href: "/about", label: "الإعدادات" },
    ],
  },
];

export const PRIMARY_NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/lessons", label: "الدروس" },
  { href: "/quran", label: "القرآن" },
  { href: "/adhkar", label: "الأذكار" },
  { href: "/prayer-times", label: "الصلاة" },
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
  { href: "/lessons", title: "الدروس", description: "دروس ودورات ومحاضرات" },
  { href: "/assistant", title: "المساعد العلمي", description: "إرشاد داخل المنصة" },
  { href: "/condolences", title: "قوالب العزاء", description: "تعزية وإعلان وفاة" },
  { href: "/library", title: "المكتبة", description: "كتب ومتون" },
  { href: "/quiz", title: "المسابقات", description: "اختبر معلوماتك" },
] as const;
