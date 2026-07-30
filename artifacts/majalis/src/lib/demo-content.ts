import { arabicMatchAny } from "./arabic-search";
import { QA_CATEGORIES, filterSeedQa, loadSeedQa, getSeedQaCached, type SeedQaItem } from "./qa-seed";
import { filterSeedFawaid } from "./fawaid-seed";
import { FAWAID_CURATED_CATEGORIES } from "./fawaid-curated-categories";
import { filterQualityFawaid } from "./content-quality";
import { ADHKAR_CATEGORIES, filterAdhkar } from "./adhkar-seed";
import { loadLessonsSeed, getLessonsSeedCached } from "./lessons-seed";
import { filterMiraclesSeed, searchMiraclesSeed } from "./miracles-seed";
import { getLibraryCatalog } from "./library-service";
import { SHEIKHS_SEED, dedupeSheikhs } from "./sheikhs-seed";

export { FAWAID_CURATED_CATEGORIES as FAWAID_CATEGORIES, filterSeedFawaid };

let fawaidCache: any[] | null = null;
let fawaidLoading: Promise<any[]> | null = null;

async function loadMergedFawaid(): Promise<any[]> {
  if (fawaidCache) return fawaidCache;
  if (fawaidLoading) return fawaidLoading;
  fawaidLoading = (async () => {
    const [{ FAWAID_CURATED_SEED }, { SEED_FAWAID }] = await Promise.all([
      import("./fawaid-curated-seed"),
      import("./fawaid-seed"),
    ]);
    const seen = new Set<string>();
    const merged = [...FAWAID_CURATED_SEED, ...SEED_FAWAID].filter((item) => {
      const key = (item.text || "").slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    fawaidCache = filterQualityFawaid(merged);
    fawaidLoading = null;
    return fawaidCache;
  })().catch((err) => {
    fawaidLoading = null;
    throw err;
  });
  return fawaidLoading;
}

/** يحمّل qa + lessons + fawaid الكسولة قبل استخدام الخصائص المتزامنة. */
export async function ensureDemoContentLoaded(): Promise<void> {
  await Promise.all([loadSeedQa(), loadLessonsSeed(), loadMergedFawaid()]);
}

function arrayProxy<T>(read: () => T[]): T[] {
  return new Proxy([] as T[], {
    get(_target, prop, receiver) {
      const data = read();
      const value = Reflect.get(data, prop, receiver);
      return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(data) : value;
    },
    has(_target, prop) {
      return prop in read();
    },
    ownKeys() {
      return Reflect.ownKeys(read());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Object.getOwnPropertyDescriptor(read(), prop);
    },
  });
}

/** @deprecated استخدم loadLessonsSeed */
export const DEMO_LESSONS = arrayProxy(() => getLessonsSeedCached());

/**
 * طبقة حماية إضافية ضد التكرار: `dedupeSheikhs` تعيش في sheikhs-seed.ts
 */
export const DEMO_SHEIKHS = dedupeSheikhs(SHEIKHS_SEED);

export const DEMO_LIBRARY = getLibraryCatalog();

export const DEMO_MIRACLES = filterMiraclesSeed();

export const DEMO_FAWAID = arrayProxy(() => fawaidCache ?? []);

export const DEMO_QA = arrayProxy(() => getSeedQaCached());

export const DEMO_QA_CATEGORIES = [{ id: "all", name: "الكل" }, ...QA_CATEGORIES];

export { isDemoId } from "./demo-id";

export type DemoSearchResults = {
  lessons: ReturnType<typeof getLessonsSeedCached>;
  library: typeof DEMO_LIBRARY;
  miracles: { id: string; title: string; category: string; body?: string }[];
  sheikhs: typeof DEMO_SHEIKHS;
  qa: SeedQaItem[];
  fawaid: any[];
  adhkar: { id: string; text: string; category?: string; source?: string }[];
};

export async function searchDemoContent(term: string): Promise<DemoSearchResults> {
  await ensureDemoContentLoaded();
  const q = term.trim();
  if (!q) {
    return { lessons: [], library: [], miracles: [], sheikhs: [], qa: [], fawaid: [], adhkar: [] };
  }

  const lessons = getLessonsSeedCached().filter((l) =>
    arabicMatchAny(
      [l.title, l.description, l.speaker_name, l.category, ...(l.keywords || [])],
      q,
    ),
  );

  const sheikhs = DEMO_SHEIKHS.filter((s) =>
    arabicMatchAny([s.name, s.bio, s.ijazah, s.city, ...(s.specialties || [])], q),
  );

  const library = DEMO_LIBRARY.filter((it) =>
    arabicMatchAny([it.title, it.author, it.description, it.category, it.type, ...(it.keywords || [])], q),
  );

  const qa = getSeedQaCached().filter((x) =>
    arabicMatchAny([x.question, x.answer, x.qa_categories?.name, x.reference], q),
  );

  const fawaid = (fawaidCache ?? []).filter((f) =>
    arabicMatchAny([f.text, f.author_name, f.category, f.source], q),
  );

  const adhkar = filterAdhkar(q).slice(0, 15).map((item) => ({
    id: item.id,
    text: item.text,
    category: ADHKAR_CATEGORIES.find((c) => c.id === item.categoryId)?.name,
    source: item.source,
  }));

  const miracles = searchMiraclesSeed(q).map((m) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    body: m.body,
  }));

  return { lessons, library, miracles, sheikhs, qa, fawaid, adhkar };
}

export async function filterDemoQa({
  categoryId,
  search,
}: {
  categoryId?: string;
  search?: string;
}) {
  return filterSeedQa({ categoryId, search });
}
