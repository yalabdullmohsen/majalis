/**
 * مجموعات التذييل العالمي — مشتقة من src/config/navigation.ts
 */
import { footerNav, type FooterGroup, type NavLinkItem } from "@/config/navigation";

export type FooterLink = NavLinkItem;
export type { FooterGroup };

export const SITE_FOOTER_GROUPS: FooterGroup[] = footerNav.map((g) => ({
  id: g.id,
  title: g.title,
  links: g.links.map((l) => ({ href: l.href, label: l.label })),
}));

export const SITE_FOOTER_TAGLINE = "الريادة الإسلامية الرقمية";
