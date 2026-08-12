/**
 * arabic-search.ts
 * وحدة البحث العربي — تعتمد على @/shared/arabic-normalize كقاعدة مشتركة.
 *
 * ⚠️ normalizeArabic() مُعاد تصديرها من الوحدة المشتركة للتوافق الخلفي.
 *    كل الاستخدامات الجديدة تستورد مباشرةً من @/shared/arabic-normalize.
 */
import { normalizeArabic, normalizeArabicUtf8Copy } from "@/shared/arabic-normalize";
import { expandSearchTerms } from "@/lib/search-synonyms";
import { tolerantIncludes } from "@/features/search/tolerant-match";

// إعادة تصدير للتوافق الخلفي مع الملفات التي تستورد من arabic-search
export { normalizeArabic };

/**
 * Part 22: stable UTF-8 fingerprint for search index keys (shared TextEncoder).
 * Hex of first 16 bytes of normalized UTF-8 — cheap identity for large corpora.
 */
export function arabicIndexFingerprint(text: string): string {
  const bytes = normalizeArabicUtf8Copy(text);
  const n = Math.min(16, bytes.length);
  let hex = "";
  for (let i = 0; i < n; i++) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return `${hex}:${bytes.length}`;
}

export function arabicIncludes(haystack: string | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  if (!haystack) return false;

  const needles = expandSearchTerms(needle);
  return needles.some((raw) => tolerantIncludes(haystack, raw));
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
