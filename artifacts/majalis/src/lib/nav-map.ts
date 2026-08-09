/**
 * مصدر واحد لخريطة التنقّل (إطلاق المجلس العلمي).
 * يشتق منه: الشريط السفلي، مركز الخدمات، التذييل، والجانبية.
 *
 * التنقّل الموحّد: قرآن · الدروس · الصلاة · فقه · المزيد (+ بحث دائم في الهيدر)
 */
import type { LucideIcon } from "lucide-react";
import { BookOpen, Clock, GraduationCap, Scale } from "lucide-react";
import {
  SERVICES_CENTER_GROUPS,
  filterServicesCenterGroups,
  type ServicesCenterGroup,
  type ServicesCenterItem,
} from "@/lib/services-center-nav";

export type BottomNavTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

/** الشريط السفلي: أربع مساحات + «المزيد» منفصل في المكوّن */
export const BOTTOM_NAV_TABS: BottomNavTab[] = [
  { href: "/quran-hub", label: "قرآن", Icon: BookOpen },
  { href: "/lessons", label: "الدروس", Icon: GraduationCap },
  { href: "/prayer-times", label: "الصلاة", Icon: Clock },
  { href: "/fiqh", label: "فقه", Icon: Scale },
];

/** مجموعات مركز الخدمات بالترتيب المعتمد */
export const NAV_SERVICE_GROUPS: ServicesCenterGroup[] = SERVICES_CENTER_GROUPS;

export { filterServicesCenterGroups };
export type { ServicesCenterGroup, ServicesCenterItem };

/** روابط تذييل «عن المجلس» — مشتقة من مجموعة about */
export function getAboutFooterLinks(): Array<{ href: string; label: string }> {
  const about = SERVICES_CENTER_GROUPS.find((g) => g.id === "about");
  if (!about) return [];
  return about.items
    .filter((i) => i.action.kind === "link")
    .map((i) => ({
      href: (i.action as { kind: "link"; href: string }).href,
      label: i.label,
    }));
}

/** عناصر القائمة الجانبية — نفس كتالوج الخدمات بدون إجراءات غير-روابط */
export function getSidebarGroupsFromNavMap(): Array<{
  id: string;
  title: string;
  items: Array<{ href: string; label: string; Icon: LucideIcon }>;
}> {
  return SERVICES_CENTER_GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    items: g.items
      .filter((i): i is ServicesCenterItem & { action: { kind: "link"; href: string } } => i.action.kind === "link")
      .map((i) => ({ href: i.action.href, label: i.label, Icon: i.Icon })),
  })).filter((g) => g.items.length > 0);
}
