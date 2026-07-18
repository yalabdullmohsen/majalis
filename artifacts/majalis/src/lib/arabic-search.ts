/**
 * arabic-search.ts
 * وحدة البحث العربي — تعتمد على @/shared/arabic-normalize كقاعدة مشتركة.
 *
 * ⚠️ normalizeArabic() مُعاد تصديرها من الوحدة المشتركة للتوافق الخلفي.
 *    كل الاستخدامات الجديدة تستورد مباشرةً من @/shared/arabic-normalize.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";
import { expandSearchTerms } from "@/lib/search-synonyms";

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

export function arabicIncludes(haystack: string | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  if (!haystack) return false;

  const hayVariants = expandArabicVariants(normalizeArabic(haystack));
  const needles = expandSearchTerms(needle);

  return hayVariants.some((h) =>
    needles.some((raw) => {
      const needleVariants = expandArabicVariants(normalizeArabic(raw));
      return needleVariants.some((n) => n.length > 0 && (h.includes(n) || fuzzyWordIncludes(h, n)));
    }),
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

  const variants = new Set<string>();
  for (const expanded of expandSearchTerms(base)) {
    variants.add(expanded);
    // نضمن دومًا وجود الصيغة المطبَّعة الكاملة (بلا تشكيل) بين الأنماط —
    // وإلا فاستدعاء هذه الدالة على نص لم يُطبَّع مسبقًا (كمصطلح فيه شدة، مثل
    // "مصلّى") ينتج أنماطًا لا تلتقي أبدًا مع نتيجة استدعائها على "مصلي"
    // المطبَّعة، فيفشل البحث الفعلي بين الصيغتين رغم أنهما نفس الكلمة.
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
