/**
 * seed-loader.ts — محمّل بيانات seed الكسول
 *
 * البذور الثقيلة تُجلب من /public/data JSON وليس من حزمة JS.
 */

export type SeedBundle = {
  DEMO_FAWAID: any[];
  DEMO_LESSONS: any[];
  DEMO_QA_CATEGORIES: any[];
  DEMO_SHEIKHS: any[];
  filterDemoQa: (opts: { categoryId?: string; search?: string }) => Promise<any[]>;
  searchDemoContent: (term: string) => Promise<any>;
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

export function loadSeedData(): Promise<SeedBundle> {
  if (_cache) return Promise.resolve(_cache);
  if (_loading) return _loading;

  _loading = (async () => {
    const [demo, quiz, adhkar, miracles, lessons, platform] = await Promise.all([
      import("./demo-content"),
      import("./quiz-seed"),
      import("./adhkar-seed"),
      import("./miracles-seed"),
      import("./lessons-seed"),
      import("./platform-search"),
    ]);

    const [DEMO_QUIZ_QUESTIONS, LESSONS_SEED] = await Promise.all([
      quiz.loadDemoQuizQuestions(),
      lessons.loadLessonsSeed(),
    ]);

    // يضمن تحميل بذور demo-content (qa/fawaid/lessons) قبل البحث
    await demo.ensureDemoContentLoaded();

    _cache = {
      DEMO_FAWAID: demo.DEMO_FAWAID,
      DEMO_LESSONS: demo.DEMO_LESSONS,
      DEMO_QA_CATEGORIES: demo.DEMO_QA_CATEGORIES,
      DEMO_SHEIKHS: demo.DEMO_SHEIKHS,
      filterDemoQa: demo.filterDemoQa,
      searchDemoContent: demo.searchDemoContent,
      filterMiraclesSeed: miracles.filterMiraclesSeed,
      searchMiraclesSeed: miracles.searchMiraclesSeed,
      LESSONS_SEED,
      findSeedLessonById: lessons.findSeedLessonById,
      DEMO_QUIZ_QUESTIONS,
      ADHKAR_CATEGORIES: adhkar.ADHKAR_CATEGORIES,
      filterAdhkar: adhkar.filterAdhkar,
      searchPlatformSeed: platform.searchPlatformSeed,
    };
    _loading = null;
    return _cache;
  })().catch((err) => {
    _loading = null;
    throw err;
  });

  return _loading;
}
