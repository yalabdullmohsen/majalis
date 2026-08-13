/**
 * مصدر واحد لأبواب «المزيد» المميزة.
 * الصفحة/الورقة تشتق العرض من هنا — ممنوع تكرار العناوين داخل JSX.
 */
import type { LucideIcon } from "lucide-react";
import {
  BookA,
  BookMarked,
  BookOpen,
  Building2,
  Compass,
  Heart,
  Library,
  Radio,
  Settings,
  Star,
  Download,
  User,
  Scale,
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
};

/** السبعة الرئيسية — الترتيب ملزم. */
export const MORE_FEATURED_SECTIONS: MoreSection[] = [
  {
    id: "quiz",
    title: "سين جيم",
    subtitle: "مسابقة أسئلة وأجوبة",
    icon: Star,
    route: "/quiz",
    tier: "featured",
    order: 1,
    keywords: ["مسابقة", "اختبار", "quiz", "سين جيم"],
  },
  {
    id: "prophets-nations",
    title: "قصص الأنبياء والأمم السابقة",
    subtitle: "الأنبياء · عاد وثمود وفرعون",
    icon: BookOpen,
    route: "/prophets",
    tier: "featured",
    order: 2,
    keywords: ["أنبياء", "أمم", "قصص"],
  },
  {
    id: "quran-people",
    title: "الذين ذكروا في القرآن",
    subtitle: "أعلام وشخصيات قرآنية",
    icon: Users,
    route: "/quran/people",
    tier: "featured",
    order: 3,
    keywords: ["أعلام", "شخصيات", "الذين ذكروا"],
  },
  {
    id: "tafsir",
    title: "التفسير",
    subtitle: "أنواع التفسير وأصوله",
    icon: Library,
    route: "/tafsir",
    tier: "featured",
    order: 4,
    keywords: ["تفسير"],
  },
  {
    id: "seerah",
    title: "السيرة النبوية",
    subtitle: "من المولد إلى الوفاة ﷺ",
    icon: BookA,
    route: "/seerah",
    tier: "featured",
    order: 5,
    keywords: ["سيرة"],
  },
  {
    id: "discover-islam",
    title: "اكتشف الإسلام",
    subtitle: "للمسلم الجديد والدعوة",
    icon: Compass,
    route: "/discover-islam",
    tier: "featured",
    order: 6,
    keywords: ["اكتشف", "دعوة", "مسلم جديد"],
  },
  {
    id: "tarikh-islami",
    title: "التاريخ الإسلامي",
    subtitle: "الحضارة ومفاصل الأمة",
    icon: Building2,
    route: "/tarikh-islami",
    tier: "featured",
    order: 7,
    keywords: ["تاريخ", "حضارة"],
  },
];

/** مربعات أصغر تحت السبعة — بلا تكرار لعناصر الشريط السفلي (رئيسية/دروس/قرآن/صلاة). */
export const MORE_STANDARD_SECTIONS: MoreSection[] = [
  {
    id: "adhkar",
    title: "الأذكار",
    icon: BookMarked,
    route: "/adhkar",
    tier: "standard",
    order: 10,
  },
  {
    id: "duas",
    title: "الأدعية",
    icon: Heart,
    route: "/duas",
    tier: "standard",
    order: 11,
  },
  {
    id: "library",
    title: "المكتبة",
    icon: Library,
    route: "/library",
    tier: "standard",
    order: 12,
  },
  {
    id: "broadcast",
    title: "البث",
    icon: Radio,
    route: "/updates",
    tier: "standard",
    order: 13,
  },
  {
    id: "fatwas",
    title: "الفتاوى",
    icon: Scale,
    route: "/rulings",
    tier: "standard",
    order: 14,
  },
  {
    id: "favorites",
    title: "المفضلة",
    icon: Star,
    route: "/my-citations",
    tier: "standard",
    order: 15,
  },
  {
    id: "downloads",
    title: "التنزيلات",
    icon: Download,
    route: "/vault",
    tier: "standard",
    order: 16,
  },
  {
    id: "knowledge-graph",
    title: "الرسم المعرفي",
    icon: Compass,
    route: "/knowledge-graph",
    tier: "standard",
    order: 17,
  },
];

export const MORE_ACCOUNT_SECTIONS: MoreSection[] = [
  {
    id: "account",
    title: "الحساب",
    icon: User,
    route: "/my-learning",
    tier: "standard",
    order: 90,
  },
  {
    id: "settings",
    title: "الإعدادات",
    icon: Settings,
    route: "/settings",
    tier: "standard",
    order: 91,
  },
];

/** العناوين بالترتيب — بوابة انحدار. */
export const MORE_FEATURED_TITLES = MORE_FEATURED_SECTIONS.map((s) => s.title);

/** المسارات المميزة — يجب أن تكون مسجّلة في App.tsx. */
export const MORE_FEATURED_ROUTES = MORE_FEATURED_SECTIONS.map((s) => s.route);

/** أيقونة اختيارية للتفسير ضمن علوم القرآن إن لزم الربط. */
export const MORE_QURAN_ULUM_ICON = BookMarked;
