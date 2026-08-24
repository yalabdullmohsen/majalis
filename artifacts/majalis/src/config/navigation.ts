/**
 * مصدر واحد لتنقّل الشريط السفلي والدرج وبطاقات الرئيسية.
 * المسارات/الأيقونات من سجل الأقسام — هنا ترتيب الظهور فقط.
 */
import type { LucideIcon } from "lucide-react";
import { getSectionById } from "@/config/sections.registry";

export type NavPlacement = "bottom" | "drawer" | "home";

export type NavEntry = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  surfaces: readonly NavPlacement[];
};

const BOTTOM_IDS = ["quran", "lessons", "prayer", "fiqh", "sections"] as const;
const DRAWER_IDS = [
  "open-mushaf",
  "quran-recitation",
  "quran",
  "lessons",
  "fiqh",
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
  adhkar: "الأذكار",
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
