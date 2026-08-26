/**
 * نسبة الأسئلة للأقسام — SSOT للبطاقة «اختبر معلوماتك».
 * سؤال بلا sectionId لا يُعرض. لا احتياطي عام.
 */
import { ALL_QUESTIONS, type QuizQuestion } from "@/data/islamicQuizData";
import { SECTIONS, getSectionByRoute } from "@/config/sections.registry";

/** ربط فئات islamicQuizData → id في sections.registry */
export const QUIZ_CATEGORY_TO_SECTION_ID: Record<string, string> = {
  quran: "quran",
  hadith: "hadith",
  sira: "seerah",
  anbiya: "prophets",
  fiqh: "fiqh",
  aqeeda: "aqidah",
  tarikh: "islamic-history",
  akhlaq: "adhkar",
};

export type AffinityQuizQuestion = QuizQuestion & {
  sectionId: string;
  lessonId?: string;
  topicTags: string[];
};

const VALID_SECTION_IDS = new Set(SECTIONS.map((s) => s.id));

function buildTaggedPool(): AffinityQuizQuestion[] {
  const out: AffinityQuizQuestion[] = [];
  for (const [catKey, buckets] of Object.entries(ALL_QUESTIONS)) {
    const sectionId = QUIZ_CATEGORY_TO_SECTION_ID[catKey];
    if (!sectionId) continue;
    for (const level of [200, 400, 600] as const) {
      for (const q of buckets[level] ?? []) {
        out.push({
          ...q,
          sectionId,
          topicTags: [catKey, sectionId],
        });
      }
    }
  }
  return out;
}

/** كل الأسئلة الموسومة — يُبنى مرة عند التحميل */
export const TAGGED_QUIZ_POOL: readonly AffinityQuizQuestion[] = Object.freeze(buildTaggedPool());

export function getSectionIdForRoute(route: string): string | undefined {
  return getSectionByRoute(route)?.id;
}

/** مسارات بلا إدخال مباشر في registry — نسبة quiz للقسم الأقرب */
export const QUIZ_ROUTE_SECTION_OVERRIDES: Record<string, string> = {
  "/topics": "subjects",
  "/mind-map": "subjects",
  "/knowledge-graph": "subjects",
  "/research": "research",
  "/duas": "duas",
  "/daily-wird": "wird",
  "/sahabah": "biographies",
  "/fadail-aamal": "hadith",
  "/hikam-salaf": "akhlaq",
  "/institutions": "islamic-history",
  "/study-room": "subjects",
  "/vault": "flashcards",
  "/asma-al-husna": "aqidah",
  "/fiqh-council": "fiqh",
  "/fiqh-council/fatwas": "fiqh",
  "/fiqh-council/issues": "fiqh",
  "/fiqh-council/resolutions": "fiqh",
  "/fiqh-council/recommendations": "fiqh",
  "/fiqh-council/stats": "fiqh",
  "/learning-paths": "knowledge-doors",
  "/my-learning": "knowledge-doors",
  "/site-map": "subjects",
  "/fawaid": "flashcards",
  "/scholars": "biographies",
  "/islamic-glossary": "glossary",
  "/duas-quran": "quran",
  "/adab-talab-ilm": "knowledge-doors",
  "/akhlaq": "adhkar",
  "/raqaiq": "hadith",
  "/tawba": "adhkar",
  "/sawm": "fiqh",
  "/shimael": "seerah",
  "/wasaya-nabawiyya": "hadith",
};

export function resolveQuizSectionId(opts: { sectionId?: string; route?: string }): string | undefined {
  if (opts.sectionId && isValidSectionId(opts.sectionId)) return opts.sectionId;
  if (!opts.route) return undefined;
  const clean = opts.route.split("?")[0].replace(/\/$/, "") || "/";
  const direct = getSectionByRoute(clean)?.id;
  if (direct) return direct;
  if (QUIZ_ROUTE_SECTION_OVERRIDES[clean]) return QUIZ_ROUTE_SECTION_OVERRIDES[clean];
  return undefined;
}

export function isValidSectionId(id: string): boolean {
  return VALID_SECTION_IDS.has(id);
}

/**
 * يُرجع أسئلة تطابق sectionId (ولو وُجد lessonId) حصراً.
 * مجموعة فارغة → البطاقة تُخفى (لا fallback).
 */
export function getQuestionsFor(opts: {
  sectionId: string;
  lessonId?: string;
  count?: number;
}): AffinityQuizQuestion[] {
  const { sectionId, lessonId, count = 4 } = opts;
  if (!sectionId || !isValidSectionId(sectionId)) return [];

  let pool = TAGGED_QUIZ_POOL.filter((q) => q.sectionId === sectionId);
  if (lessonId) {
    const lessonPool = pool.filter((q) => q.lessonId === lessonId);
    if (lessonPool.length > 0) pool = lessonPool;
  }

  if (pool.length === 0) return [];

  const n = Math.min(count, pool.length);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, n);
}

/** إحصاءات للبوابة verify-content-affinity */
export function quizAffinityStats(): {
  total: number;
  tagged: number;
  orphans: number;
  bySection: Record<string, number>;
} {
  const bySection: Record<string, number> = {};
  for (const q of TAGGED_QUIZ_POOL) {
    bySection[q.sectionId] = (bySection[q.sectionId] ?? 0) + 1;
  }
  return {
    total: TAGGED_QUIZ_POOL.length,
    tagged: TAGGED_QUIZ_POOL.length,
    orphans: 0,
    bySection,
  };
}

/** تقاطع كلمات مفتاحية القسم مع نص السؤال — للتحذير اليدوي */
export function keywordOverlapScore(sectionId: string, questionText: string): number {
  const sec = SECTIONS.find((s) => s.id === sectionId);
  if (!sec) return 0;
  const words = questionText.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return 0;
  const keys = [...sec.keywords, sec.label, ...sec.keywords.flatMap((k) => k.split(/\s+/))].map((k) =>
    k.toLowerCase(),
  );
  let hits = 0;
  for (const w of words) {
    if (keys.some((k) => k.includes(w) || w.includes(k))) hits += 1;
  }
  return hits / words.length;
}

export const WEAK_AFFINITY_THRESHOLD = 0.08;
