/**
 * Compact local dictionary for غريب القرآن — rare Quranic vocabulary.
 * Offline-first lookup with Arabic normalization (no network required).
 */

import { normalizeArabic } from "@/shared/arabic-normalize";

export type GhareebEntry = {
  id: string;
  word: string;
  /** Alternate surface forms */
  aliases?: string[];
  meaning: string;
  /** Optional example ayah reference */
  exampleRef?: string;
  root?: string;
};

/** Curated starter lexicon — extendable without UI changes. */
export const GHAREEB_QURAN_ENTRIES: GhareebEntry[] = [
  { id: "ababil", word: "أبابيل", meaning: "جماعات متفرقة متتابعة", exampleRef: "105:3", root: "أبل" },
  { id: "sijjeel", word: "سجيل", meaning: "حجارة من طين متحجّر", exampleRef: "105:4", root: "سجل" },
  { id: "kafoor", word: "كافور", meaning: "مزيج طيّب يُضاف للشراب", exampleRef: "76:5" },
  { id: "zanjabeel", word: "زنجبيل", meaning: "شراب ممزوج بالزنجبيل", exampleRef: "76:17" },
  { id: "ghislain", word: "غسلين", meaning: "صديد أهل النار", exampleRef: "69:36" },
  { id: "sijjin", word: "سجين", meaning: "كتاب أعمال الفجار / مكان سافل", exampleRef: "83:7" },
  { id: "illiyyeen", word: "عليين", meaning: "كتاب أعمال الأبرار / مكان عالٍ", exampleRef: "83:18" },
  { id: "tasnim", word: "تسنيم", meaning: "عين في الجنة يشرب بها المقرّبون", exampleRef: "83:27" },
  { id: "saqar", word: "سقر", meaning: "اسم من أسماء النار", exampleRef: "54:48" },
  { id: "laza", word: "لظى", meaning: "نار تتلظّى / اسم من أسماء جهنم", exampleRef: "70:15" },
  { id: "hutamah", word: "الحطمة", meaning: "النار التي تحطم ما يُلقى فيها", exampleRef: "104:4" },
  { id: "alqariah", word: "القارعة", meaning: "القيامة التي تقرع القلوب", exampleRef: "101:1" },
  { id: "ghasaq", word: "غسق", meaning: "شدة ظلمة الليل", exampleRef: "17:78", root: "غسق" },
  { id: "shafaq", word: "الشفق", meaning: "حمرة الأفق بعد الغروب", exampleRef: "84:16" },
  { id: "barzakh", word: "برزخ", meaning: "حاجز بين شيئين؛ عالم ما بعد الموت قبل البعث", exampleRef: "23:100" },
  { id: "araf", word: "الأعراف", meaning: "سور بين الجنة والنار عليه رجال", exampleRef: "7:46" },
  { id: "asatir", word: "أساطير", meaning: "أخبار مكتوبة / خرافات عند المكذّبين", exampleRef: "6:25" },
  { id: "zukhruf", word: "زخرف", meaning: "زينة ظاهرة / ذهب", exampleRef: "17:93", root: "زخرف" },
  { id: "sarab", word: "سراب", meaning: "ما يُرى كالماء في الهجير وليس بماء", exampleRef: "24:39" },
  { id: "yahmum", word: "يحموم", meaning: "دخان أسود شديد السواد", exampleRef: "56:43" },
  { id: "ghassaq", word: "غسّاق", meaning: "ما يسيل من صديد أهل النار", exampleRef: "38:57" },
  { id: "naadheer", word: "نذير", meaning: "مُنذِر محذّر", aliases: ["نذرا"], exampleRef: "67:8" },
  { id: "bashir", word: "بشير", meaning: "مُبشّر بالخير", exampleRef: "2:119" },
  { id: "hanif", word: "حنيف", meaning: "مائل عن الشرك إلى التوحيد", exampleRef: "2:135" },
  { id: "sakina", word: "سكينة", meaning: "طمأنينة يُنزلها الله في القلوب", exampleRef: "9:26" },
  { id: "furqan", word: "فرقان", meaning: "ما يفرق بين الحق والباطل", exampleRef: "2:185" },
  { id: "mathani", word: "مثاني", meaning: "تُثنّى وتُكرَّر؛ ومنه السبع المثاني", exampleRef: "15:87" },
  { id: "rabee", word: "رتع", meaning: "يتّسع في الأكل والمرح", aliases: ["يرتع"], exampleRef: "12:12" },
  { id: "khubz", word: "خبز", meaning: "طعام مخبوز", exampleRef: "12:36" },
  { id: "mijannah", word: "مجنون", meaning: "من نُسب إلى الجنون ظلمًا", aliases: ["جنون"], exampleRef: "68:2" },
];

function entryMatches(entry: GhareebEntry, needle: string): boolean {
  if (!needle) return false;
  const forms = [entry.word, ...(entry.aliases || []), entry.root || ""];
  return forms.some((f) => {
    const n = normalizeArabic(f);
    return n.length > 0 && (n === needle || n.includes(needle) || needle.includes(n));
  });
}

/** Exact / fuzzy lookup against the local ghareeb lexicon. */
export function lookupGhareeb(query: string, limit = 8): GhareebEntry[] {
  try {
    const q = query.trim();
    if (!q) return [];
    const needle = normalizeArabic(q);
    if (!needle) return [];

    const exact: GhareebEntry[] = [];
    const partial: GhareebEntry[] = [];
    for (const e of GHAREEB_QURAN_ENTRIES) {
      const wordN = normalizeArabic(e.word);
      if (wordN === needle) exact.push(e);
      else if (entryMatches(e, needle)) partial.push(e);
    }
    return [...exact, ...partial].slice(0, limit);
  } catch {
    return [];
  }
}

/** Scan a verse text and return ghareeb hits found in it. */
export function findGhareebInText(text: string): GhareebEntry[] {
  try {
    const n = normalizeArabic(text);
    if (!n) return [];
    return GHAREEB_QURAN_ENTRIES.filter((e) => n.includes(normalizeArabic(e.word))).slice(0, 12);
  } catch {
    return [];
  }
}

export function getGhareebById(id: string): GhareebEntry | undefined {
  return GHAREEB_QURAN_ENTRIES.find((e) => e.id === id);
}
