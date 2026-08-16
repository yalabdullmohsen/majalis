/**
 * مصدر واحد لأبواب «المزيد» — مجموعات بلا تكرار مع الشريط السفلي.
 */
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  BookOpen,
  Clock,
  CreditCard,
  Heart,
  Library,
  ScrollText,
  Search,
  Settings,
  Star,
  Users,
} from "lucide-react";

export type MoreSectionTier = "featured" | "standard";

export type MoreSectionGroupId =
  | "science"
  | "learn"
  | "worship"
  | "account";

export type MoreSection = {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  route: string;
  tier: MoreSectionTier;
  order: number;
  group: MoreSectionGroupId;
  badge?: string;
  keywords?: string[];
  /** إجراء خاص (بحث) بدل التنقّل */
  action?: "search";
};

export const MORE_SECTION_GROUPS: { id: MoreSectionGroupId; title: string }[] = [
  { id: "science", title: "الأقسام العلمية" },
  { id: "learn", title: "أدوات التعلم" },
  { id: "worship", title: "العبادات" },
  { id: "account", title: "الإعدادات والخدمات" },
];

/** القائمة المعتمدة داخل المزيد (مع الشريط السفلي: قرآن · دروس · صلاة · فقه). */
export const MORE_FEATURED_SECTIONS: MoreSection[] = [
  {
    id: "library",
    title: "المكتبة",
    subtitle: "كتب ومصادر",
    icon: Library,
    route: "/library",
    tier: "featured",
    order: 1,
    group: "science",
    keywords: ["مكتبة", "كتب"],
  },
  {
    id: "scholars",
    title: "أعلام وتراجم",
    subtitle: "علماء الإسلام",
    icon: Users,
    route: "/scholars",
    tier: "featured",
    order: 2,
    group: "science",
    keywords: ["علماء", "أعلام", "تراجم"],
  },
  {
    id: "hadith",
    title: "الحديث وعلومه",
    subtitle: "صحيح وضعيف وكتب",
    icon: ScrollText,
    route: "/hadith",
    tier: "featured",
    order: 3,
    group: "science",
    keywords: ["حديث", "سنة"],
  },
  {
    id: "prophets",
    title: "قصص الأنبياء",
    subtitle: "من آدم إلى محمد ﷺ",
    icon: BookOpen,
    route: "/prophets",
    tier: "featured",
    order: 4,
    group: "science",
    keywords: ["أنبياء", "قصص"],
  },
  {
    id: "quiz",
    title: "سين جيم",
    subtitle: "مسابقة أسئلة تفاعلية",
    icon: Star,
    route: "/quiz",
    tier: "featured",
    order: 5,
    group: "learn",
    keywords: ["مسابقة", "اختبار", "quiz", "سين جيم", "qa"],
  },
  {
    id: "fawaid-cards",
    title: "الفوائد والبطاقات",
    subtitle: "فوائد ومراجعة سريعة",
    icon: CreditCard,
    route: "/fawaid",
    tier: "featured",
    order: 6,
    group: "learn",
    keywords: ["فوائد", "بطاقات", "مراجعة", "flashcards"],
  },
  {
    id: "search",
    title: "البحث",
    subtitle: "ابحث في المحتوى",
    icon: Search,
    route: "/search",
    tier: "featured",
    order: 7,
    group: "learn",
    keywords: ["بحث"],
    action: "search",
  },
  {
    id: "adhkar",
    title: "الأذكار",
    subtitle: "أذكار اليوم والليل",
    icon: BookMarked,
    route: "/adhkar",
    tier: "featured",
    order: 8,
    group: "worship",
    keywords: ["أذكار", "دعاء"],
  },
  {
    id: "duas",
    title: "الأدعية",
    subtitle: "أدعية مأثورة",
    icon: Heart,
    route: "/duas",
    tier: "featured",
    order: 9,
    group: "worship",
    keywords: ["أدعية", "دعاء"],
  },
  {
    id: "prayer",
    title: "الصلاة",
    subtitle: "مواقيت وقبلة",
    icon: Clock,
    route: "/prayer-times",
    tier: "featured",
    order: 10,
    group: "worship",
    keywords: ["صلاة", "مواقيت"],
  },
  {
    id: "settings",
    title: "الإعدادات",
    subtitle: "الحساب والمظهر",
    icon: Settings,
    route: "/settings",
    tier: "featured",
    order: 11,
    group: "account",
    keywords: ["إعدادات"],
  },
  {
    id: "favorites",
    title: "المفضلة",
    subtitle: "اقتباساتك المحفوظة",
    icon: Heart,
    route: "/my-citations",
    tier: "featured",
    order: 12,
    group: "account",
    keywords: ["مفضلة", "محفوظات"],
  },
];

/** أدوات مساعدة ثانوية — ليست أبوابًا رئيسية (بحث/مكتبة). */
export const MORE_STANDARD_SECTIONS: MoreSection[] = [
  {
    id: "glossary",
    title: "المصطلحات",
    subtitle: "أداة مساعدة للبحث",
    icon: BookMarked,
    route: "/islamic-glossary",
    tier: "standard",
    order: 20,
    group: "learn",
    keywords: ["معجم", "مصطلحات"],
  },
  {
    id: "topics",
    title: "الموضوعات",
    subtitle: "فهرس موضوعات",
    icon: BookOpen,
    route: "/topics",
    tier: "standard",
    order: 21,
    group: "learn",
    keywords: ["مواضيع"],
  },
];

export const MORE_ACCOUNT_SECTIONS: MoreSection[] = [
  {
    id: "account",
    title: "حسابي",
    icon: Users,
    route: "/my-learning",
    tier: "standard",
    order: 90,
    group: "account",
  },
];

export function moreSectionsInGroup(group: MoreSectionGroupId): MoreSection[] {
  return MORE_FEATURED_SECTIONS.filter((s) => s.group === group).sort((a, b) => a.order - b.order);
}

export const MORE_FEATURED_TITLES = MORE_FEATURED_SECTIONS.map((s) => s.title);
export const MORE_FEATURED_ROUTES = MORE_FEATURED_SECTIONS.map((s) => s.route);
export const MORE_QURAN_ULUM_ICON = BookMarked;
