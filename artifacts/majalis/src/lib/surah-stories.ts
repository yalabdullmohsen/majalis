import { getSurahMeta, type SurahMeta } from "./quran-content";

export type SurahStory = {
  number: number;
  name: string;
  namingReason: string;
  revelationTime: string;
  revelationPlace: string;
  revelationType: "مكية" | "مدنية";
  ayahCount: number;
  storySummary: string;
  fullStory: string;
  mainThemes: string[];
  mainStories: string[];
  keyRulings: string[];
  lessons: string[];
  keyTopics: string[];
  highlightAyahs: { ref: string; label: string }[];
  relatedSurahs: { number: number; name: string; reason: string }[];
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

function buildStorySummary(meta: SurahMeta, stories: string[], namingReason: string): string {
  const lead = stories[0] || meta.mainTopics[0] || namingReason;
  const second =
    meta.themes[0] ||
    (meta.revelation === "مكية" ? "تركز على التوحيد والإيمان" : "تتناول أحكاماً وبناء المجتمع");
  const line1 = lead.length > 72 ? `${lead.slice(0, 70)}…` : lead;
  const line2 = second.length > 72 ? `${second.slice(0, 70)}…` : second;
  return `${line1} — ${line2}`;
}

function buildFullStory(meta: SurahMeta, stories: string[]): string {
  const intro =
    meta.revelation === "مكية"
      ? `سورة ${meta.name} من السور المكية، وتُعرّف القارئ بأساسيات الإيمان والموعظة.`
      : `سورة ${meta.name} من السور المدنية، وترتبط بتشريعات وبناء الحياة الإسلامية.`;
  const body = stories.map((s, i) => `${i + 1}. ${s}`).join("\n\n");
  return `${intro}\n\n${body}`;
}

function buildHighlightAyahs(number: number, name: string): { ref: string; label: string }[] {
  const known: Record<number, { ref: string; label: string }[]> = {
    1: [{ ref: "1:1", label: "افتتاح القرآن" }, { ref: "1:5", label: "طلب الهداية" }],
    2: [{ ref: "2:255", label: "آية الكرسي" }, { ref: "2:286", label: "خاتمة السورة" }],
    12: [{ ref: "12:3", label: "أحسن القصص" }, { ref: "12:100", label: "لقاء يعقوب" }],
    18: [{ ref: "18:10", label: "أصحاب الكهف" }, { ref: "18:83", label: "ذو القرنين" }],
    36: [{ ref: "36:1", label: "يس" }, { ref: "36:82", label: "إنما أمره إذا أراد شيئاً" }],
    112: [{ ref: "112:1", label: "قل هو الله أحد" }],
  };
  if (known[number]) return known[number];
  return [{ ref: `${number}:1`, label: `افتتاح سورة ${name}` }];
}

function buildRelatedSurahs(number: number, meta: SurahMeta): { number: number; name: string; reason: string }[] {
  const related: { number: number; name: string; reason: string }[] = [];
  if (number > 1) {
    const prev = getSurahMeta(number - 1);
    related.push({ number: prev.number, name: prev.name, reason: "السورة السابقة في المصحف" });
  }
  if (number < 114) {
    const next = getSurahMeta(number + 1);
    related.push({ number: next.number, name: next.name, reason: "السورة التالية في المصحف" });
  }
  const themePeer = [36, 55, 67, 112].find(
    (n) => n !== number && meta.themes.some((t) => getSurahMeta(n).themes.includes(t)),
  );
  if (themePeer) {
    const peer = getSurahMeta(themePeer);
    related.push({ number: peer.number, name: peer.name, reason: "موضوع قرآني مشابه" });
  }
  return related.slice(0, 3);
}

export function getSurahStory(surahNumber: number): SurahStory {
  const meta = getSurahMeta(surahNumber);
  const namingReason = buildNamingReason(meta);
  const mainStories = buildStories(meta);
  return {
    number: meta.number,
    name: meta.name,
    namingReason,
    revelationTime: meta.revelationOrder
      ? `ترتيب النزول: ${meta.revelationOrder}`
      : meta.revelation === "مكية"
        ? "نزلت في مكة — قبل الهجرة"
        : "نزلت في المدينة — بعد الهجرة",
    revelationPlace: meta.revelation === "مكية" ? "مكة المكرمة" : "المدينة المنورة",
    revelationType: meta.revelation,
    ayahCount: meta.ayahs,
    storySummary: buildStorySummary(meta, mainStories, namingReason),
    fullStory: buildFullStory(meta, mainStories),
    mainThemes: meta.themes,
    mainStories,
    keyRulings: meta.keyRulings,
    lessons: meta.keyBenefits,
    keyTopics: meta.mainTopics,
    highlightAyahs: buildHighlightAyahs(meta.number, meta.name),
    relatedSurahs: buildRelatedSurahs(meta.number, meta),
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
