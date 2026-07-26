/**
 * seed-loader.ts — محمّل بيانات seed الكسول
 *
 * يُحوّل static imports الثقيلة في supabase.ts إلى dynamic imports / fetch.
 * بنك الأسئلة الثقيل (quiz-seed) يُحمَّل من public/data/quiz-questions.json
 * فلا يدخل حزمة JS بـ1MB+.
 */

export type SeedBundle = {
  DEMO_FAWAID: any[];
  DEMO_LESSONS: any[];
  DEMO_QA_CATEGORIES: any[];
  DEMO_SHEIKHS: any[];
  filterDemoQa: (opts: { categoryId?: string; search?: string }) => any[];
  searchDemoContent: (term: string) => any;
  filterMiraclesSeed: (opts?: { category?: string; sourceType?: string }) => any[];
  searchMiraclesSeed: (q: string) => any[];
  LESSONS_SEED: any[];
  findSeedLessonById: (id: string) => any;
  DEMO_QUIZ_QUESTIONS: any[];
  ADHKAR_CATEGORIES: any[];
  filterAdhkar: (q: string) => any[];
  searchPlatformSeed: (q: string) => any;
};

let _cache: SeedBundle | null = null;
let _loading: Promise<SeedBundle> | null = null;

function quizJsonUrl(): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}data/quiz-questions.json`;
}

async function loadQuizQuestions(): Promise<any[]> {
  // عمدًا بلا import("./quiz-seed") — ذلك كان يُبقي حزمة 1.1MB في المخرجات.
  // المصدر التشغيلي: public/data/quiz-questions.json (يُصدَّر في generate:counts).
  try {
    const res = await fetch(quizJsonUrl());
    if (!res.ok) throw new Error(`quiz-questions.json HTTP ${res.status}`);
    const payload = await res.json();
    if (Array.isArray(payload?.questions)) return payload.questions;
    if (Array.isArray(payload)) return payload;
  } catch (err) {
    console.warn("[seed-loader] تعذّر تحميل quiz-questions.json", err);
  }
  return [];
}

export function loadSeedData(): Promise<SeedBundle> {
  if (_cache) return Promise.resolve(_cache);
  if (_loading) return _loading;

  _loading = Promise.all([
    import("./demo-content"),
    loadQuizQuestions(),
    import("./adhkar-seed"),
    import("./miracles-seed"),
    import("./lessons-seed"),
    import("./platform-search"),
  ]).then(([demo, quizQuestions, adhkar, miracles, lessons, platform]) => {
    _cache = {
      DEMO_FAWAID: demo.DEMO_FAWAID,
      DEMO_LESSONS: demo.DEMO_LESSONS,
      DEMO_QA_CATEGORIES: demo.DEMO_QA_CATEGORIES,
      DEMO_SHEIKHS: demo.DEMO_SHEIKHS,
      filterDemoQa: demo.filterDemoQa,
      searchDemoContent: demo.searchDemoContent,
      filterMiraclesSeed: miracles.filterMiraclesSeed,
      searchMiraclesSeed: miracles.searchMiraclesSeed,
      LESSONS_SEED: lessons.LESSONS_SEED,
      findSeedLessonById: lessons.findSeedLessonById,
      DEMO_QUIZ_QUESTIONS: quizQuestions,
      ADHKAR_CATEGORIES: adhkar.ADHKAR_CATEGORIES,
      filterAdhkar: adhkar.filterAdhkar,
      searchPlatformSeed: platform.searchPlatformSeed,
    };
    _loading = null;
    return _cache;
  });

  return _loading;
}
