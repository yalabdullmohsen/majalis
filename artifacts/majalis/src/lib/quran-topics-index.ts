/**
 * فهرس مواضيع قرآنية موضوعي — يربط مفاهيم (صبر، بر الوالدين، ابتلاء…)
 * بآيات ذات صلة مباشرة. يُستهلك من محرك البحث والسياق.
 */

import { normalizeArabic } from "@/shared/arabic-normalize";

export interface QuranTopicVerseRef {
  surah: number;
  ayah: number;
  note?: string;
}

export interface QuranTopicEntry {
  id: string;
  label: string;
  aliases: string[];
  verses: QuranTopicVerseRef[];
}

export type QuranTopicSearchHit = {
  topicId: string;
  title: string;
  href: string;
  verseRefs: string[];
  score: number;
  verses: QuranTopicVerseRef[];
};

export const QURAN_TOPICS: QuranTopicEntry[] = [
  {
    id: "sabr",
    label: "الصبر",
    aliases: [
      "صبر",
      "اصبر",
      "الصابرين",
      "تصبر",
      "أشعر بالحزن",
      "حزين",
      "الحزن",
      "الصبر عند البلاء",
      "البلاء",
      "قلق",
      "هم",
    ],
    verses: [
      { surah: 2, ayah: 153, note: "استعينوا بالصبر والصلاة" },
      { surah: 2, ayah: 155 },
      { surah: 3, ayah: 200 },
      { surah: 16, ayah: 126 },
      { surah: 39, ayah: 10 },
      { surah: 103, ayah: 3 },
    ],
  },
  {
    id: "birr-walidayn",
    label: "البر بالوالدين",
    aliases: ["بر الوالدين", "الوالدين", "عقوق", "بر الوالد"],
    verses: [
      { surah: 17, ayah: 23 },
      { surah: 17, ayah: 24 },
      { surah: 31, ayah: 14 },
      { surah: 31, ayah: 15 },
      { surah: 46, ayah: 15 },
      { surah: 29, ayah: 8 },
    ],
  },
  {
    id: "ibtila",
    label: "الابتلاء",
    aliases: ["ابتلاء", "فتنة", "اختبار", "يختبر", "الصبر عند البلاء", "مصيبة", "شدة"],
    verses: [
      { surah: 2, ayah: 155 },
      { surah: 29, ayah: 2 },
      { surah: 29, ayah: 3 },
      { surah: 67, ayah: 2 },
      { surah: 21, ayah: 35 },
    ],
  },
  {
    id: "tawba",
    label: "التوبة",
    aliases: ["توبة", "استغفار", "يغفر", "التائبين"],
    verses: [
      { surah: 2, ayah: 222 },
      { surah: 9, ayah: 104 },
      { surah: 39, ayah: 53 },
      { surah: 66, ayah: 8 },
      { surah: 110, ayah: 3 },
    ],
  },
  {
    id: "rizq",
    label: "الرزق",
    aliases: ["رزق", "بركة", "سعة الرزق", "الرزق والبركة", "أحتاج رزقًا", "ضائقة مالية"],
    verses: [
      { surah: 2, ayah: 212 },
      { surah: 65, ayah: 2 },
      { surah: 65, ayah: 3 },
      { surah: 51, ayah: 58 },
      { surah: 29, ayah: 60 },
    ],
  },
  {
    id: "qiyama",
    label: "القيامة",
    aliases: ["يوم القيامة", "الحشر", "البعث", "الآخرة"],
    verses: [
      { surah: 22, ayah: 7 },
      { surah: 75, ayah: 1 },
      { surah: 75, ayah: 6 },
      { surah: 39, ayah: 68 },
      { surah: 99, ayah: 1 },
    ],
  },
  {
    id: "salah",
    label: "الصلاة",
    aliases: ["صلاة", "أقيموا الصلاة", "المصلين"],
    verses: [
      { surah: 2, ayah: 43 },
      { surah: 4, ayah: 103 },
      { surah: 11, ayah: 114 },
      { surah: 17, ayah: 78 },
      { surah: 20, ayah: 14 },
    ],
  },
  {
    id: "zakat",
    label: "الزكاة",
    aliases: ["زكاة", "صدقة", "إنفاق"],
    verses: [
      { surah: 2, ayah: 43 },
      { surah: 2, ayah: 110 },
      { surah: 9, ayah: 60 },
      { surah: 9, ayah: 103 },
      { surah: 98, ayah: 5 },
    ],
  },
  {
    id: "tawhid",
    label: "التوحيد",
    aliases: ["توحيد", "لا إله إلا الله", "الإخلاص", "عبادة"],
    verses: [
      { surah: 112, ayah: 1 },
      { surah: 2, ayah: 163 },
      { surah: 3, ayah: 18 },
      { surah: 21, ayah: 25 },
      { surah: 47, ayah: 19 },
    ],
  },
  {
    id: "shukr",
    label: "الشكر",
    aliases: ["شكر", "اشكر", "الحمد"],
    verses: [
      { surah: 2, ayah: 152 },
      { surah: 14, ayah: 7 },
      { surah: 31, ayah: 12 },
      { surah: 34, ayah: 13 },
      { surah: 39, ayah: 66 },
    ],
  },
  {
    id: "qiyam-layl",
    label: "قيام الليل",
    aliases: ["صلاة الليل", "تهجد", "الليل", "الوتر"],
    verses: [
      { surah: 17, ayah: 79 },
      { surah: 73, ayah: 1 },
      { surah: 73, ayah: 2 },
      { surah: 73, ayah: 6 },
      { surah: 32, ayah: 16 },
    ],
  },
  {
    id: "dua",
    label: "الدعاء",
    aliases: ["دعاء", "استجابة", "ادعوني"],
    verses: [
      { surah: 2, ayah: 186 },
      { surah: 40, ayah: 60 },
      { surah: 27, ayah: 62 },
      { surah: 7, ayah: 55 },
      { surah: 14, ayah: 40 },
    ],
  },
  {
    id: "jannah",
    label: "الجنة",
    aliases: ["جنة", "الفردوس", "نعيم"],
    verses: [
      { surah: 2, ayah: 25 },
      { surah: 3, ayah: 133 },
      { surah: 9, ayah: 72 },
      { surah: 18, ayah: 107 },
      { surah: 55, ayah: 46 },
    ],
  },
  {
    id: "naar",
    label: "النار",
    aliases: ["جهنم", "عذاب", "السعير"],
    verses: [
      { surah: 2, ayah: 24 },
      { surah: 4, ayah: 56 },
      { surah: 67, ayah: 6 },
      { surah: 104, ayah: 4 },
      { surah: 111, ayah: 3 },
    ],
  },
  {
    id: "ilm",
    label: "العلم",
    aliases: ["علم", "معرفة", "اقرأ"],
    verses: [
      { surah: 96, ayah: 1 },
      { surah: 20, ayah: 114 },
      { surah: 58, ayah: 11 },
      { surah: 39, ayah: 9 },
      { surah: 2, ayah: 269 },
    ],
  },
];

function verseHref(v: QuranTopicVerseRef): string {
  return `/mushaf?surah=${v.surah}&ayah=${v.ayah}`;
}

function topicHref(topic: QuranTopicEntry): string {
  const first = topic.verses[0];
  return first ? verseHref(first) : "/quran-hub";
}

function scoreTopic(topic: QuranTopicEntry, nq: string): number {
  const labelN = normalizeArabic(topic.label);
  if (labelN === nq) return 10;
  if (labelN.includes(nq) || nq.includes(labelN)) return 8;
  let best = 0;
  for (const a of topic.aliases) {
    const na = normalizeArabic(a);
    if (!na) continue;
    if (na === nq) best = Math.max(best, 9);
    else if (na.includes(nq) || nq.includes(na)) best = Math.max(best, 6);
  }
  return best;
}

/** شرائح حالات شعورية/مفاهيمية للبحث السريع */
export const QURAN_MOOD_CHIPS = [
  { label: "أشعر بالحزن", query: "أشعر بالحزن" },
  { label: "الرزق والبركة", query: "الرزق والبركة" },
  { label: "الصبر عند البلاء", query: "الصبر عند البلاء" },
  { label: "التوبة", query: "التوبة" },
  { label: "العلم", query: "العلم" },
] as const;

/** بحث موضوعي دلالي — يُدمج في محرك البحث الرئيسي */
export function searchQuranTopics(query: string, limit = 5): QuranTopicSearchHit[] {
  try {
    const q = query.trim();
    if (!q) return [];
    const nq = normalizeArabic(q);
    if (!nq) return [];
    const hits: QuranTopicSearchHit[] = [];
    for (const topic of QURAN_TOPICS) {
      const score = scoreTopic(topic, nq);
      if (score <= 0) continue;
      hits.push({
        topicId: topic.id,
        title: `موضوع قرآني: ${topic.label}`,
        href: topicHref(topic),
        verseRefs: topic.verses.map((v) => `${v.surah}:${v.ayah}`),
        score,
        verses: topic.verses,
      });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch {
    return [];
  }
}

export function findTopicsMatchingQuery(query: string): QuranTopicEntry[] {
  const ids = new Set(searchQuranTopics(query, 50).map((h) => h.topicId));
  return QURAN_TOPICS.filter((t) => ids.has(t.id));
}

export function getTopicById(id: string): QuranTopicEntry | undefined {
  return QURAN_TOPICS.find((t) => t.id === id);
}

export function allTopicLabels(): string[] {
  return QURAN_TOPICS.map((t) => t.label);
}
