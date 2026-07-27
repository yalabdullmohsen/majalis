/**
 * فهرسة وصول الأحاديث: حرف عربي أول، رقم الحديث، ترتيب.
 * لا يغيّر النص؛ للاكتشاف فقط.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";

/** أبجدية عربية للفهرس (بدون همزات منفصلة تُدمج مع الألف). */
export const ARABIC_LETTER_INDEX = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز",
  "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق",
  "ك", "ل", "م", "ن", "ه", "و", "ي",
] as const;

export type ArabicIndexLetter = (typeof ARABIC_LETTER_INDEX)[number];

function foldLetter(ch: string): ArabicIndexLetter | null {
  if (!ch) return null;
  const c = ch[0];
  if ("اأإآٱ".includes(c)) return "ا";
  if (c === "ة") return "ه";
  if (c === "ى") return "ي";
  if (c === "ؤ") return "و";
  if (c === "ئ") return "ي";
  if ((ARABIC_LETTER_INDEX as readonly string[]).includes(c)) {
    return c as ArabicIndexLetter;
  }
  return null;
}

/** يستخرج أقرب نص للمتن (عنوان / مقتبس / بعد قال|يقول). */
export function extractMatnHint(title: string | null | undefined, text: string | null | undefined): string {
  const tTitle = normalizeArabic(title || "").trim();
  if (tTitle) return tTitle;

  const raw = String(text || "");
  const quoted = raw.match(/[«"\"]\s*([^«»"\"]{4,})/);
  if (quoted?.[1]) return normalizeArabic(quoted[1]).trim();

  const norm = normalizeArabic(raw);
  const afterQal = norm.split(/يقول\s*:|قال\s*:|قالت\s*:/).pop();
  if (afterQal && afterQal !== norm && afterQal.trim().length >= 4) {
    return afterQal.trim().replace(/^["«»\s]+/, "");
  }
  return norm.trim();
}

/** أول حرف فهرسي من العنوان أو متن الحديث. */
export function hadithIndexLetter(
  title: string | null | undefined,
  text: string | null | undefined,
): ArabicIndexLetter | null {
  const hint = extractMatnHint(title, text);
  // تجاوز أدوات شائعة في أول المتن
  const cleaned = hint.replace(/^(ان|انما|انّ|الا|اما|من|في|على|عن|ما|لا|لم|لن|قد|كل|هذا|هذه|ذلك)\s+/, "");
  return foldLetter(cleaned || hint);
}

/** هل يظهر الحرف كبداية كلمة في العنوان/المتن؟ (وصول أوسع من حرف الفهرس فقط) */
export function hadithMatchesLetter(
  title: string | null | undefined,
  text: string | null | undefined,
  letter: string,
): boolean {
  const folded = foldLetter(normalizeArabic(letter));
  if (!folded) return true;
  if (hadithIndexLetter(title, text) === folded) return true;
  const blob = `${normalizeArabic(title || "")} ${normalizeArabic(text || "")}`;
  const words = blob.split(/\s+/).filter(Boolean);
  return words.some((w) => foldLetter(w.replace(/^ال/, "")) === folded);
}

/** توحيد الأرقام العربية/الهندية/الغربية إلى ASCII. */
export function normalizeHadithDigits(input: string): string {
  const map: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  };
  return input.replace(/[٠-٩۰-۹]/g, (d) => map[d] ?? d).replace(/[^\d]/g, "");
}

export function hadithNumberMatches(
  hadithNumber: string | null | undefined,
  query: string,
): boolean {
  const q = normalizeHadithDigits(query);
  if (!q) return true;
  const n = normalizeHadithDigits(String(hadithNumber ?? ""));
  if (!n) return false;
  return n === q || n.startsWith(q);
}

export type HadithSortMode = "number" | "letter" | "default";

export function compareHadithAccess(
  a: { hadith_number: string | null; title: string | null; text: string },
  b: { hadith_number: string | null; title: string | null; text: string },
  mode: HadithSortMode,
): number {
  if (mode === "number") {
    const na = Number(normalizeHadithDigits(a.hadith_number || "")) || Number.MAX_SAFE_INTEGER;
    const nb = Number(normalizeHadithDigits(b.hadith_number || "")) || Number.MAX_SAFE_INTEGER;
    if (na !== nb) return na - nb;
  }
  if (mode === "letter" || mode === "number") {
    const la = hadithIndexLetter(a.title, a.text) || "ي";
    const lb = hadithIndexLetter(b.title, b.text) || "ي";
    const ia = ARABIC_LETTER_INDEX.indexOf(la as ArabicIndexLetter);
    const ib = ARABIC_LETTER_INDEX.indexOf(lb as ArabicIndexLetter);
    if (ia !== ib) return ia - ib;
  }
  return 0;
}
