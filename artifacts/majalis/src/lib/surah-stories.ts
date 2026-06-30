import { getSurahMeta, type StaticSurahMeta as SurahMeta } from "./quran-api";

export type SurahStory = {
  number: number;
  name: string;
  namingReason: string;
  revelationTime: string;
  revelationPlace: string;
  ayahCount: number;
  mainThemes: string[];
  mainStories: string[];
  keyRulings: string[];
  lessons: string[];
  keyTopics: string[];
  virtues: string;
  connectionToPrevious: string;
  keywords: string[];
  sources: string[];
  lastReviewed: string;
  trustNote: string;
};

/** Curated naming reasons — only where well-established in tafsir literature. */
const NAMING_REASONS: Record<number, string> = {
  1: "سُمّيت بالفاتحة لافتتاح القرآن بها، ولأنها تُفتتح بها السورة.",
  2: "سُمّيت بالبقرة لقصة البقرة المذكورة فيها — وقيل: لأنها أطول سورة.",
  12: "سُمّيت بيوسف لقصة النبي يوسف عليه السلام التي تشغل معظم السورة.",
  18: "سُمّيت بالكهف لقصة أصحاب الكهف البارزة فيها.",
  19: "سُمّيت بمريم لذكر مريم عليها السلام وقصة عيسى.",
  28: "سُمّيت بالقصص لكثرة القصص فيها: موسى، فرعون، قارون، وغيرها.",
  36: "سُمّيت يس لورود حرف «يس» في مطلعها.",
  55: "سُمّيت الرحمن لكثرة ذكر اسم «الرحمن» فيها.",
  112: "سُمّيت الإخلاص لبيان إخلاص العبادة لله وحده.",
};

/** Curated stories — only well-known Quranic narratives, no weak isra'iliyyat. */
const MAIN_STORIES: Record<number, string[]> = {
  2: ["قصة آدم وحوّاء", "قصة بني إسرائيل", "قصة البقرة", "قصة إبراهيم وبناء الكعبة", "قصة موسى وفرعون"],
  7: ["قصة نوح", "قصة هود", "قصة صالح", "قصة لوط", "قصة شعيب", "قصة موسى"],
  11: ["قصة نوح", "قصة هود", "قصة صالح", "قصة إبراهيم", "قصة موسى"],
  12: ["قصة يوسف مع إخوته", "السجن والملك", "العفة والصبر", "لقاء يعقوب"],
  18: ["أصحاب الكهف", "صاحب الجنتين", "موسى والخضر", "ذو القرنين"],
  19: ["قصة زكريا ويحيى", "قصة مريم وعيسى"],
  20: ["قصة موسى مع فرعون", "قصة آدم"],
  28: ["موسى في التابوت", "فرعون وقارون", "شعيب ومدين"],
  36: ["قصة أصحاب القرية", "دلائل البعث"],
};

function buildNamingReason(meta: SurahMeta): string {
  if (NAMING_REASONS[meta.number]) return NAMING_REASONS[meta.number];
  return `سُمّيت سورة ${meta.name} — غالباً بأول آية بارزة أو بموضوعها الرئيسي. راجع كتب التفسير للتفصيل دون الجزم برواية غير ثابتة.`;
}

function buildStories(meta: SurahMeta): string[] {
  if (MAIN_STORIES[meta.number]) return MAIN_STORIES[meta.number];
  if (meta.revelation === "مكية") {
    return [
      "تركز على تقرير التوحيد والبعث والأنبياء.",
      "تتضمن موعظ ودعوة إلى الإيمان بالله واليوم الآخر.",
    ];
  }
  return [
    "تتضمن أحكاماً وتشريعات وبناء المجتمع المسلم.",
    "ترتبط بسياق المدينة والتعامل مع المسلمين والمشركين.",
  ];
}

export function getSurahStory(surahNumber: number): SurahStory {
  const meta = getSurahMeta(surahNumber);
  return {
    number: meta.number,
    name: meta.name,
    namingReason: buildNamingReason(meta),
    revelationTime: meta.revelationOrder
      ? `ترتيب النزول: ${meta.revelationOrder}`
      : meta.revelation === "مكية"
        ? "نزلت في مكة — قبل الهجرة"
        : "نزلت في المدينة — بعد الهجرة",
    revelationPlace: meta.revelation === "مكية" ? "مكة المكرمة" : "المدينة المنورة",
    ayahCount: meta.ayahs,
    mainThemes: meta.themes,
    mainStories: buildStories(meta),
    keyRulings: meta.keyRulings,
    lessons: meta.keyBenefits,
    keyTopics: meta.mainTopics,
    virtues: meta.virtues || "الفضل العام لتلاوة القرآن — لا تُثبت فضيلة خاصة إلا بدليل.",
    connectionToPrevious: meta.openingClosingConnection,
    keywords: [...meta.themes, ...meta.mainTopics.slice(0, 3), meta.name],
    sources: [
      meta.source,
      "تفسير ابن كثير",
      "تفسير السعدي",
      "أسباب النزول — الواحدي (عند الحاجة)",
    ],
    lastReviewed: meta.lastReviewed,
    trustNote:
      "لا تُذكر روايات ضعيفة أو إسرائيليات. القصص من القرآن والسنة الصحيحة فقط.",
  };
}

export function getAllSurahStories(): SurahStory[] {
  return Array.from({ length: 114 }, (_, i) => getSurahStory(i + 1));
}

export function searchSurahStories(query: string): SurahStory[] {
  const q = query.trim();
  if (!q) return getAllSurahStories();
  return getAllSurahStories().filter(
    (s) =>
      s.name.includes(q) ||
      String(s.number).includes(q) ||
      s.keywords.some((k) => k.includes(q)) ||
      s.mainStories.some((story) => story.includes(q)),
  );
}
