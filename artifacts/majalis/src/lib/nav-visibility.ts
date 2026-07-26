/**
 * سياسة ظهور عناصر التنقل — مصدر واحد للقوائم (Top / More / Side / كتالوج الرئيسية).
 * - comingSoon: يظهر بشارة «قريبًا» ويمكن فتح الصفحة لرسالة الترقّب.
 * - hiddenFromNav: لا يُعرض في قوائم المستخدم (المسار قد يبقى للروابط العميقة/الأدمن).
 */

export const COMING_SOON_PATHS = new Set<string>([
  "/kids",
  "/quran-circles",
]);

/** عناصر أُزيلت من الاكتشاف العام حسب مراجعة الدمج/الإلغاء. */
export const HIDDEN_FROM_NAV_PATHS = new Set<string>([
  "/features-in-progress",
  "/mushaf-v2-preview",
  "/car-mode",
  "/mosque-mode",
  "/family",
  "/family-mode",
  "/learning-plan", // مدمج تحت المسارات
  "/knowledge-map", // مدمج تحت شبكة المعرفة
  "/masarat",
]);

export function isComingSoonPath(href: string): boolean {
  const clean = href.split("#")[0].split("?")[0] || href;
  return COMING_SOON_PATHS.has(clean);
}

export function isHiddenFromNav(href: string): boolean {
  const clean = href.split("#")[0].split("?")[0] || href;
  if (HIDDEN_FROM_NAV_PATHS.has(clean)) return true;
  return false;
}

export function withComingSoonLabel(label: string, href: string): string {
  if (!isComingSoonPath(href)) return label;
  if (label.includes("قريب")) return label;
  return `${label} · قريبًا`;
}

export function filterNavItems<T extends { href: string }>(items: T[]): T[] {
  return items.filter((item) => !isHiddenFromNav(item.href));
}
