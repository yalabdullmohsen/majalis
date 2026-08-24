/**
 * ثوابت كروم اللوبي — بلا كتب فقه أو سجل بطاقات حتى لا تنتفخ الحزمة الابتدائية.
 */
export type LobbyId = "quran" | "lessons" | "prayer" | "fiqh" | "sections";

export const LOBBY_IDS: LobbyId[] = ["quran", "lessons", "prayer", "fiqh", "sections"];

export const TAB_ROOT_PATHS = [
  "/quran-hub",
  "/lessons",
  "/prayer-times",
  "/fiqh",
  "/sections",
  "/competitions",
] as const;

export function isTabRootPath(pathname: string): boolean {
  const p = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  if (p === "/more") return true;
  return (TAB_ROOT_PATHS as readonly string[]).includes(p);
}

/** فلتر البحث العام حسب التبويب الحالي */
export const LOBBY_SEARCH_FILTER: Record<LobbyId, string> = {
  quran: "surah",
  lessons: "lesson",
  prayer: "adhkar",
  fiqh: "fiqh",
  sections: "all",
};
