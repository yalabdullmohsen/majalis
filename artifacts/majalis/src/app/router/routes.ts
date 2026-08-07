/**
 * سجل المسارات المستهدف — مصدر الحقيقة بعد حزمة F.
 * حاليًا App.tsx هو المصدر التشغيلي؛ هذا الملف يُبنى تدريجيًا أثناء C/F.
 */

import type { ComponentType, LazyExoticComponent } from "react";

export type AppRouteSection =
  | "quran"
  | "lessons"
  | "hadith"
  | "fiqh"
  | "library"
  | "adhkar"
  | "prayer"
  | "tools"
  | "account"
  | "other";

export type AppRoute = {
  path: string;
  titleAr: string;
  descriptionAr?: string;
  section: AppRouteSection;
  /** مفتاح أيقونة اختياري للتنقّل */
  icon?: string;
  component?: LazyExoticComponent<ComponentType<unknown>> | ComponentType<unknown>;
  inNav: boolean;
  inSitemap: boolean;
  /** مسارات ذات صلة (لـ RelatedRail / فتات الخبز) */
  related?: readonly string[];
};

/**
 * نواة السجل — تُوسَّع في F من كل مسارات App.
 * المسارات هنا مرجعية للتوثيق والتنقّل الموحّد لاحقًا.
 */
export const ROUTE_REGISTRY: readonly AppRoute[] = [
  { path: "/", titleAr: "الرئيسية", section: "other", inNav: true, inSitemap: true },
  { path: "/quran-hub", titleAr: "القرآن", section: "quran", inNav: true, inSitemap: true, related: ["/mushaf", "/tilawa"] },
  { path: "/mushaf", titleAr: "المصحف", section: "quran", inNav: false, inSitemap: true, related: ["/quran-hub", "/tilawa"] },
  { path: "/tilawa", titleAr: "التلاوة", section: "quran", inNav: false, inSitemap: true },
  { path: "/lessons", titleAr: "الدروس", section: "lessons", inNav: true, inSitemap: true },
  { path: "/hadith", titleAr: "الحديث", section: "hadith", inNav: true, inSitemap: true, related: ["/hadith-science"] },
  { path: "/fiqh", titleAr: "الفقه", section: "fiqh", inNav: true, inSitemap: true },
  { path: "/library", titleAr: "المكتبة", section: "library", inNav: true, inSitemap: true },
  { path: "/scholars", titleAr: "العلماء", section: "library", inNav: false, inSitemap: true },
  { path: "/adhkar", titleAr: "الأذكار", section: "adhkar", inNav: true, inSitemap: true },
  { path: "/prayer-times", titleAr: "الصلاة", section: "prayer", inNav: true, inSitemap: true },
  { path: "/memorize", titleAr: "الحفظ", section: "tools", inNav: false, inSitemap: true },
  { path: "/search", titleAr: "البحث", section: "tools", inNav: false, inSitemap: true },
  { path: "/islamic-glossary", titleAr: "المصطلحات", section: "tools", inNav: false, inSitemap: true },
] as const;

export function getRouteByPath(path: string): AppRoute | undefined {
  return ROUTE_REGISTRY.find((r) => r.path === path);
}

export function routesInNav(): readonly AppRoute[] {
  return ROUTE_REGISTRY.filter((r) => r.inNav);
}

export function routesInSitemap(): readonly AppRoute[] {
  return ROUTE_REGISTRY.filter((r) => r.inSitemap);
}
