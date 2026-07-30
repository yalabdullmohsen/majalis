/**
 * بذرة الأسئلة والأجوبة — البيانات في /public/data/qa (JSON chunks).
 * لا تُضمَّن المصفوفة في حزمة العميل.
 */
import { arabicMatchAny } from "./arabic-search";
import { loadAllSeedChunks, loadSeedChunksByKey, peekSeedCache } from "./json-seed-loader";

const QA_DATA_BASE = "/data/qa";

export const QA_CATEGORIES = [
  { id: "seed-cat-aqeedah", name: "العقيدة", slug: "aqeedah" },
  { id: "seed-cat-anbiya", name: "الأنبياء", slug: "anbiya" },
  { id: "seed-cat-sahabah", name: "الصحابة", slug: "sahabah" },
  { id: "seed-cat-fiqh", name: "الفقه", slug: "fiqh" },
  { id: "seed-cat-tahara", name: "الطهارة", slug: "tahara" },
  { id: "seed-cat-salah", name: "الصلاة", slug: "salah" },
  { id: "seed-cat-zakat", name: "الزكاة", slug: "zakat" },
  { id: "seed-cat-sawm", name: "الصيام", slug: "sawm" },
  { id: "seed-cat-hajj", name: "الحج", slug: "hajj" },
  { id: "seed-cat-seerah", name: "السيرة", slug: "seerah" },
  { id: "seed-cat-quran", name: "القرآن", slug: "quran" },
  { id: "seed-cat-hadith", name: "الحديث", slug: "hadith" },
  { id: "seed-cat-adhkar", name: "الأذكار", slug: "adhkar" },
  { id: "seed-cat-adab", name: "الآداب", slug: "adab" },
] as const;

export type SeedQaItem = {
  id: string;
  question: string;
  answer: string;
  category_id?: string;
  ruling_type?: string;
  evidence?: string;
  reference?: string;
  status?: string;
  review_status?: string;
  created_at?: string;
  qa_categories?: { name?: string; slug?: string };
  trust_level?: string;
  editorial_review_status?: string;
  last_updated_at?: string;
  documentation_status?: "sourced" | "unsourced";
};

export async function loadSeedQa(opts?: { categoryId?: string }): Promise<SeedQaItem[]> {
  const categoryId = opts?.categoryId;
  if (categoryId && categoryId !== "all") {
    return loadSeedChunksByKey<SeedQaItem>(QA_DATA_BASE, categoryId);
  }
  return loadAllSeedChunks<SeedQaItem>(QA_DATA_BASE);
}

/**
 * وصول متوافق بعد التحميل (أو فارغ قبل ذلك في المتصفح).
 * للاستخدام بعد `await loadSeedQa()` أو في مسارات Node عبر await.
 */
export function getSeedQaCached(): SeedQaItem[] {
  return peekSeedCache<SeedQaItem>(QA_DATA_BASE) ?? [];
}

/** @deprecated استخدم loadSeedQa — يُبقى للتوافق مع مسارات تُحمّل البذرة أولًا */
export const SEED_QA: SeedQaItem[] = new Proxy([] as SeedQaItem[], {
  get(_target, prop, receiver) {
    const data = getSeedQaCached();
    const value = Reflect.get(data, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(data) : value;
  },
  has(_target, prop) {
    return prop in getSeedQaCached();
  },
  ownKeys() {
    return Reflect.ownKeys(getSeedQaCached());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getSeedQaCached(), prop);
  },
});

export async function filterSeedQa({
  categoryId,
  search,
}: {
  categoryId?: string;
  search?: string;
}): Promise<SeedQaItem[]> {
  let items = (await loadSeedQa({ categoryId })).filter((q) => q.status === "published");
  if (search?.trim()) {
    const s = search.trim();
    items = items.filter((q) =>
      arabicMatchAny([q.question, q.answer, q.evidence, q.reference, q.qa_categories?.name], s),
    );
  }
  return items;
}
