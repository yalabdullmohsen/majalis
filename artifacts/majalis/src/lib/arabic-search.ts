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

/** Remove tashkeel and normalize Arabic letters for fuzzy matching. */
export function normalizeArabic(text: string): string {
  return (text || "")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function arabicIncludes(haystack: string | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  if (!haystack) return false;

  const hayVariants = expandArabicVariants(normalizeArabic(haystack));
  const needleVariants = expandArabicVariants(normalizeArabic(needle));

  return hayVariants.some((h) =>
    needleVariants.some((n) => n.length > 0 && h.includes(n))
  );
}

export function arabicMatchAny(
  fields: Array<string | null | undefined>,
  needle: string
): boolean {
  return fields.some((f) => arabicIncludes(f ?? "", needle));
}

/** Build ilike patterns that tolerate common hamza variants in Arabic. */
export function arabicSearchPatterns(term: string): string[] {
  const base = term.trim();
  if (!base) return [];

  const variants = new Set<string>([base]);
  const hamzaMap: Record<string, string[]> = {
    ا: ["أ", "إ", "آ", "ٱ"],
    و: ["ؤ"],
    ي: ["ئ", "ى"],
    ه: ["ة"],
  };

  for (const [plain, forms] of Object.entries(hamzaMap)) {
    for (const form of forms) {
      if (base.includes(form)) {
        variants.add(base.split(form).join(plain));
      }
      if (base.includes(plain)) {
        for (const f of forms) variants.add(base.split(plain).join(f));
      }
    }
  }

  return [...variants].filter(Boolean);
}

export function ilikePattern(term: string): string {
  return `%${term.trim()}%`;
}
