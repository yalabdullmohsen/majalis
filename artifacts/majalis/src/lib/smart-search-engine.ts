/**
 * Web port of Flutter `SmartSearchEngine` — category filter + title match.
 * Pure logic (no React) so UI and tests share one filter path.
 */

export type SearchCategory = "all" | "quran" | "fiqh" | "sirah" | "hadith";

export type SmartSearchItem = {
  title: string;
  category: Exclude<SearchCategory, "all">;
  sub: string;
};

export const SMART_SEARCH_DATABASE: readonly SmartSearchItem[] = [
  { title: "إنما الأعمال بالنيات", category: "hadith", sub: "صحيح البخاري" },
  { title: "أحكام الطهارة والصلاة", category: "fiqh", sub: "فقه العبادات" },
  { title: "غزوة بدر الكبرى", category: "sirah", sub: "السيرة النبوية" },
  {
    title: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
    category: "quran",
    sub: "سورة البقرة",
  },
];

export const SEARCH_CATEGORY_LABELS: Record<SearchCategory, string> = {
  all: "الكل",
  quran: "القرآن الكريم",
  fiqh: "الفقه",
  sirah: "السيرة",
  hadith: "الحديث",
};

export function filterSmartSearch(
  query: string,
  category: SearchCategory,
  database: readonly SmartSearchItem[] = SMART_SEARCH_DATABASE,
): SmartSearchItem[] {
  const q = query.trim();
  return database.filter((item) => {
    const matchesQuery = !q || item.title.includes(q);
    const matchesCategory = category === "all" || item.category === category;
    return matchesQuery && matchesCategory;
  });
}

export function searchCategoryIcon(category: string): string {
  switch (category) {
    case "quran":
      return "book";
    case "fiqh":
      return "gavel";
    case "sirah":
      return "history";
    default:
      return "bookmark";
  }
}
