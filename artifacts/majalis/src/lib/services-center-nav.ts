/**
 * كتالوج مركز الخدمات (MoreBottomSheet):
 * أبواب المزيد المختصرة → أدوات سريعة → مساعدة وإعدادات.
 */
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  BookOpen,
  Brain,
  Building2,
  Clock,
  FileText,
  GraduationCap,
  HandHeart,
  Heart,
  HelpCircle,
  Info,
  Landmark,
  Library,
  Mail,
  Moon,
  Settings,
  Share2,
  Shield,
  Star,
  Trash2,
  User,
  Users,
  BookA,
  Bell,
  LogOut,
  Compass,
  Scale,
} from "lucide-react";
import { arabicMatchAny } from "@/lib/arabic-search";
import { MORE_FEATURED_SECTIONS } from "@/features/more/moreSections";
import { SECTION_GROUP_META, SECTION_GROUP_ORDER, sectionsByGroup } from "@/config/sections.registry";

export type ServicesCenterAction =
  | { kind: "link"; href: string }
  | { kind: "search" }
  | { kind: "theme" }
  | { kind: "share" }
  | { kind: "rate" }
  | { kind: "logout" };

export type ServicesCenterItem = {
  id: string;
  label: string;
  subtitle?: string;
  keywords?: string[];
  Icon: LucideIcon;
  action: ServicesCenterAction;
};

export type ServicesCenterGroup = {
  id: string;
  title: string;
  layout?: "quick" | "list" | "featured";
  items: ServicesCenterItem[];
};

const FEATURED_HUB_ITEMS: ServicesCenterItem[] = MORE_FEATURED_SECTIONS.map((s) => ({
  id: `hub-${s.id}`,
  label: s.title,
  subtitle: s.subtitle,
  keywords: s.keywords,
  Icon: s.icon,
  action: s.action === "search" ? { kind: "search" as const } : { kind: "link" as const, href: s.route },
}));

export const SERVICES_CENTER_GROUPS: ServicesCenterGroup[] = [
  {
    id: "hubs",
    title: "الأبواب المميّزة",
    layout: "featured",
    items: FEATURED_HUB_ITEMS,
  },
  {
    id: "features",
    title: "أدوات العبادة",
    layout: "quick",
    items: [
      { id: "tasbih", label: "التسبيح", keywords: ["مسبحة", "تسبيح"], Icon: HandHeart, action: { kind: "link", href: "/tasbih" } },
      { id: "duas", label: "الأدعية", keywords: ["دعاء", "أدعية"], Icon: Heart, action: { kind: "link", href: "/duas" } },
      { id: "daily-wird", label: "الورد اليومي", keywords: ["ورد"], Icon: Moon, action: { kind: "link", href: "/daily-wird" } },
      { id: "assistant", label: "المساعد العلمي", keywords: ["ذكاء", "مساعد"], Icon: HelpCircle, action: { kind: "link", href: "/assistant" } },
      { id: "qibla", label: "القبلة", keywords: ["قبلة", "اتجاه"], Icon: Compass, action: { kind: "link", href: "/qibla" } },
      { id: "calendar", label: "التقويم الهجري", keywords: ["تقويم", "هجري"], Icon: Clock, action: { kind: "link", href: "/calendar" } },
      { id: "memorize", label: "بطاقات المراجعة", keywords: ["حفظ", "مراجعة", "بطاقات"], Icon: Brain, action: { kind: "link", href: "/memorize" } },
      { id: "progress", label: "متابعة التقدّم", keywords: ["تقدم", "إحصاء"], Icon: Star, action: { kind: "link", href: "/stats" } },
      { id: "favorites", label: "المحفوظات", keywords: ["مفضلة", "حفظ"], Icon: Heart, action: { kind: "link", href: "/my-citations" } },
      { id: "alerts", label: "التنبيهات", keywords: ["إشعار", "تنبيه"], Icon: Bell, action: { kind: "link", href: "/notification-settings" } },
      { id: "glossary", label: "المصطلحات", keywords: ["مصطلحات", "glossary", "معجم"], Icon: BookMarked, action: { kind: "link", href: "/islamic-glossary" } },
      { id: "topics", label: "الموضوعات", keywords: ["موضوع", "مواضيع"], Icon: BookOpen, action: { kind: "link", href: "/topics" } },
    ],
  },
  {
    id: "content",
    title: "العلوم الشرعية",
    layout: "list",
    items: [
      { id: "seerah", label: "السيرة النبوية", keywords: ["سيرة"], Icon: BookA, action: { kind: "link", href: "/seerah" } },
      { id: "tawhid", label: "العقيدة", keywords: ["توحيد", "عقيدة"], Icon: Landmark, action: { kind: "link", href: "/tawhid" } },
      { id: "nations", label: "الأمم السابقة", keywords: ["أمم", "عاد", "ثمود"], Icon: Landmark, action: { kind: "link", href: "/nations" } },
      { id: "quran-people", label: "الذين ذكروا في القرآن", keywords: ["أعلام", "شخصيات"], Icon: Users, action: { kind: "link", href: "/quran/people" } },
      { id: "discover-islam", label: "اكتشف الإسلام", keywords: ["مسلم جديد", "دعوة"], Icon: Share2, action: { kind: "link", href: "/discover-islam" } },
      { id: "islamic-directory", label: "الدليل الإسلامي", keywords: ["مؤسسات", "مساجد", "دليل"], Icon: Landmark, action: { kind: "link", href: "/islamic-directory" } },
      { id: "universities", label: "دليل الجامعات الشرعية", keywords: ["جامعات", "كليات"], Icon: GraduationCap, action: { kind: "link", href: "/universities" } },
      { id: "academic-research", label: "الرسائل والأبحاث", keywords: ["أبحاث", "رسائل"], Icon: FileText, action: { kind: "link", href: "/academic-research" } },
      { id: "history", label: "التاريخ الإسلامي", keywords: ["تاريخ"], Icon: Building2, action: { kind: "link", href: "/tarikh-islami" } },
      { id: "learn", label: "أبواب العلم", keywords: ["تعلم", "تصنيف"], Icon: Library, action: { kind: "link", href: "/learn" } },
      { id: "updates", label: "المستجدات", keywords: ["بث", "تحديثات"], Icon: Bell, action: { kind: "link", href: "/updates" } },
    ],
  },
  {
    id: "settings",
    title: "الحساب والإعدادات",
    layout: "list",
    items: [
      { id: "account", label: "حسابي", Icon: User, action: { kind: "link", href: "/my-learning" } },
      { id: "settings", label: "الإعدادات", Icon: Settings, action: { kind: "link", href: "/settings" } },
      { id: "theme", label: "المظهر", keywords: ["ليلي", "نهاري", "تلقائي", "وضع"], Icon: Moon, action: { kind: "theme" } },
      { id: "adhan-settings", label: "إعدادات الأذان", keywords: ["أذان", "مؤذن"], Icon: Bell, action: { kind: "link", href: "/adhan-settings" } },
      { id: "share", label: "شارك التطبيق", Icon: Share2, action: { kind: "share" } },
      { id: "rate", label: "قيّم التطبيق", Icon: Star, action: { kind: "rate" } },
      { id: "support", label: "الدعم والتواصل", keywords: ["دعم", "support", "تواصل"], Icon: Mail, action: { kind: "link", href: "/support" } },
      { id: "contact", label: "تواصل معنا", Icon: Mail, action: { kind: "link", href: "/contact" } },
      { id: "about-us", label: "من نحن", keywords: ["who-we-are", "من نحن"], Icon: Info, action: { kind: "link", href: "/about-us" } },
      { id: "about-app", label: "حول التطبيق", Icon: Star, action: { kind: "link", href: "/about" } },
      { id: "methodology", label: "منهجية التوثيق", Icon: BookOpen, action: { kind: "link", href: "/methodology" } },
      { id: "sources", label: "المصادر والتراخيص", keywords: ["ترخيص", "مصدر"], Icon: FileText, action: { kind: "link", href: "/sources" } },
      { id: "fatwa-policy", label: "سياسة الفتوى", Icon: Scale, action: { kind: "link", href: "/fatwa-policy" } },
      { id: "privacy", label: "سياسة الخصوصية", Icon: Shield, action: { kind: "link", href: "/privacy" } },
      { id: "privacy-center", label: "مركز الخصوصية", keywords: ["خصوصية"], Icon: Shield, action: { kind: "link", href: "/privacy-center" } },
      { id: "terms", label: "شروط الاستخدام", Icon: FileText, action: { kind: "link", href: "/terms" } },
      { id: "account-deletion", label: "حذف الحساب", keywords: ["حذف", "delete-account"], Icon: Trash2, action: { kind: "link", href: "/delete-account" } },
      { id: "logout", label: "تسجيل الخروج", Icon: LogOut, action: { kind: "logout" } },
    ],
  },
];

export function filterServicesCenterGroups(query: string): ServicesCenterGroup[] {
  const q = query.trim();
  if (!q) return SERVICES_CENTER_GROUPS;
  return SERVICES_CENTER_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        arabicMatchAny([item.label, ...(item.keywords ?? []), group.title], q),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
