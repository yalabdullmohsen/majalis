/**
 * قاموس نطق عربي لسُنّة — يغيّر طبقة النطق فقط، لا النص المعروض.
 * version: lexicon-v1
 */

export const PRONUNCIATION_LEXICON_VERSION = "lexicon-v1";

export type LexiconEntry = {
  term: string;
  normalizedTerm: string;
  pronunciation: string;
  locale: "ar-SA";
  context: "prophet" | "companion" | "scholar" | "book" | "surah" | "city" | "nation" | "term" | "honorific" | "other";
  source: string;
  version: string;
  verifiedAt: string;
};

const V = PRONUNCIATION_LEXICON_VERSION;
const VERIFIED = "2026-09-13";

function entry(
  term: string,
  pronunciation: string,
  context: LexiconEntry["context"],
  source = "sunnah-editorial",
): LexiconEntry {
  return {
    term,
    normalizedTerm: term.replace(/\s+/g, " ").trim(),
    pronunciation,
    locale: "ar-SA",
    context,
    source,
    version: V,
    verifiedAt: VERIFIED,
  };
}

/** إدخالات معتمدة — لا تُعاد كتابتها في العرض. */
export const ARABIC_PRONUNCIATION_LEXICON: readonly LexiconEntry[] = [
  entry("ﷺ", "صلى الله عليه وسلم", "honorific"),
  entry("عليه السلام", "عليه السلام", "honorific"),
  entry("عليهم السلام", "عليهم السلام", "honorific"),
  entry("رضي الله عنه", "رضي الله عنه", "honorific"),
  entry("رضي الله عنها", "رضي الله عنها", "honorific"),
  entry("آدم", "آدم", "prophet"),
  entry("إدريس", "إدريس", "prophet"),
  entry("نوح", "نوح", "prophet"),
  entry("هود", "هود", "prophet"),
  entry("صالح", "صالح", "prophet"),
  entry("إبراهيم", "إبراهيم", "prophet"),
  entry("لوط", "لوط", "prophet"),
  entry("إسماعيل", "إسماعيل", "prophet"),
  entry("إسحاق", "إسْحاق", "prophet"),
  entry("يعقوب", "يعقوب", "prophet"),
  entry("يوسف", "يوسف", "prophet"),
  entry("أيوب", "أيّوب", "prophet"),
  entry("شعيب", "شُعيب", "prophet"),
  entry("موسى", "موسى", "prophet"),
  entry("هارون", "هارون", "prophet"),
  entry("داود", "داوود", "prophet"),
  entry("سليمان", "سليمان", "prophet"),
  entry("يونس", "يونس", "prophet"),
  entry("زكريا", "زكَريّا", "prophet"),
  entry("يحيى", "يحيى", "prophet"),
  entry("عيسى", "عيسى", "prophet"),
  entry("محمد", "محمّد", "prophet"),
  entry("ذو الكفل", "ذو الكِفل", "prophet"),
  entry("إلياس", "إلياس", "prophet"),
  entry("اليسع", "اليَسَع", "prophet"),
  entry("أولو العزم", "أولو العزم", "term"),
  entry("البخاري", "البُخاري", "book"),
  entry("مسلم", "مسلم", "book"),
  entry("مكة", "مكّة", "city"),
  entry("المدينة", "المدينة", "city"),
  entry("بيت المقدس", "بيت المَقدِس", "city"),
  entry("فرعون", "فِرعون", "nation"),
  entry("ثمود", "ثمود", "nation"),
  entry("عاد", "عاد", "nation"),
  entry("بنو إسرائيل", "بنو إسرائيل", "nation"),
] as const;

/** يطبّق النطق على نص مُرسل للصوت فقط — لا يُستخدم للعرض. */
export function applyPronunciationLexicon(speakText: string): string {
  let out = speakText;
  const sorted = [...ARABIC_PRONUNCIATION_LEXICON].sort(
    (a, b) => b.normalizedTerm.length - a.normalizedTerm.length,
  );
  for (const e of sorted) {
    if (e.term === e.pronunciation) continue;
    out = out.split(e.term).join(e.pronunciation);
  }
  return out;
}

export function lexiconWordCount(): number {
  return ARABIC_PRONUNCIATION_LEXICON.length;
}
