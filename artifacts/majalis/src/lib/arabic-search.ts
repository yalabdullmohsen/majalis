/**
 * arabic-search.ts — Arabic search facade over pure arabic-match-core.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";
import { expandSearchTerms } from "@/lib/search-synonyms";
import {
  coreArabicIncludes,
  expandArabicVariants,
  prepareNeedleVariants,
} from "@/lib/arabic-match-core";

export { normalizeArabic };

export function arabicIncludes(haystack: string | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  if (!haystack) return false;
  const needles = expandSearchTerms(needle);
  return coreArabicIncludes(haystack, prepareNeedleVariants(needles));
}

export function arabicMatchAny(
  fields: Array<string | null | undefined>,
  needle: string,
): boolean {
  return fields.some((f) => arabicIncludes(f ?? "", needle));
}

/** Build ilike patterns that tolerate common hamza variants in Arabic. */
export function arabicSearchPatterns(term: string): string[] {
  const base = term.trim();
  if (!base) return [];

  const variants = new Set<string>();
  for (const expanded of expandSearchTerms(base)) {
    variants.add(expanded);
    variants.add(normalizeArabic(expanded));
    const hamzaMap: Record<string, string[]> = {
      ا: ["أ", "إ", "آ", "ٱ"],
      و: ["ؤ"],
      ي: ["ئ", "ى"],
      ه: ["ة"],
    };

    for (const [plain, forms] of Object.entries(hamzaMap)) {
      for (const form of forms) {
        if (expanded.includes(form)) {
          variants.add(expanded.split(form).join(plain));
        }
        if (expanded.includes(plain)) {
          for (const f of forms) variants.add(expanded.split(plain).join(f));
        }
      }
    }
  }

  return [...variants].filter(Boolean);
}

export function ilikePattern(term: string): string {
  return `%${term.trim()}%`;
}

/** Expose variants helper for advanced callers / tests. */
export { expandArabicVariants };
