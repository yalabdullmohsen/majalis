/**
 * Single source of truth for site navigation.
 * Top bar, side drawer, and mobile "المزيد" all derive from UNIFIED_NAV_GROUPS.
 */

export type NavLink = {
  href: string;
  label: string;
  description?: string;
  /** Lucide icon key — resolved in SideNavDrawer / MobileMoreMenu */
  icon?: string;
  adminOnly?: boolean;
};

export type NavGroup = {
  id: string;
  title: string;
  links: NavLink[];
};

/** Full site navigation — grouped */
export const UNIFIED_NAV_GROUPS: NavGroup[] = [
  {
    id: "main",
    title: "الرئيسية",
    links: [
      { href: "/", label: "الرئيسية", icon: "home" },
      { href: "/search", label: "البحث", icon: "search" },
    ],
  },
  {
    id: "content",
    title: "المحتوى",
    links: [
      { href: "/lessons", label: "الدروس", icon: "lessons" },
      { href: "/library", label: "المكتبة", icon: "library" },
      { href: "/annual-courses", label: "الدورات العلمية", icon: "courses" },
      { href: "/fiqh-council", label: "المجمع الفقهي", icon: "fiqh" },
      { href: "/fatwa", label: "الفتاوى", icon: "fatwa" },
      { href: "/rulings", label: "الأحكام الشرعية", icon: "rulings" },
      { href: "/fawaid", label: "الفوائد", icon: "fawaid" },
      { href: "/qa", label: "الأسئلة", icon: "qa" },
      { href: "/updates", label: "آخر المستجدات", icon: "updates" },
      { href: "/calendar", label: "التقويم", icon: "calendar" },
    ],
  },
  {
    id: "quran",
    title: "القرآن",
    links: [
      { href: "/quran/mushaf", label: "المصحف الشريف", icon: "mushaf" },
      { href: "/quran", label: "التلاوات الصوتية", icon: "quran" },
      { href: "/quran/tajweed", label: "علم التجويد", icon: "tajweed" },
      { href: "/quran/surah-stories", label: "قصص القرآن", icon: "stories" },
      { href: "/quran-live", label: "البث المباشر", icon: "live" },
      { href: "/quran-radio", label: "إذاعات القرآن", icon: "radio" },
      { href: "/daily-wird", label: "الورد اليومي", icon: "wird" },
    ],
  },
  {
    id: "adhkar",
    title: "الأذكار",
    links: [
      { href: "/adhkar", label: "الأذكار", icon: "adhkar" },
      { href: "/adhkar?cat=morning", label: "أذكار الصباح", icon: "adhkar" },
      { href: "/adhkar?cat=evening", label: "أذكار المساء", icon: "adhkar" },
      { href: "/adhkar?cat=distress", label: "الدعاء", icon: "adhkar" },
      { href: "/tasbih", label: "عداد التسبيح", icon: "tasbih" },
    ],
  },
  {
    id: "sunnah",
    title: "السنة",
    links: [
      { href: "/arbaeen-nawawi", label: "الأربعون النووية", icon: "arbaeen" },
      { href: "/occasions", label: "المناسبات الإسلامية", icon: "occasions" },
    ],
  },
  {
    id: "tools",
    title: "الأدوات",
    links: [
      { href: "/prayer-times", label: "مواقيت الصلاة", icon: "prayer" },
      { href: "/prayer-ranks", label: "مراتب الصلاة", icon: "ranks" },
      { href: "/qibla", label: "القبلة", icon: "qibla" },
      { href: "/settings", label: "الإعدادات", icon: "settings" },
      { href: "/contact", label: "تواصل معنا", icon: "contact" },
    ],
  },
];

/** Desktop top tabs — every item MUST exist in UNIFIED_NAV_GROUPS */
export const PRIMARY_NAV: NavLink[] = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/lessons", label: "الدروس", icon: "lessons" },
  { href: "/quran/mushaf", label: "القرآن", icon: "mushaf" },
  { href: "/library", label: "المكتبة", icon: "library" },
  { href: "/adhkar", label: "الأذكار", icon: "adhkar" },
  { href: "/prayer-times", label: "الصلاة", icon: "prayer" },
];

/** @deprecated Use UNIFIED_NAV_GROUPS */
export const NAV_GROUPS = UNIFIED_NAV_GROUPS;

export function getFlatNavLinks(): NavLink[] {
  const seen = new Set<string>();
  const out: NavLink[] = [];
  for (const group of UNIFIED_NAV_GROUPS) {
    for (const link of group.links) {
      const key = link.href.split("?")[0];
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(link);
    }
  }
  return out;
}

/** Mobile "المزيد" — all links not in PRIMARY_NAV, from same source */
export function getMobileMoreNav(isAdmin: boolean): NavLink[] {
  const primaryPaths = new Set(PRIMARY_NAV.map((l) => l.href.split("?")[0]));
  return getFlatNavLinks().filter((link) => {
    const path = link.href.split("?")[0];
    if (primaryPaths.has(path)) return false;
    if (link.adminOnly && !isAdmin) return false;
    return true;
  });
}

/** Side drawer uses the same groups as the unified source */
export function getSideNavGroups(isAdmin: boolean): NavGroup[] {
  return UNIFIED_NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((l) => !l.adminOnly || isAdmin),
  }));
}

export const HOME_FEATURE_CARDS = [
  { href: "/quran/mushaf", title: "المصحف الشريف", description: "مصحف ورقي — طبعة الكويت", icon: "book-open" },
  { href: "/quran", title: "التلاوات الصوتية", description: "قراءة وتلاوة وبحث", icon: "book-open" },
  { href: "/adhkar", title: "الأذكار", description: "أذكار يومية موثقة", icon: "sparkles" },
  { href: "/adhkar?cat=distress", title: "الدعاء", description: "أدعية من السنة", icon: "hands" },
  { href: "/prayer-times", title: "مواقيت الصلاة", description: "مواقيت دقيقة للكويت", icon: "clock" },
  { href: "/tasbih", title: "التسابيح", description: "مسبحة إلكترونية", icon: "circle-dot" },
  { href: "/quran-radio", title: "إذاعة القرآن", description: "بث مباشر للقرآن", icon: "radio" },
  { href: "/arbaeen-nawawi", title: "الأربعون النووية", description: "أحاديث مختصرة", icon: "scroll" },
  { href: "/qibla", title: "القبلة", description: "اتجاه الكعبة", icon: "compass" },
] as const;

export const HOME_MORE_SECTIONS = [
  { href: "/lessons", title: "الدروس", description: "دروس ودورات علمية" },
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
