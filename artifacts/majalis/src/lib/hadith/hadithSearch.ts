/**
 * بحث الأحاديث — متن، مصدر، تصنيف.
 */
import { normalizeArabic } from "@/lib/arabic-search";
import {
  extractDisplayMatn,
  hadithNumberMatches,
  type HadithSearchScope,
} from "@/lib/hadith-access";
import type { HadithRecord } from "./hadithNormalize";

export type HadithSearchIndexRow = {
  id: string;
  matn: string;
  takhrij: string;
  full: string;
  categoryHay: string;
  item: HadithRecord;
};

export function buildHadithSearchIndex(
  items: HadithRecord[],
  collectionLabel?: (key: string | null) => string,
): HadithSearchIndexRow[] {
  const label = collectionLabel ?? ((k: string | null) => k ?? "");
  return items.map((h) => {
    const matn = normalizeArabic(
      [extractDisplayMatn(h.title, h.text), h.title].filter(Boolean).join(" "),
    );
    const takhrij = normalizeArabic(
      [
        h.source_name,
        h.explanation,
        String(h.metadata?.takhrij ?? ""),
        h.grade,
        h.chapter,
        h.hadith_number,
        h.collection ? label(h.collection) : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
    const full = normalizeArabic(
      [
        h.text,
        extractDisplayMatn(h.title, h.text),
        h.title,
        h.narrator,
        h.source_name,
        h.explanation,
        h.chapter,
        ...(h.keywords ?? []),
      ]
        .filter(Boolean)
        .join(" "),
    );
    const categoryHay = normalizeArabic(
      [...(h.keywords ?? []), h.chapter, h.title, extractDisplayMatn(h.title, h.text), h.text]
        .filter(Boolean)
        .join(" "),
    );
    return { id: h.id, matn, takhrij, full, categoryHay, item: h };
  });
}

export function searchHadithIndex(
  index: HadithSearchIndexRow[],
  query: string,
  scope: HadithSearchScope = "matn",
): HadithRecord[] {
  const q = normalizeArabic(query.trim());
  if (!q) return index.map((r) => r.item);
  return index
    .filter((r) => {
      const h = r.item;
      if (scope === "matn") return r.matn.includes(q);
      if (scope === "number") {
        return (
          hadithNumberMatches(h.hadith_number, query) ||
          hadithNumberMatches(String(h.metadata?.book ?? ""), query) ||
          hadithNumberMatches(String(h.metadata?.in_book ?? ""), query)
        );
      }
      if (scope === "takhrij") return r.takhrij.includes(q);
      return r.full.includes(q);
    })
    .map((r) => r.item);
}

export function filterHadithByCategoryHay(
  index: HadithSearchIndexRow[],
  keys: string[],
): HadithRecord[] {
  if (!keys.length) return index.map((r) => r.item);
  const normalized = keys.map((k) => normalizeArabic(k)).filter(Boolean);
  return index
    .filter((r) => normalized.some((k) => r.categoryHay.includes(k)))
    .map((r) => r.item);
}
