/**
 * كتالوج مركز الخدمات (MoreBottomSheet) — هيكل ثلاثي:
 * مميزات التطبيق → المحتوى والأقسام → الإعدادات والمساعدة.
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
  Route,
  TrendingUp,
  Scale,
  ScrollText,
  Search,
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
} from "lucide-react";
import { arabicMatchAny } from "@/lib/arabic-search";
import { MORE_FEATURED_SECTIONS } from "@/features/more/moreSections";

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
  /** وصف قصير يظهر تحت العنوان في مربعات الأبواب المميزة */
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
  action: { kind: "link", href: s.route },
}));

export const SERVICES_CENTER_GROUPS: ServicesCenterGroup[] = [
  {
    id: "hubs",
    title: "الأبواب الرئيسية",
    layout: "featured",
    items: FEATURED_HUB_ITEMS,
  },
  {
    id: "features",
    title: "مميزات التطبيق",
    layout: "quick",
    items: [
      { id: "adhkar", label: "الأذكار", keywords: ["دعاء", "أذكار"], Icon: HandHeart, action: { kind: "link", href: "/adhkar" } },
      { id: "memorize", label: "بطاقات الحفظ", keywords: ["حفظ", "مراجعة"], Icon: Brain, action: { kind: "link", href: "/memorize" } },
      { id: "tasbih", label: "التسبيح", keywords: ["مسبحة", "تسبيح"], Icon: HandHeart, action: { kind: "link", href: "/tasbih" } },
      { id: "daily-wird", label: "الورد اليومي", keywords: ["ورد"], Icon: Moon, action: { kind: "link", href: "/daily-wird" } },
      { id: "search", label: "البحث", keywords: ["بحث"], Icon: Search, action: { kind: "search" } },
      { id: "assistant", label: "المساعد العلمي", keywords: ["ذكاء", "مساعد"], Icon: HelpCircle, action: { kind: "link", href: "/assistant" } },
      { id: "qibla", label: "القبلة", keywords: ["قبلة", "اتجاه"], Icon: Compass, action: { kind: "link", href: "/qibla" } },
      { id: "calendar", label: "التقويم الهجري", keywords: ["تقويم", "هجري"], Icon: Clock, action: { kind: "link", href: "/calendar" } },
      { id: "quiz", label: "المسابقة", keywords: ["مسابقة", "اختبار", "quiz"], Icon: Star, action: { kind: "link", href: "/quiz" } },
      { id: "progress", label: "متابعة التقدّم", keywords: ["تقدم", "إحصاء"], Icon: TrendingUp, action: { kind: "link", href: "/stats" } },
      { id: "favorites", label: "المحفوظات", keywords: ["مفضلة", "حفظ"], Icon: Heart, action: { kind: "link", href: "/my-citations" } },
      { id: "alerts", label: "التنبيهات", keywords: ["إشعار", "تنبيه"], Icon: Bell, action: { kind: "link", href: "/notification-settings" } },
    ],
  },
  {
    id: "content",
    title: "المحتوى والأقسام",
    layout: "list",
    items: [
      { id: "prophets", label: "قصص الأنبياء", keywords: ["أنبياء"], Icon: BookOpen, action: { kind: "link", href: "/prophets" } },
      { id: "quran-people", label: "الذين ذكروا في القرآن", keywords: ["أعلام", "شخصيات", "فرعون", "مريم", "أشخاص", "الذين ذكروا"], Icon: Users, action: { kind: "link", href: "/quran/people" } },
      { id: "nations", label: "الأمم السابقة", keywords: ["أمم", "عاد", "ثمود", "فرعون"], Icon: Landmark, action: { kind: "link", href: "/nations" } },
      { id: "start-here", label: "ابدأ من هنا", keywords: ["مبتدئ", "ابدأ", "دليل"], Icon: Route, action: { kind: "link", href: "/start-here" } },
      { id: "learning-paths", label: "المسارات العلمية", keywords: ["مسار", "تعلم", "منهج"], Icon: GraduationCap, action: { kind: "link", href: "/learning/paths" } },
      { id: "quran-hub", label: "مركز القرآن", keywords: ["قرآن", "مصحف", "تسميع", "تجويد"], Icon: BookMarked, action: { kind: "link", href: "/quran-hub" } },
      { id: "quran-knowledge", label: "القرآن وعلومه", keywords: ["علوم قرآن"], Icon: BookOpen, action: { kind: "link", href: "/quran-knowledge" } },
      { id: "tafsir", label: "التفسير", keywords: ["تفسير"], Icon: Library, action: { kind: "link", href: "/tafsir" } },
      { id: "hadith", label: "الحديث وعلومه", keywords: ["حديث", "سنة", "أحاديث"], Icon: ScrollText, action: { kind: "link", href: "/hadith" } },
      { id: "seerah", label: "السيرة النبوية", keywords: ["سيرة"], Icon: BookA, action: { kind: "link", href: "/seerah" } },
      { id: "tawhid", label: "العقيدة", keywords: ["توحيد", "عقيدة"], Icon: Landmark, action: { kind: "link", href: "/tawhid" } },
      { id: "scholars-books", label: "العلماء وكتبهم", keywords: ["مكتبة", "كتب"], Icon: Library, action: { kind: "link", href: "/scholars" } },
      { id: "qa", label: "الأسئلة والأجوبة", keywords: ["أسئلة", "أجوبة", "qa"], Icon: HelpCircle, action: { kind: "link", href: "/qa" } },
      { id: "fawaid", label: "الفوائد", keywords: ["فائدة"], Icon: Star, action: { kind: "link", href: "/fawaid" } },
      { id: "topics", label: "المواضيع", keywords: ["موضوع"], Icon: BookMarked, action: { kind: "link", href: "/topics" } },
      { id: "learn", label: "تعلّم", keywords: ["مكتبة", "تعلم"], Icon: Library, action: { kind: "link", href: "/learn" } },
      { id: "history", label: "التاريخ الإسلامي", keywords: ["تاريخ"], Icon: Building2, action: { kind: "link", href: "/tarikh-islami" } },
      { id: "rulings", label: "موسوعة الأحكام", keywords: ["فتوى", "حكم"], Icon: Scale, action: { kind: "link", href: "/rulings" } },
      { id: "fiqh-council", label: "المجامع الفقهية", keywords: ["مجمع", "مجلس"], Icon: Landmark, action: { kind: "link", href: "/fiqh-council" } },
      { id: "discover-islam", label: "اكتشف الإسلام", keywords: ["مسلم جديد", "دعوة"], Icon: Share2, action: { kind: "link", href: "/discover-islam" } },
      { id: "glossary", label: "المصطلحات", keywords: ["مصطلحات", "glossary", "معجم"], Icon: BookMarked, action: { kind: "link", href: "/islamic-glossary" } },
      { id: "duas", label: "الأدعية", keywords: ["دعاء"], Icon: Heart, action: { kind: "link", href: "/duas" } },
      { id: "quran-memorization", label: "الحفظ القرآني", keywords: ["حفظ", "مصحف"], Icon: Brain, action: { kind: "link", href: "/quran-memorization" } },
      { id: "tasmee", label: "التسميع", keywords: ["تسميع", "تلاوة", "اختبار حفظ"], Icon: Brain, action: { kind: "link", href: "/quran/recitation-test-ai" } },
    ],
  },
  {
    id: "settings",
    title: "الإعدادات والمساعدة",
    layout: "list",
    items: [
      { id: "account", label: "حسابي", Icon: User, action: { kind: "link", href: "/my-learning" } },
      { id: "settings", label: "الإعدادات", Icon: Settings, action: { kind: "link", href: "/settings" } },
      { id: "theme", label: "المظهر", keywords: ["ليلي", "نهاري", "تلقائي", "وضع"], Icon: Moon, action: { kind: "theme" } },
      { id: "adhan-settings", label: "إعدادات الأذان", keywords: ["أذان", "مؤذن"], Icon: Bell, action: { kind: "link", href: "/adhan-settings" } },
      { id: "share", label: "شارك التطبيق", Icon: Share2, action: { kind: "share" } },
      { id: "rate", label: "قيّم التطبيق", Icon: Star, action: { kind: "rate" } },
      { id: "support", label: "الدعم والتواصل", keywords: ["دعم", "support", "تواصل", "بلاغ"], Icon: Mail, action: { kind: "link", href: "/support" } },
      { id: "contact", label: "تواصل معنا", Icon: Mail, action: { kind: "link", href: "/contact" } },
      { id: "about-us", label: "من نحن", keywords: ["who-we-are", "من نحن"], Icon: Info, action: { kind: "link", href: "/about-us" } },
      { id: "about-app", label: "حول التطبيق", Icon: Star, action: { kind: "link", href: "/about" } },
      { id: "methodology", label: "منهجية التوثيق", Icon: BookOpen, action: { kind: "link", href: "/methodology" } },
      { id: "sources", label: "المصادر والتراخيص", keywords: ["ترخيص", "مصدر", "مرجع"], Icon: FileText, action: { kind: "link", href: "/sources" } },
      { id: "fatwa-policy", label: "سياسة الفتوى", Icon: Scale, action: { kind: "link", href: "/fatwa-policy" } },
      { id: "privacy", label: "سياسة الخصوصية", Icon: Shield, action: { kind: "link", href: "/privacy" } },
      { id: "privacy-center", label: "مركز الخصوصية", keywords: ["خصوصية", "تصدير", "موافقة", "كوكيز"], Icon: Shield, action: { kind: "link", href: "/privacy-center" } },
      { id: "terms", label: "شروط الاستخدام", Icon: FileText, action: { kind: "link", href: "/terms" } },
      { id: "account-deletion", label: "حذف الحساب", keywords: ["حذف", "خصوصية", "بيانات", "delete-account"], Icon: Trash2, action: { kind: "link", href: "/delete-account" } },
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
