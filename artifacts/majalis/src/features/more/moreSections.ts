/**
 * مصدر واحد لأبواب «المزيد» — قائمة مختصرة بلا تكرار مع الشريط السفلي.
 */
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  BookOpen,
  CreditCard,
  Library,
  ScrollText,
  Search,
  Settings,
  Star,
  Users,
} from "lucide-react";

export type MoreSectionTier = "featured" | "standard";

export type MoreSection = {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  route: string;
  tier: MoreSectionTier;
  order: number;
  badge?: string;
  keywords?: string[];
  /** إجراء خاص (بحث) بدل التنقّل */
  action?: "search";
};

/** القائمة المعتمدة داخل المزيد (مع الشريط السفلي: قرآن · دروس · صلاة · فقه). */
export const MORE_FEATURED_SECTIONS: MoreSection[] = [
  {
    id: "adhkar",
    title: "الأذكار",
    subtitle: "أذكار اليوم والليل",
    icon: BookMarked,
    route: "/adhkar",
    tier: "featured",
    order: 1,
    keywords: ["أذكار", "دعاء"],
  },
  {
    id: "library",
    title: "المكتبة",
    subtitle: "كتب ومصادر",
    icon: Library,
    route: "/library",
    tier: "featured",
    order: 2,
    keywords: ["مكتبة", "كتب"],
  },
  {
    id: "scholars",
    title: "العلماء",
    subtitle: "أعلام الإسلام",
    icon: Users,
    route: "/scholars",
    tier: "featured",
    order: 3,
    keywords: ["علماء", "أعلام"],
  },
  {
    id: "hadith",
    title: "الحديث",
    subtitle: "صحيح وضعيف وكتب",
    icon: ScrollText,
    route: "/hadith",
    tier: "featured",
    order: 4,
    keywords: ["حديث", "سنة"],
  },
  {
    id: "prophets",
    title: "قصص الأنبياء",
    subtitle: "من آدم إلى محمد ﷺ",
    icon: BookOpen,
    route: "/prophets",
    tier: "featured",
    order: 5,
    keywords: ["أنبياء", "قصص"],
  },
  {
    id: "quiz",
    title: "سين جيم",
    subtitle: "مسابقة أسئلة تفاعلية",
    icon: Star,
    route: "/quiz",
    tier: "featured",
    order: 6,
    keywords: ["مسابقة", "اختبار", "quiz", "سين جيم", "qa"],
  },
  {
    id: "fawaid-cards",
    title: "الفوائد والبطاقات",
    subtitle: "فوائد ومراجعة سريعة",
    icon: CreditCard,
    route: "/fawaid",
    tier: "featured",
    order: 7,
    keywords: ["فوائد", "بطاقات", "مراجعة", "flashcards"],
  },
  {
    id: "search",
    title: "البحث",
    subtitle: "ابحث في المحتوى",
    icon: Search,
    route: "/search",
    tier: "featured",
    order: 8,
    keywords: ["بحث"],
    action: "search",
  },
  {
    id: "settings",
    title: "الإعدادات",
    subtitle: "الحساب والمظهر",
    icon: Settings,
    route: "/settings",
    tier: "featured",
    order: 9,
    keywords: ["إعدادات"],
  },
];

/** أدوات مساعدة ثانوية — ليست أبوابًا رئيسية. */
export const MORE_STANDARD_SECTIONS: MoreSection[] = [
  {
    id: "glossary",
    title: "المصطلحات",
    icon: BookMarked,
    route: "/islamic-glossary",
    tier: "standard",
    order: 20,
    keywords: ["معجم", "مصطلحات"],
  },
  {
    id: "topics",
    title: "الموضوعات",
    icon: BookOpen,
    route: "/topics",
    tier: "standard",
    order: 21,
    keywords: ["مواضيع"],
  },
  {
    id: "memorize",
    title: "بطاقات المراجعة",
    icon: CreditCard,
    route: "/memorize",
    tier: "standard",
    order: 22,
    keywords: ["بطاقات", "حفظ"],
  },
];

export const MORE_ACCOUNT_SECTIONS: MoreSection[] = [
  {
    id: "account",
    title: "الحساب",
    icon: Users,
    route: "/my-learning",
    tier: "standard",
    order: 90,
  },
];

export const MORE_FEATURED_TITLES = MORE_FEATURED_SECTIONS.map((s) => s.title);
export const MORE_FEATURED_ROUTES = MORE_FEATURED_SECTIONS.map((s) => s.route);
export const MORE_QURAN_ULUM_ICON = BookMarked;
