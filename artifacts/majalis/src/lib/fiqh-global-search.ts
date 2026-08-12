import { advancedSearchFiqhCouncil } from "./fiqh-council-service";
import { getFiqhIssues } from "./fiqh-council-issues-service";
import { isVerifiedPublicItem, isOfficialSourceVerified } from "./fiqh-council-trust";
import {
  FIQH_ITEM_TYPE_LABELS,
  fiqhIssueHref,
  fiqhItemHref,
  type FiqhCouncilItem,
  type FiqhCouncilIssue,
} from "./fiqh-council-types";
import { arabicMatchAny } from "./arabic-search";

/** كلمات ترفع أولوية نتائج المجمع الفقهي في البحث العام */
export const FIQH_SEARCH_KEYWORDS = [
  "حكم", "فتوى", "فتاوى", "قرار", "قرارات", "توصية", "توصيات",
  "مجمع فقهي", "المجمع الفقهي", "فقه", "فقهي", "فقهية",
  "نازلة", "نوازل", "نوازل معاصرة",
  "معاملات", "عبادات", "زكاة", "أسرة", "طب", "اقتصاد",
  "بنوك", "تأمين", "ذكاء اصطناعي", "عملات رقمية", "crypto",
  "مجامع فقهية", "قرار مجمعي", "فتوى جماعية", "بحث فقهي",
  "المجمع", "مجلس فقهي", "إسلامي",
];

export type FiqhGlobalSearchRow = {
  id: string;
  slug: string;
  title: string;
  href: string;
  kind: "resolution" | "fatwa" | "recommendation" | "research" | "ruling" | "issue" | "nawazil";
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
  return FIQH_SEARCH_KEYWORDS.some((kw) => q.includes(kw) || arabicMatchAny([q], kw));
}

function scoreItem(item: FiqhCouncilItem, baseRank = 0): number {
  let score = baseRank;
  if (isVerifiedPublicItem(item)) score += 50;
  if (isOfficialSourceVerified(item)) score += 30;
  const completion = item.completion_score ?? 0;
  score += completion / 5;
  if (item.session_id || item.session_number) score += 8;
  score += (item.views_count || 0) / 100;
  if (item.session_date) {
    const year = Number(item.session_date.slice(0, 4));
    if (year >= new Date().getFullYear() - 2) score += 10;
  }
  return score;
}

function itemToRow(item: FiqhCouncilItem): FiqhGlobalSearchRow {
  const kind = item.type as FiqhGlobalSearchRow["kind"];
  return {
    id: item.slug,
    slug: item.slug,
    title: item.title,
    href: fiqhItemHref(item.slug),
    kind,
    kindLabel: FIQH_ITEM_TYPE_LABELS[item.type],
    category: item.category,
    searchMeta: [FIQH_ITEM_TYPE_LABELS[item.type], item.category, item.session_date].filter(Boolean).join(" · "),
    verified: isOfficialSourceVerified(item),
    score: scoreItem(item, item.rank || 0),
    session_date: item.session_date,
  };
}

function issueToRow(issue: FiqhCouncilIssue): FiqhGlobalSearchRow {
  return {
    id: issue.slug,
    slug: issue.slug,
    title: issue.title,
    href: fiqhIssueHref(issue.slug),
    kind: "issue",
    kindLabel: "مسألة فقهية",
    category: issue.category,
    searchMeta: [issue.category, issue.ruling_summary?.slice(0, 60)].filter(Boolean).join(" · "),
    verified: issue.documentation_level === "official_verified",
    score: 40,
  };
}

const KIND_ORDER: Record<FiqhGlobalSearchRow["kind"], number> = {
  resolution: 1,
  fatwa: 2,
  recommendation: 3,
  issue: 4,
  nawazil: 5,
  research: 6,
  ruling: 7,
};

export async function searchFiqhCouncilForGlobal(query: string, limit = 12) {
  const q = query.trim();
  if (!q) return { rows: [] as FiqhGlobalSearchRow[], isFiqhQuery: false };

  const isFiqhQuery = isFiqhRelatedQuery(q);

  const [{ data: items }, { data: issues }] = await Promise.all([
    advancedSearchFiqhCouncil({ query: q, limit: limit + 8 }),
    getFiqhIssues({ limit: 6 }),
  ]);

  const verifiedItems = items.filter(isVerifiedPublicItem);
  const matchedIssues = issues.filter((issue) =>
    arabicMatchAny([issue.title, issue.summary, issue.category, issue.ruling_summary], q),
  );

  const rows: FiqhGlobalSearchRow[] = [
    ...verifiedItems.map(itemToRow),
    ...matchedIssues.map(issueToRow),
  ];

  const seen = new Set<string>();
  const deduped = rows
    .filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    })
    .sort((a, b) => {
      const kindDiff = (KIND_ORDER[a.kind] || 9) - (KIND_ORDER[b.kind] || 9);
      if (kindDiff !== 0 && isFiqhQuery) return kindDiff;
      return b.score - a.score;
    })
    .slice(0, limit);

  return { rows: deduped, isFiqhQuery };
}

/** دمج نتائج RPC مع نتائج المجمع المحسّنة */
export function mergeFiqhSearchResults(
  rpcRows: Array<{ id: string; slug?: string; title: string; category?: string; searchMeta?: string }>,
  boosted: FiqhGlobalSearchRow[],
) {
  const map = new Map<string, FiqhGlobalSearchRow>();

  for (const row of boosted) {
    map.set(row.id, row);
  }

  for (const r of rpcRows) {
    const id = r.slug || r.id;
    if (!map.has(id)) {
      map.set(id, {
        id,
        slug: id,
        title: r.title,
        href: fiqhItemHref(id),
        kind: "resolution",
        kindLabel: "قرار",
        category: r.category,
        searchMeta: r.searchMeta || r.category,
        verified: false,
        score: 0,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.score - a.score);
}
