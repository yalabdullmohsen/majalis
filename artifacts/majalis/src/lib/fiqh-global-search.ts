/**
 * البحث العام في قرارات المجامع — أُلغي من المنتج.
 * تبقى الواجهة لضمان عدم كسر الاستيرادات القديمة، وتعيد دائمًا نتائج فارغة.
 */

export const FIQH_SEARCH_KEYWORDS = [
  "حكم",
  "فتوى",
  "فتاوى",
  "فقه",
  "فقهي",
  "فقهية",
  "نازلة",
  "نوازل",
] as const;

export type FiqhGlobalSearchRow = {
  id: string;
  slug: string;
  title: string;
  href: string;
  kind: string;
  kindLabel: string;
  category?: string;
  searchMeta?: string;
  verified: boolean;
  score: number;
  session_date?: string;
};

export function isFiqhRelatedQuery(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  return FIQH_SEARCH_KEYWORDS.some((k) => q.includes(k));
}

export async function searchFiqhCouncilForGlobal(_query: string, _limit = 12) {
  return [] as FiqhGlobalSearchRow[];
}

export function mergeFiqhSearchResults(
  _rpcRows: Array<{ id: string; slug?: string; title: string; category?: string; searchMeta?: string }>,
  _boosted: FiqhGlobalSearchRow[],
) {
  return [] as FiqhGlobalSearchRow[];
}
