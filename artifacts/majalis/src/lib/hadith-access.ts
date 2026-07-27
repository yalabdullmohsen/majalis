/**
 * فهرسة وصول الأحاديث: حرف عربي أول، رقم الحديث، ترتيب، وفصل المتن عن السند.
 * لا يغيّر مصدر النص؛ للاكتشاف والعرض فقط.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";

/** أبجدية عربية للفهرس (بدون همزات منفصلة تُدمج مع الألف). */
export const ARABIC_LETTER_INDEX = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز",
  "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق",
  "ك", "ل", "م", "ن", "ه", "و", "ي",
] as const;

export type ArabicIndexLetter = (typeof ARABIC_LETTER_INDEX)[number];

export type HadithSearchScope = "matn" | "full" | "takhrij" | "number";

export type HadithNarrationParts = {
  /** متن الحديث للعرض الخارجي */
  matn: string;
  /** سند الرواية إن وُجد */
  isnad: string;
  hasIsnad: boolean;
};

const RLM = "\u200f";
const TASHKEEL_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

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

function cleanMatn(s: string): string {
  return s
    .replace(new RegExp(`^[\\s${RLM}:،,.\\-–—«»"'“”]+`, "u"), "")
    .replace(new RegExp(`[\\s${RLM}«»"'“”]+$`, "u"), "")
    .replace(/\s+/g, " ")
    .trim();
}

/** نص بلا تشكيل + طيّ همزات شائعة + خريطة فهرس→الأصل. */
function stripTashkeelMapped(raw: string): { plain: string; toRaw: number[] } {
  const toRaw: number[] = [];
  let plain = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (TASHKEEL_RE.test(ch)) {
      TASHKEEL_RE.lastIndex = 0;
      continue;
    }
    toRaw.push(i);
    if ("أإآٱ".includes(ch)) plain += "ا";
    else if (ch === "ة") plain += "ه";
    else if (ch === "ى") plain += "ي";
    else plain += ch;
  }
  toRaw.push(raw.length);
  return { plain, toRaw };
}

function looksLikeIsnad(s: string): boolean {
  const n = normalizeArabic(s);
  return /حدثنا|حدثني|اخبرنا|اخبرني|انبانا|سمعت|عن\s/.test(n) && n.length >= 18;
}

function looksLikeTransmissionTail(s: string): boolean {
  const n = normalizeArabic(s).trim();
  return /^(و)?(حدثنا|حدثني|اخبرنا|اخبرني|انبانا|انباني|سمعت)(?:\s|$|،)/.test(n);
}

function packParts(raw: string, matnStart: number, matnOverride?: string): HadithNarrationParts | null {
  if (matnStart < 8) return null;
  const matn = cleanMatn(matnOverride ?? raw.slice(matnStart));
  if (matn.length < 8) return null;
  const isnad = cleanMatn(raw.slice(0, matnStart));
  if (!looksLikeIsnad(isnad) && isnad.length < 20) return null;
  return { matn, isnad, hasIsnad: true };
}

/**
 * يفصل متن الحديث عن السند بأفضل ما تسمح به صيغة النص.
 * المطابقة تتم على نص بلا تشكيل ثم تُسقط الفهارس على الأصل.
 */
export function splitHadithNarration(fullText: string | null | undefined): HadithNarrationParts {
  const raw = String(fullText || "").trim();
  if (!raw) return { matn: "", isnad: "", hasIsnad: false };

  const { plain, toRaw } = stripTashkeelMapped(raw);
  const mapIdx = (plainIdx: number) => toRaw[Math.min(Math.max(plainIdx, 0), toRaw.length - 1)] ?? raw.length;

  // 1) تنصيص على الأصل ثم على النص بلا تشكيل (مع إسقاط الفهارس)
  const quoteRes: RegExp[] = [
    new RegExp(`${RLM}\\s*"${RLM}\\s*([\\s\\S]+?)\\s*${RLM}"${RLM}`),
    new RegExp(`${RLM}\\s*"${RLM}\\s*([\\s\\S]{8,})\\s*$`),
    /«\s*([\s\S]{8,}?)\s*»/,
    /"\s*([\s\S]{8,}?)\s*"/,
    /"\s*([\s\S]{8,})\s*$/,
    /“\s*([\s\S]{8,}?)\s*”/,
    /“\s*([\s\S]{8,})\s*$/,
  ];
  const tryQuote = (source: string, toSourceIdx: (i: number) => number): HadithNarrationParts | null => {
    for (const re of quoteRes) {
      const m = source.match(re);
      if (!m?.[1] || m.index == null) continue;
      const captureAt = m[0].indexOf(m[1]);
      if (captureAt < 0) continue;
      const matnStart = toSourceIdx(m.index + captureAt);
      const matnEnd = toSourceIdx(m.index + captureAt + m[1].length);
      const matn = cleanMatn(raw.slice(matnStart, matnEnd));
      if (matn.length < 8) continue;
      const isnad = cleanMatn(raw.slice(0, toSourceIdx(m.index)));
      if (looksLikeIsnad(isnad)) return { matn, isnad, hasIsnad: true };
      if (isnad.length < 12) return { matn, isnad: "", hasIsnad: false };
      return { matn, isnad, hasIsnad: isnad.length >= 18 };
    }
    return null;
  };
  const quoted = tryQuote(raw, (i) => i) || tryQuote(plain, mapIdx);
  if (quoted) return quoted;

  // 2) بعد صيغة البلاغ النبوي الصريحة (يقول/قال بعد ذكر النبي) — أول مطابقة بعد السند
  const speechRe =
    /(?:رسول\s+الل[هھ]|النبي)\s*(?:صلى\s*الل[هھ]\s*عليه\s*وسلم|صل[ىي]\s*الل[هھ]\s*عليه\s*وسلم|ﷺ)?\s*[,،]?\s*(?:يقول|قال|قالت)\s*[:：]?\s*/gi;
  const speechMatch = speechRe.exec(plain);
  if (speechMatch && speechMatch.index != null) {
    const afterPlain = speechMatch.index + speechMatch[0].length;
    const afterIdx = mapIdx(afterPlain);
    let after = cleanMatn(raw.slice(afterIdx));
    const inner = after.match(new RegExp(`[«"“${RLM}]\\s*([\\s\\S]{8,}?)\\s*[»"”${RLM}]?`));
    if (inner?.[1] && inner[1].length >= 8) after = cleanMatn(inner[1]);
    if (after.length >= 8) {
      const packed = packParts(raw, afterIdx, after);
      if (packed) return packed;
      return { matn: after, isnad: "", hasIsnad: false };
    }
  }

  // 3) انتقالات سند→متن — نختار أبكر انتقال صالح بعد سند كافٍ
  const transitionSpecs: Array<{ re: RegExp; matnFrom: "after" | "match" }> = [
    {
      re: /عن\s+[^،.\n]{2,80}،\s*قال(?:ت)?\s+(?!حدثنا|حدثني|اخبرنا|اخبرني|انبانا)/gi,
      matnFrom: "after",
    },
    {
      re: /عن\s+[^،.\n]{2,80}،\s*(?=(?<![\u0621-\u064A])[اأإآ]نّ?\s+)/gi,
      matnFrom: "after",
    },
    {
      re: /(?<![\u0621-\u064A])[اأإآ]نّ?\s+(?:النبي|رسول\s+الل)/gi,
      matnFrom: "match",
    },
    {
      re: /(?<![\u0621-\u064A])[اأإآ]نّ?\s+(?:رجلا|رجل|امراه|امراة|ابا|ام)(?:\s|،|$)/gi,
      matnFrom: "match",
    },
  ];
  let best: HadithNarrationParts | null = null;
  let bestStart = Number.POSITIVE_INFINITY;
  for (const { re, matnFrom } of transitionSpecs) {
    re.lastIndex = 0;
    let tm: RegExpExecArray | null;
    while ((tm = re.exec(plain)) !== null) {
      const plainStart = matnFrom === "after" ? tm.index + tm[0].length : tm.index;
      if (plainStart >= bestStart) continue;
      const packed = packParts(raw, mapIdx(plainStart));
      if (packed && packed.matn.length >= 12 && packed.isnad.length >= 24) {
        best = packed;
        bestStart = plainStart;
      }
    }
  }
  if (best) return best;

  // 4) أول «قال/يقول/قالت» غير المتبوع بتحديث بعد سلسلة إسناد
  if (looksLikeIsnad(raw)) {
    const qalaRe = /(?:يقول|قال|قالت)\s*[:：]?\s+/gi;
    let qm: RegExpExecArray | null;
    while ((qm = qalaRe.exec(plain)) !== null) {
      const afterPlain = plain.slice(qm.index + qm[0].length);
      if (looksLikeTransmissionTail(afterPlain)) continue;
      const packed = packParts(raw, mapIdx(qm.index + qm[0].length));
      if (packed && packed.matn.length >= 12) return packed;
    }
  }

  return { matn: cleanMatn(raw), isnad: "", hasIsnad: false };
}

/** متن للعرض الخارجي (بطاقة/قائمة) — بلا سند. */
export function extractDisplayMatn(
  title: string | null | undefined,
  text: string | null | undefined,
): string {
  const { matn } = splitHadithNarration(text);
  if (matn) return matn;
  const tTitle = normalizeArabic(title || "").trim();
  return tTitle || cleanMatn(String(text || ""));
}

/** يستخرج أقرب نص للمتن (عنوان / مقتبس / بعد قال|يقول) — للفهرسة بالحرف. */
export function extractMatnHint(title: string | null | undefined, text: string | null | undefined): string {
  const tTitle = normalizeArabic(title || "").trim();
  if (tTitle) return tTitle;
  return normalizeArabic(extractDisplayMatn(null, text)).trim();
}

/** أول حرف فهرسي من العنوان أو متن الحديث. */
export function hadithIndexLetter(
  title: string | null | undefined,
  text: string | null | undefined,
): ArabicIndexLetter | null {
  const hint = extractMatnHint(title, text);
  const cleaned = hint.replace(/^(ان|انما|انّ|الا|اما|من|في|على|عن|ما|لا|لم|لن|قد|كل|هذا|هذه|ذلك)\s+/, "");
  return foldLetter(cleaned || hint);
}

/** هل يظهر الحرف كبداية كلمة في العنوان/المتن؟ */
export function hadithMatchesLetter(
  title: string | null | undefined,
  text: string | null | undefined,
  letter: string,
): boolean {
  const folded = foldLetter(normalizeArabic(letter));
  if (!folded) return true;
  if (hadithIndexLetter(title, text) === folded) return true;
  const matn = extractDisplayMatn(title, text);
  const blob = `${normalizeArabic(title || "")} ${normalizeArabic(matn)}`;
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

/** مفتاح دمج التخريج المنسّق مع صف الصحيحين. */
export function hadithCorpusKey(
  collection: string | null | undefined,
  hadithNumber: string | null | undefined,
): string | null {
  if (!collection || !hadithNumber) return null;
  const n = normalizeHadithDigits(hadithNumber);
  if (!n) return null;
  if (collection !== "bukhari" && collection !== "muslim") return null;
  return `${collection}|${n}`;
}
