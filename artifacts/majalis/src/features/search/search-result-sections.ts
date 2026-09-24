/**
 * أقسام عرض نتائج البحث (هوية سُنّة) — تظهر فقط عند وجود نتائج.
 */
import type { AppSearchResult } from "@/features/search/app-search";

export type SearchResultSectionId =
  | "quran"
  | "tafsir"
  | "hadith"
  | "aqidah"
  | "fiqh"
  | "seerah"
  | "adhkar"
  | "lesson"
  | "research"
  | "history"
  | "prophets";

export const SEARCH_RESULT_SECTION_ORDER: SearchResultSectionId[] = [
  "quran",
  "tafsir",
  "hadith",
  "aqidah",
  "fiqh",
  "seerah",
  "adhkar",
  "lesson",
  "research",
  "history",
  "prophets",
];

export const SEARCH_RESULT_SECTION_LABELS: Record<SearchResultSectionId, string> = {
  quran: "القرآن",
  tafsir: "التفسير",
  hadith: "الحديث",
  aqidah: "العقيدة",
  fiqh: "الفقه",
  seerah: "السيرة",
  adhkar: "الأذكار",
  lesson: "الدروس",
  research: "البحوث",
  history: "التاريخ الإسلامي",
  prophets: "الأنبياء",
};

const KIND_TO_SECTION: Record<string, SearchResultSectionId> = {
  quran: "quran",
  surah: "quran",
  ayah: "quran",
  page: "quran",
  tajweed: "quran",
  hifz: "quran",
  ulum: "quran",
  tafsir: "tafsir",
  "tafsir-audio": "tafsir",
  hadith: "hadith",
  aqidah: "aqidah",
  tawhid: "aqidah",
  akhlaq: "aqidah",
  raqaiq: "aqidah",
  fiqh: "fiqh",
  fatwa: "fiqh",
  ruling: "fiqh",
  qa: "fiqh",
  seerah: "seerah",
  adhkar: "adhkar",
  dua: "adhkar",
  lesson: "lesson",
  lessons: "lesson",
  course: "lesson",
  courses: "lesson",
  research: "research",
  article: "research",
  history: "history",
  prophet: "prophets",
  prophets: "prophets",
  story: "prophets",
  nation: "prophets",
  nations: "prophets",
  person: "prophets",
  scholar: "history",
  sheikh: "history",
};

export function searchResultSectionForKind(kind: string): SearchResultSectionId | null {
  return KIND_TO_SECTION[kind] ?? null;
}

export type SearchResultSectionGroup = {
  id: SearchResultSectionId;
  label: string;
  items: AppSearchResult[];
};

/** يجمع النتائج في أقسام الهوية؛ يتجاهل الأنواع غير المعروضة في القائمة. */
export function groupSearchResultsBySection(
  results: AppSearchResult[],
): SearchResultSectionGroup[] {
  const buckets = new Map<SearchResultSectionId, AppSearchResult[]>();
  for (const item of results) {
    const section = searchResultSectionForKind(item.kind);
    if (!section) continue;
    const list = buckets.get(section);
    if (list) list.push(item);
    else buckets.set(section, [item]);
  }
  const out: SearchResultSectionGroup[] = [];
  for (const id of SEARCH_RESULT_SECTION_ORDER) {
    const items = buckets.get(id);
    if (!items?.length) continue;
    out.push({ id, label: SEARCH_RESULT_SECTION_LABELS[id], items });
  }
  return out;
}
