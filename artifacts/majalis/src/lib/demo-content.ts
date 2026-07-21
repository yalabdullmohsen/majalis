import { arabicMatchAny } from "./arabic-search";
import { SEED_QA, QA_CATEGORIES, filterSeedQa } from "./qa-seed";
import { SEED_FAWAID, filterSeedFawaid } from "./fawaid-seed";
import { FAWAID_CURATED_SEED, FAWAID_CURATED_CATEGORIES } from "./fawaid-curated-seed";
import { filterQualityFawaid } from "./content-quality";
import { ADHKAR_CATEGORIES, filterAdhkar } from "./adhkar-seed";
import { LESSONS_SEED } from "./lessons-seed";
import { filterMiraclesSeed, searchMiraclesSeed } from "./miracles-seed";
import { getLibraryCatalog } from "./library-service";
import { SHEIKHS_SEED } from "./sheikhs-seed";

export { FAWAID_CURATED_CATEGORIES as FAWAID_CATEGORIES, filterSeedFawaid };

/** @deprecated استخدم LESSONS_SEED من lessons-seed.ts */
export const DEMO_LESSONS = LESSONS_SEED;

/**
 * تطبيع النص العربي لمقارنة التكرار: إزالة التطويل والتشكيل والمسافات الزائدة
 * وتوحيد الهمزات، لتحييد الاختلافات الشكلية غير المؤثرة عند المقارنة.
 */
function normalizeArabic(value: string): string {
  return (value || "")
    .normalize("NFKC")
    .replace(/ـ/g, "") // التطويل (ـ)
    .replace(/[ً-ٰٟ]/g, "") // التشكيل
    .replace(/[إأآا]/g, "ا") // توحيد الألف/الهمزات
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * طبقة حماية إضافية ضد التكرار: نُزيل أي شيخ مكرّر بمعرّفه (id) أو باسمه
 * المُطبّع. الإصلاح الجذري في sheikhs-seed.ts (حذف السجلات المكررة)، وهذا
 * صمّام أمان يمنع ظهور أي شيخ مرتين حتى لو أُعيد إدخال تكرار في المصدر لاحقاً.
 */
function dedupeSheikhs<T extends { id?: string; name?: string }>(items: readonly T[]): T[] {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const idKey = (item.id || "").trim();
    const nameKey = normalizeArabic(item.name || "");
    if (!idKey && !nameKey) continue;
    if (idKey && seenIds.has(idKey)) continue;
    if (nameKey && seenNames.has(nameKey)) continue;
    if (idKey) seenIds.add(idKey);
    if (nameKey) seenNames.add(nameKey);
    result.push(item);
  }
  return result;
}

export const DEMO_SHEIKHS = dedupeSheikhs(SHEIKHS_SEED);

export const DEMO_LIBRARY = getLibraryCatalog();

export const DEMO_MIRACLES = filterMiraclesSeed();

function mergeFawaidSeeds() {
  const seen = new Set<string>();
  const merged = [...FAWAID_CURATED_SEED, ...SEED_FAWAID].filter((item) => {
    const key = (item.text || "").slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return filterQualityFawaid(merged);
}

export const DEMO_FAWAID = mergeFawaidSeeds();

export const DEMO_QA = SEED_QA;

export const DEMO_QA_CATEGORIES = [{ id: "all", name: "الكل" }, ...QA_CATEGORIES];

export { isDemoId } from "./demo-id";

export type DemoSearchResults = {
  lessons: typeof DEMO_LESSONS;
  library: typeof DEMO_LIBRARY;
  miracles: { id: string; title: string; category: string; body?: string }[];
  sheikhs: typeof DEMO_SHEIKHS;
  qa: typeof DEMO_QA;
  fawaid: typeof DEMO_FAWAID;
  adhkar: { id: string; text: string; category?: string; source?: string }[];
};

export function searchDemoContent(term: string): DemoSearchResults {
  const q = term.trim();
  if (!q) {
    return { lessons: [], library: [], miracles: [], sheikhs: [], qa: [], fawaid: [], adhkar: [] };
  }

  const lessons = DEMO_LESSONS.filter((l) =>
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

  const qa = DEMO_QA.filter((x) =>
    arabicMatchAny([x.question, x.answer, x.qa_categories?.name, x.reference], q),
  );

  const fawaid = DEMO_FAWAID.filter((f) =>
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

export function filterDemoQa({
  categoryId,
  search,
}: {
  categoryId?: string;
  search?: string;
}) {
  return filterSeedQa({ categoryId, search });
}
