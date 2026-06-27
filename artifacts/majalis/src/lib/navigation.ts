import { T } from "@/lib/terminology";

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
      { href: "/", label: T.home },
      { href: "/search", label: T.search },
      { href: "/lessons", label: T.lessons },
      { href: "/annual-courses", label: T.courses },
      { href: "/fiqh-council", label: T.fiqhCouncil },
      { href: "/fatwa", label: T.fatwa },
      { href: "/rulings", label: T.rulings },
      { href: "/updates", label: T.updates },
      { href: "/calendar", label: T.calendar },
      { href: "/fawaid", label: T.fawaid },
      { href: "/qa", label: T.qa },
    ],
  },
  {
    id: "quran",
    title: "القرآن",
    links: [
      { href: "/quran", label: T.mushaf },
      { href: "/quran/tajweed", label: T.tajweed },
      { href: "/quran/surah-stories", label: "قصص السور" },
      { href: "/quran-live", label: T.quranLive },
      { href: "/quran-radio", label: T.quranRadio },
      { href: "/daily-wird", label: "الورد اليومي" },
    ],
  },
  {
    id: "adhkar",
    title: T.adhkar,
    links: [
      { href: "/adhkar?cat=morning", label: "أذكار الصباح" },
      { href: "/adhkar?cat=evening", label: "أذكار المساء" },
      { href: "/adhkar?cat=distress", label: "الدعاء" },
      { href: "/tasbih", label: T.tasbih },
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
      { href: "/prayer-times", label: T.prayerTimes },
      { href: "/prayer-ranks", label: "مراتب الناس في الصلاة" },
      { href: "/qibla", label: "القبلة" },
      { href: "/occasions", label: "المناسبات الإسلامية" },
      { href: "/settings", label: "الإعدادات" },
    ],
  },
];

export const PRIMARY_NAV = [
  { href: "/", label: T.home },
  { href: "/lessons", label: T.lessons },
  { href: "/quran", label: "القرآن" },
  { href: "/library", label: T.library },
  { href: "/adhkar", label: T.adhkar },
  { href: "/prayer-times", label: "الصلاة" },
];

/** Mobile "المزيد" dropdown — full site navigation */
export const MOBILE_MORE_NAV = [
  { href: "/sheikhs", label: T.sheikhs },
  { href: "/fatwa", label: T.fatwa },
  { href: "/qa", label: T.qa },
  { href: "/library", label: T.library },
  { href: "/fawaid", label: T.fawaid },
  { href: "/calendar", label: T.calendar },
  { href: "/updates", label: T.updates },
  { href: "/assistant", label: T.assistant },
  { href: "/quran-radio", label: T.quranRadio },
  { href: "/quran-live", label: T.quranLive },
  { href: "/quran/tajweed", label: T.tajweed },
  { href: "/quran/surah-stories", label: "قصص السور" },
  { href: "/tasbih", label: T.tasbih },
  { href: "/prayer-ranks", label: "مراتب الصلاة" },
  { href: "/settings", label: "الإعدادات" },
  { href: "/contact", label: "تواصل معنا" },
];

export const HOME_FEATURE_CARDS = [
  {
    href: "/quran",
    title: T.quran,
    description: "قراءة وتلاوة وبحث",
    icon: "book-open",
  },
  {
    href: "/adhkar",
    title: T.adhkar,
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
    title: T.prayerTimes,
    description: "مواقيت دقيقة للكويت",
    icon: "clock",
  },
  {
    href: "/tasbih",
    title: T.tasbih,
    description: "مسبحة إلكترونية",
    icon: "circle-dot",
  },
  {
    href: "/quran-radio",
    title: T.quranRadio,
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
  { href: "/adhkar", title: T.adhkar, description: "أذكار يومية موثقة" },
  { href: "/prayer-times", title: T.prayerTimes, description: "مواقيت وعدّاد الصلاة" },
  { href: "/arbaeen-nawawi", title: "الأربعون النووية", description: "أحاديث جامعة منظمة" },
  { href: "/rulings", title: T.rulings, description: "مكتبة الأحكام والأدلة" },
  { href: "/fiqh-council", title: T.fiqhCouncil, description: "قرارات وفتاوى جماعية" },
  { href: "/condolences", title: "قوالب العزاء", description: "تعزية وإعلان وفاة" },
  { href: "/learning/paths", title: "المسارات العلمية", description: "تعلم منظم من المبتدئ للمتقدم" },
  { href: "/my-learning", title: "لوحتي التعليمية", description: "تقدمك وإنجازاتك" },
  { href: "/quiz", title: "المسابقات", description: "اختبر معلوماتك" },
  { href: "/occasions", title: "المناسبات الإسلامية", description: "تقويم المواسم والأيام" },
  { href: "/miracles", title: "الإعجاز العلمي", description: "مقالات علمية موثقة" },
  { href: "/cards", title: "البطاقات الدعوية", description: "صمّم وشارك فوائد" },
] as const;
