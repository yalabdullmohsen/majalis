/**
 * seed-loader.ts — محمّل بيانات seed الكسول
 *
 * يُحوّل static imports الثقيلة في supabase.ts إلى dynamic imports.
 * النتيجة: بيانات seed لا تُضمَّن في الحزمة الأولية — تُحمَّل فقط عند الحاجة
 * (وفي الإنتاج حيث Supabase مُهيَّأ، قد لا تُحمَّل أبداً في المسار السعيد).
 *
 * التخزين: يُخزَّن النتيجة في الذاكرة بعد أول تحميل فلا يوجد طلب شبكة مكرر.
 */

export type SeedBundle = {
  DEMO_FAWAID: any[];
  DEMO_LESSONS: any[];
  DEMO_QA_CATEGORIES: any[];
  DEMO_SHEIKHS: any[];
  filterDemoQa: (opts: { categoryId?: string; search?: string }) => any[];
  searchDemoContent: (term: string) => any;
  filterMiraclesSeed: () => any[];
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

  _loading = Promise.all([
    import("./demo-content"),    // يسحب: qa-seed, fawaid-seed, lessons-seed, miracles-seed, sheikhs-seed, library-service
    import("./quiz-seed"),       // مستقل وثقيل (130 kB مصدر)
    import("./adhkar-seed"),     // مستقل وثقيل (162 kB مصدر)
    import("./miracles-seed"),   // مستقل خفيف
    import("./lessons-seed"),    // مستقل خفيف
    import("./platform-search"), // مستقل خفيف
  ]).then(([demo, quiz, adhkar, miracles, lessons, platform]) => {
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
      DEMO_QUIZ_QUESTIONS: quiz.DEMO_QUIZ_QUESTIONS,
      ADHKAR_CATEGORIES: adhkar.ADHKAR_CATEGORIES,
      filterAdhkar: adhkar.filterAdhkar,
      searchPlatformSeed: platform.searchPlatformSeed,
    };
    _loading = null;
    return _cache;
  });

  return _loading;
}
