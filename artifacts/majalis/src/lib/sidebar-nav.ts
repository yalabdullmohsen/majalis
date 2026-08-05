/**
 * مصدر موحّد لعناصر القائمة الجانبية وقائمة المزيد.
 * لا يضم: من نحن، المكتبة، المستجدات، الفتاوى، استكشف المعرفة، البحث العلمي.
 */
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  BookOpen,
  Brain,
  CalendarDays,
  Clock,
  Home,
  MapPin,
  Scale,
  ScrollText,
  Settings,
  User,
} from "lucide-react";
import { seoNavLabel } from "@/lib/seo-nav-labels";
import { filterNavItems } from "@/lib/nav-visibility";

export type SidebarNavItem = {
  href: string;
  label: string;
  description?: string;
  Icon: LucideIcon;
};

export type SidebarNavGroup = {
  id: string;
  title: string;
  items: SidebarNavItem[];
};

const SIDEBAR_NAV_GROUPS_RAW: SidebarNavGroup[] = [
  {
    id: "quick",
    title: "الوصول السريع",
    items: [
      { href: "/", label: seoNavLabel("/", "الرئيسية"), description: "لوحة المنصة", Icon: Home },
      { href: "/mushaf", label: seoNavLabel("/mushaf", "القرآن"), description: "المصحف الشريف", Icon: BookOpen },
      { href: "/memorize", label: seoNavLabel("/memorize", "الحفظ"), description: "بطاقات الحفظ والتكرار المتباعد", Icon: Brain },
      { href: "/prayer-times", label: seoNavLabel("/prayer-times", "الصلاة"), description: "مواقيت الصلاة", Icon: Clock },
    ],
  },
  {
    id: "knowledge",
    title: "العلم والمحتوى",
    items: [
      {
        href: "/quran-knowledge",
        label: seoNavLabel("/quran-knowledge", "القرآن وعلومه"),
        description: "فهرس · علوم · أسباب · قصص",
        Icon: BookMarked,
      },
      { href: "/hadith", label: seoNavLabel("/hadith", "الحديث والسنة"), description: "أحاديث وعلوم السنة", Icon: ScrollText },
      { href: "/fiqh", label: seoNavLabel("/fiqh", "الفقه والأحكام"), description: "أحكام ومسائل", Icon: Scale },
      {
        href: "/memorization",
        label: seoNavLabel("/memorization", "الحفظ والمراجعة"),
        description: "اختبارات وخطط الحفظ",
        Icon: Brain,
      },
    ],
  },
  {
    id: "services",
    title: "خدمات",
    items: [
      {
        href: "/occasions-lessons",
        label: seoNavLabel("/occasions-lessons", "المناسبات والدروس"),
        description: "مناسبات وتقويم دروس",
        Icon: CalendarDays,
      },
      {
        href: "/islamic-directory",
        label: seoNavLabel("/islamic-directory", "الدليل الإسلامي"),
        description: "مؤسسات ومساجد ومشاهد",
        Icon: MapPin,
      },
    ],
  },
  {
    id: "account",
    title: "الحساب",
    items: [
      { href: "/my-learning", label: seoNavLabel("/my-learning", "حسابي"), description: "تقدمك والبطاقات المراجعة", Icon: User },
      { href: "/settings", label: seoNavLabel("/settings", "الإعدادات"), description: "تفضيلات التطبيق", Icon: Settings },
    ],
  },
];

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = SIDEBAR_NAV_GROUPS_RAW.map((group) => ({
  ...group,
  items: filterNavItems(group.items),
})).filter((group) => group.items.length > 0);

/** عناصر قائمة المزيد (ثانوية) — نفس الهوية بلا تكرار الرئيسية/القرآن/الصلاة/حسابي. */
export const MORE_SHEET_ITEMS: SidebarNavItem[] = filterNavItems([
  SIDEBAR_NAV_GROUPS_RAW[1].items[0],
  SIDEBAR_NAV_GROUPS_RAW[1].items[1],
  SIDEBAR_NAV_GROUPS_RAW[1].items[2],
  SIDEBAR_NAV_GROUPS_RAW[1].items[3],
  SIDEBAR_NAV_GROUPS_RAW[2].items[0],
  SIDEBAR_NAV_GROUPS_RAW[2].items[1],
  SIDEBAR_NAV_GROUPS_RAW[3].items[1],
]);

export const SIDEBAR_FLAT_HREFS: string[] = SIDEBAR_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
