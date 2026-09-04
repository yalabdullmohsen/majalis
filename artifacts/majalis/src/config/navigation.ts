/**
 * مصدر واحد للتنقّل العام — سُنّة / ssunnah.com
 * primaryNav · secondaryNav · footerNav · الشريط السفلي · الدرج · الرئيسية
 */
import type { LucideIcon } from "lucide-react";
import { getSectionById, searchSectionsIndex } from "@/config/sections.registry";

export type NavPlacement = "bottom" | "drawer" | "home";

export type NavLinkItem = {
  href: string;
  label: string;
  id?: string;
};

export type FooterGroup = {
  id: string;
  title: string;
  links: NavLinkItem[];
};

export type NavEntry = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  surfaces: readonly NavPlacement[];
};

/** التنقل الأساسي الموحّد — نفسه في الهيدر والـprerender وكل الصفحات العامة. */
export const primaryNav: readonly NavLinkItem[] = [
  { id: "home", href: "/", label: "الرئيسية" },
  { id: "lessons", href: "/lessons", label: "الدروس" },
  { id: "quran", href: "/quran-hub", label: "القرآن" },
  { id: "adhkar", href: "/adhkar", label: "الأذكار" },
  { id: "prayer", href: "/prayer-times", label: "الصلاة" },
  { id: "fiqh", href: "/fiqh", label: "الفقه" },
  { id: "search", href: "/search", label: "البحث" },
] as const;

/** أقسام ثانوية — الرئيسية (استكشف) · البحث · التذييل · روابط داخلية. */
export const secondaryNav: readonly NavLinkItem[] = [
  { id: "scholars", href: "/scholars", label: "العلماء" },
  { id: "hadith", href: "/hadith", label: "الحديث وعلومه" },
  { id: "tarikh", href: "/tarikh-islami", label: "التاريخ الإسلامي" },
  { id: "seerah", href: "/seerah", label: "السيرة" },
  { id: "prophets", href: "/prophets", label: "قصص الأنبياء" },
  { id: "nations", href: "/nations", label: "الأمم السابقة" },
  { id: "quran-people", href: "/quran/people", label: "الذين ذكروا في القرآن" },
  { id: "sources", href: "/sources", label: "المصادر" },
  { id: "sections", href: "/sections", label: "الأقسام" },
  { id: "quiz", href: "/quiz", label: "سين جيم" },
  { id: "competitions", href: "/competitions", label: "المسابقات" },
] as const;

/** مجموعات التذييل — بلا «المزيد»؛ الأقسام موزّعة بوضوح. */
export const footerNav: readonly FooterGroup[] = [
  {
    id: "sciences",
    title: "الأقسام العلمية",
    links: [
      { href: "/hadith", label: "الحديث وعلومه" },
      { href: "/scholars", label: "العلماء" },
      { href: "/tarikh-islami", label: "التاريخ الإسلامي" },
      { href: "/seerah", label: "السيرة" },
      { href: "/prophets", label: "قصص الأنبياء" },
      { href: "/nations", label: "الأمم السابقة" },
      { href: "/quran/people", label: "الذين ذكروا في القرآن" },
      { href: "/fiqh", label: "الفقه" },
      { href: "/sections", label: "جميع الأقسام" },
    ],
  },
  {
    id: "quran-services",
    title: "خدمات القرآن",
    links: [
      { href: "/quran-hub", label: "القرآن" },
      { href: "/mushaf", label: "المصحف" },
      { href: "/quran-hub/tajweed", label: "التجويد" },
      { href: "/tafsir", label: "التفسير" },
      { href: "/duas-quran", label: "أدعية القرآن" },
    ],
  },
  {
    id: "learning",
    title: "الدروس والبحث",
    links: [
      { href: "/lessons", label: "الدروس" },
      { href: "/search", label: "البحث" },
      { href: "/quiz", label: "سين جيم" },
      { href: "/competitions", label: "المسابقات" },
      { href: "/teachers", label: "المشايخ" },
      { href: "/adhkar", label: "الأذكار" },
      { href: "/prayer-times", label: "الصلاة" },
    ],
  },
  {
    id: "policies",
    title: "التواصل والسياسات",
    links: [
      { href: "/methodology", label: "منهجيتنا في التوثيق" },
      { href: "/fatwa-policy", label: "سياسة الفتوى" },
      { href: "/about", label: "من نحن" },
      { href: "/sources", label: "المصادر والتراخيص" },
      { href: "/contact", label: "تواصل معنا" },
      { href: "/privacy", label: "الخصوصية" },
      { href: "/privacy-center", label: "مركز الخصوصية" },
      { href: "/terms", label: "شروط الاستخدام" },
      { href: "/account-deletion", label: "حذف الحساب" },
    ],
  },
] as const;

/** مسارات مؤهّلة للفهرس في البحث الموحّد (من سجل الأقسام). */
export const searchEligibleSections: readonly NavLinkItem[] = searchSectionsIndex().map((s) => ({
  href: s.route,
  label: s.label,
  id: s.id,
}));

/**
 * مسارات عامة تُتوقع في sitemap — الأقسام الرئيسية والثانوية المهمة.
 * الفحص الكامل يقرأ seo-routes.json؛ هذه قائمة مرجعية للتدقيق.
 */
export const sitemapEligibleSections: readonly NavLinkItem[] = [
  ...primaryNav.filter((i) => i.href !== "/"),
  ...secondaryNav,
  { href: "/mushaf", label: "المصحف" },
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل معنا" },
  { href: "/methodology", label: "منهجيتنا" },
  { href: "/privacy", label: "الخصوصية" },
  { href: "/terms", label: "شروط الاستخدام" },
];

/** تسميات موحّدة للتدقيق — يمنع اختلاف القرآن/الصلاة/الحديث بين الأسطح. */
export const NAV_LABEL_CANONICAL: Record<string, string> = {
  "/quran-hub": "القرآن",
  "/mushaf": "المصحف",
  "/prayer-times": "الصلاة",
  "/hadith": "الحديث وعلومه",
  "/fiqh": "الفقه",
  "/adhkar": "الأذكار",
  "/lessons": "الدروس",
  "/search": "البحث",
};

// ── الشريط السفلي والدرج (من سجل الأقسام) ─────────────────────────────────

const BOTTOM_IDS = ["quran", "lessons", "prayer", "fiqh", "sections"] as const;
const DRAWER_IDS = [
  "open-mushaf",
  "quran",
  "lessons",
  "fiqh",
  "fawaid",
  "miracles",
  "sections",
  "qa",
  "prayer",
  "adhkar",
  "qibla",
  "tasbih",
  "settings",
] as const;
const HOME_IDS = ["quran", "lessons", "fiqh"] as const;

const LABEL_OVERRIDE: Record<string, string> = {
  "open-mushaf": "المصحف",
  quran: NAV_LABEL_CANONICAL["/quran-hub"],
  prayer: NAV_LABEL_CANONICAL["/prayer-times"],
  fiqh: NAV_LABEL_CANONICAL["/fiqh"],
};

function entryFromId(id: string, surfaces: readonly NavPlacement[]): NavEntry | null {
  const s = getSectionById(id);
  if (!s) return null;
  const isMushaf = id === "open-mushaf";
  return {
    id: isMushaf ? "mushaf" : s.id,
    label: LABEL_OVERRIDE[id] ?? s.navLabel ?? s.label,
    href: s.route,
    icon: s.icon,
    surfaces,
  };
}

function uniqueSurfaces(id: string): NavPlacement[] {
  const out: NavPlacement[] = [];
  if ((BOTTOM_IDS as readonly string[]).includes(id)) out.push("bottom");
  if ((DRAWER_IDS as readonly string[]).includes(id)) out.push("drawer");
  if ((HOME_IDS as readonly string[]).includes(id)) out.push("home");
  return out;
}

const ALL_IDS = [...new Set([...BOTTOM_IDS, ...DRAWER_IDS, ...HOME_IDS])];

export const NAV_ITEMS: NavEntry[] = ALL_IDS.map((id) =>
  entryFromId(id, uniqueSurfaces(id)),
).filter((e): e is NavEntry => Boolean(e));

function pick(ids: readonly string[], surface: NavPlacement): NavEntry[] {
  const out: NavEntry[] = [];
  for (const id of ids) {
    const e = NAV_ITEMS.find((item) => item.id === id || (id === "open-mushaf" && item.id === "mushaf"));
    if (e && e.surfaces.includes(surface)) out.push(e);
  }
  return out;
}

export function navFor(surface: NavPlacement): NavEntry[] {
  if (surface === "bottom") return pick(BOTTOM_IDS, "bottom");
  if (surface === "home") return pick(HOME_IDS, "home");
  return pick(DRAWER_IDS, "drawer");
}

/** HTML تنقّل الـprerender — يُستهلك من generate-seo.mjs */
export function prerenderNavItems(): NavLinkItem[] {
  return [...primaryNav];
}
