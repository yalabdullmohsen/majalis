/**
 * Ghareeb al-Quran — lightweight rare vocabulary lookup (normalized Arabic).
 */

import { normalizeArabic } from "@/shared/arabic-normalize";

export type GhareebEntry = {
  word: string;
  meaningAr: string;
  /** Example refs surah:ayah */
  refs: string[];
  tags: string[];
};

/** Curated starter lexicon — expandable without UI changes. */
export const GHAREEB_LEXICON: GhareebEntry[] = [
  { word: "الصمد", meaningAr: "السيد الذي يُقصد في الحوائج، الكامل في صفاته", refs: ["112:2"], tags: ["عقيدة"] },
  { word: "أباً", meaningAr: "مرعىً أو كلأً من النبات", refs: ["80:31"], tags: ["غريب"] },
  { word: "عسعس", meaningAr: "أقبل بظلامه أو أدبر", refs: ["81:17"], tags: ["غريب"] },
  { word: "الكوثر", meaningAr: "الخير الكثير؛ نهر في الجنة", refs: ["108:1"], tags: ["تفسير"] },
  { word: "ضيزى", meaningAr: "جائرة غير عادلة", refs: ["53:22"], tags: ["غريب"] },
  { word: "هلوعًا", meaningAr: "جزوعًا شديد الجزع", refs: ["70:19"], tags: ["غريب"] },
  { word: "إرم", meaningAr: "مدينة قوم عاد ذات الأبنية الرفيعة", refs: ["89:7"], tags: ["قصص"] },
  { word: "سجيل", meaningAr: "طين متحجّر", refs: ["11:82", "15:74"], tags: ["قصص"] },
  { word: "الرقيم", meaningAr: "اللوح المكتوب فيه خبر أصحاب الكهف", refs: ["18:9"], tags: ["قصص"] },
  { word: "قطمير", meaningAr: "القشرة الرقيقة على النواة", refs: ["35:13"], tags: ["غريب"] },
];

export function lookupGhareeb(query: string, limit = 10): GhareebEntry[] {
  const nq = normalizeArabic(query);
  if (!nq) return [];
  return GHAREEB_LEXICON.filter((e) => {
    const nw = normalizeArabic(e.word);
    const nm = normalizeArabic(e.meaningAr);
    return nw.includes(nq) || nq.includes(nw) || nm.includes(nq);
  }).slice(0, limit);
}

export function findGhareebInAyahText(ayahText: string): GhareebEntry[] {
  const words = ayahText.split(/\s+/).filter(Boolean);
  const hits: GhareebEntry[] = [];
  for (const w of words) {
    const n = normalizeArabic(w);
    for (const entry of GHAREEB_LEXICON) {
      if (normalizeArabic(entry.word) === n || n.includes(normalizeArabic(entry.word))) {
        if (!hits.some((h) => h.word === entry.word)) hits.push(entry);
      }
    }
  }
  return hits;
}
