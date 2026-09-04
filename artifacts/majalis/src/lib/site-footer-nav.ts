/**
 * مجموعات التذييل العالمي — مشتقة من src/config/navigation.ts
 * مع إسقاط المسارات المخفية من الاكتشاف العام.
 */
import { footerNav, type FooterGroup, type NavLinkItem } from "@/config/navigation";
import { filterNavItems } from "@/lib/nav-visibility";

export type FooterLink = NavLinkItem;
export type { FooterGroup };

export const SITE_FOOTER_GROUPS: FooterGroup[] = footerNav.map((g) => ({
  id: g.id,
  title: g.title,
  links: filterNavItems(g.links.map((l) => ({ href: l.href, label: l.label }))),
})).filter((g) => g.links.length > 0);

export const SITE_FOOTER_TAGLINE = "الريادة الإسلامية الرقمية";
