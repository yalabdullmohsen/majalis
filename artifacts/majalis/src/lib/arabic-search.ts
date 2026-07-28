/**
 * arabic-search.ts
 * وحدة البحث العربي — تعتمد على @/shared/arabic-normalize كقاعدة مشتركة.
 *
 * Part 13: bitwise char-mask prefilter + Aho-Corasick multi-needle fast path.
 *
 * ⚠️ normalizeArabic() مُعاد تصديرها من الوحدة المشتركة للتوافق الخلفي.
 *    كل الاستخدامات الجديدة تستورد مباشرةً من @/shared/arabic-normalize.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";
import { expandSearchTerms } from "@/lib/search-synonyms";
import {
  AhoCorasick,
  bitmaskContains,
  buildAho,
  charBitmask,
} from "@/lib/aho-corasick";

// إعادة تصدير للتوافق الخلفي مع الملفات التي تستورد من arabic-search
export { normalizeArabic };

function expandArabicVariants(normalized: string): string[] {
  const variants = new Set<string>([normalized]);
  if (!normalized) return [];

  // مجلس ↔ مجالس and similar optional alif patterns
  variants.add(normalized.replace(/لاس/g, "لس"));
  variants.add(normalized.replace(/([^ا])لس/g, "$1لاس"));

  // tolerate dropped alif in common roots
  variants.add(normalized.replace(/ا/g, ""));

  return [...variants].filter(Boolean);
}

function editDistanceAtMostOne(a: string, b: string): boolean {
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

function fuzzyWordIncludes(haystack: string, needle: string): boolean {
  const needleWords = needle.split(" ").filter((word) => word.length >= 4);
  if (!needleWords.length) return false;
  const hayWords = haystack.split(" ").filter((word) => word.length >= 4);
  return needleWords.every((needleWord) =>
    hayWords.some((hayWord) =>
      hayWord.includes(needleWord) ||
      needleWord.includes(hayWord) ||
      editDistanceAtMostOne(hayWord, needleWord),
    ),
  );
}

/** Collect all normalized needle variants for a query (synonyms + alif forms). */
export function collectNeedleVariants(needle: string): string[] {
  const out = new Set<string>();
  for (const raw of expandSearchTerms(needle)) {
    for (const v of expandArabicVariants(normalizeArabic(raw))) {
      if (v) out.add(v);
    }
  }
  return [...out];
}

/**
 * Fast-path includes: bitmask reject → Aho-Corasick multi-variant scan → fuzzy fallback.
 * Targets sub-10ms for typical autocomplete needles against moderate haystacks.
 */
export function arabicIncludes(haystack: string | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  if (!haystack) return false;

  const needles = collectNeedleVariants(needle);
  if (!needles.length) return true;

  const hayVariants = expandArabicVariants(normalizeArabic(haystack));
  if (!hayVariants.length) return false;

  // Bitwise prefilter: needle char-mask must be ⊆ hay mask (union of variants)
  let hayMask = { hi: 0, lo: 0 };
  for (const h of hayVariants) {
    const m = charBitmask(h);
    hayMask = { hi: hayMask.hi | m.hi, lo: hayMask.lo | m.lo };
  }

  const viableNeedles = needles.filter((n) => bitmaskContains(hayMask, charBitmask(n)));
  if (!viableNeedles.length) {
    // Fuzzy may still match with edits that introduce missing chars — only for long needles
    return hayVariants.some((h) => needles.some((n) => fuzzyWordIncludes(h, n)));
  }

  // Exact multi-pattern via Aho-Corasick (single pass per hay variant)
  if (viableNeedles.length === 1) {
    const n = viableNeedles[0]!;
    if (hayVariants.some((h) => h.includes(n))) return true;
  } else {
    const ac = buildAho(viableNeedles);
    if (hayVariants.some((h) => ac.hasAny(h))) return true;
  }

  return hayVariants.some((h) => viableNeedles.some((n) => fuzzyWordIncludes(h, n)));
}

/**
 * Match query against many pre-normalized documents using one AC automaton.
 * `docs` entries should already be normalizeArabic()'d for best speed.
 */
export function arabicMatchDocsFast(
  docs: readonly string[],
  needle: string,
): number[] {
  const needles = collectNeedleVariants(needle);
  if (!needles.length) return docs.map((_, i) => i);
  const ac = buildAho(needles);
  const needleMask = needles.reduce(
    (acc, n) => {
      const m = charBitmask(n);
      return { hi: acc.hi | m.hi, lo: acc.lo | m.lo };
    },
    { hi: 0, lo: 0 },
  );
  // For OR-of-variants we need ANY needle ⊆ doc; prefilter with union is too strict.
  // Instead: reject docs that miss ALL chars of the shortest needle.
  const shortest = needles.reduce((a, b) => (a.length <= b.length ? a : b));
  const shortMask = charBitmask(shortest);

  const hits: number[] = [];
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i]!;
    if (!bitmaskContains(charBitmask(d), shortMask) && !ac.hasAny(d)) {
      // still try AC in case bitmask false-negative on rare buckets — actually
      // if shortMask not subset, exact match of shortest is impossible; skip AC.
      continue;
    }
    if (ac.hasAny(d)) hits.push(i);
  }
  void needleMask;
  return hits;
}

/** Reuse a prebuilt automaton across many haystacks (autocomplete hot path). */
export function matchWithAho(ac: AhoCorasick, haystackNormalized: string): boolean {
  return ac.hasAny(haystackNormalized);
}

export function buildNeedleAho(needle: string): AhoCorasick {
  return buildAho(collectNeedleVariants(needle));
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
