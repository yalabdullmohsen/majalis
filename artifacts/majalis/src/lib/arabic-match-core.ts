/**
 * Pure Arabic match primitives — safe to import from main thread AND Web Workers.
 * No DOM / LocalStorage / React dependencies.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";

export function expandArabicVariants(normalized: string): string[] {
  const variants = new Set<string>([normalized]);
  if (!normalized) return [];
  variants.add(normalized.replace(/لاس/g, "لس"));
  variants.add(normalized.replace(/([^ا])لس/g, "$1لاس"));
  variants.add(normalized.replace(/ا/g, ""));
  return [...variants].filter(Boolean);
}

export function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export function fuzzyWordIncludes(haystack: string, needle: string): boolean {
  const needleWords = needle.split(" ").filter((word) => word.length >= 4);
  if (!needleWords.length) return false;
  const hayWords = haystack.split(" ").filter((word) => word.length >= 4);
  return needleWords.every((needleWord) =>
    hayWords.some(
      (hayWord) =>
        hayWord.includes(needleWord) ||
        needleWord.includes(hayWord) ||
        editDistanceAtMostOne(hayWord, needleWord),
    ),
  );
}

/** Match needle against haystack using pre-expanded needle variants (already normalized). */
export function coreArabicIncludes(
  haystack: string | null | undefined,
  needleVariants: string[],
): boolean {
  if (!needleVariants.length) return true;
  if (!haystack) return false;
  const hayVariants = expandArabicVariants(normalizeArabic(haystack));
  return hayVariants.some((h) =>
    needleVariants.some((n) => n.length > 0 && (h.includes(n) || fuzzyWordIncludes(h, n))),
  );
}

export function prepareNeedleVariants(rawNeedles: string[]): string[] {
  const out = new Set<string>();
  for (const raw of rawNeedles) {
    for (const v of expandArabicVariants(normalizeArabic(raw))) {
      if (v) out.add(v);
    }
  }
  return [...out];
}

export type MatchDoc = {
  id: string;
  fields: string[];
};

/** Filter documents whose any field matches needle variants. Pure / worker-safe. */
export function filterDocsByNeedle(
  docs: MatchDoc[],
  needleVariants: string[],
): string[] {
  if (!needleVariants.length) return docs.map((d) => d.id);
  const hits: string[] = [];
  for (const doc of docs) {
    if (doc.fields.some((f) => coreArabicIncludes(f, needleVariants))) {
      hits.push(doc.id);
    }
  }
  return hits;
}

/** Aggregate numeric day metrics off-thread. */
export function aggregateDayMetrics(
  days: Array<{ tasksCompleted: number; tasksTotal: number; pagesRead: number; active: boolean }>,
): { completionRate: number; totalPages: number; activeDays: number } {
  let slots = 0;
  let done = 0;
  let totalPages = 0;
  let activeDays = 0;
  for (const d of days) {
    slots += d.tasksTotal;
    done += d.tasksCompleted;
    totalPages += d.pagesRead;
    if (d.active) activeDays += 1;
  }
  return {
    completionRate: slots > 0 ? done / slots : 0,
    totalPages,
    activeDays,
  };
}
