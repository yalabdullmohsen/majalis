/**
 * مصدر واحد لخريطة التنقّل (إطلاق المجلس العلمي).
 * يشتق منه: الشريط السفلي، مركز الخدمات، التذييل، والجانبية.
 */
import type { LucideIcon } from "lucide-react";
import { BookOpen, Clock, GraduationCap, Home } from "lucide-react";
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

/** الشريط السفلي: أربعة تبويبات عاملة + «المزيد» منفصل في المكوّن */
export const BOTTOM_NAV_TABS: BottomNavTab[] = [
  { href: "/", label: "الرئيسية", Icon: Home },
  { href: "/quran-knowledge", label: "القرآن", Icon: BookOpen },
  { href: "/prayer-times", label: "الصلاة", Icon: Clock },
  { href: "/lessons", label: "الدروس", Icon: GraduationCap },
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
