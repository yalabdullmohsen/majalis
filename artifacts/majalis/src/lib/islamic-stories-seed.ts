/**
 * بذور القصص الإسلامية — البيانات في /public/data/stories (JSON chunks).
 */
import { arabicMatchAny } from "@/lib/arabic-search";
import { loadAllSeedChunks, loadSeedChunksByKey, peekSeedCache } from "./json-seed-loader";

const STORIES_DATA_BASE = "/data/stories";

export type IslamicStorySeed = {
  id: number;
  slug: string;
  title: string;
  category:
    | "أنبياء"
    | "تابعون"
    | "تاريخ"
    | "حكمة"
    | "سلف"
    | "سيرة"
    | "صحابة"
    | "صحابيات"
    | "علم"
    | "علماء"
    | "فتوحات"
    | "قرآن"
    | "نساء صالحات";
  era: string;
  icon: string;
  summary: string;
  full_content: string;
  key_lessons: string[];
  related_figures: string[];
  sources: string[];
  tags: string[];
  is_approved: boolean;
  trust_level?: "primary_text" | "scholarly_source" | "institutional_ruling" | "general_reasoning" | "unsourced";
  editorial_review_status?: "unreviewed" | "reviewed" | "needs_rereview";
  last_updated_at?: string;
};

export async function loadIslamicStoriesSeed(opts?: { category?: string }): Promise<IslamicStorySeed[]> {
  if (opts?.category && opts.category !== "الكل") {
    return loadSeedChunksByKey<IslamicStorySeed>(STORIES_DATA_BASE, opts.category);
  }
  return loadAllSeedChunks<IslamicStorySeed>(STORIES_DATA_BASE);
}

export function getIslamicStoriesCached(): IslamicStorySeed[] {
  return peekSeedCache<IslamicStorySeed>(STORIES_DATA_BASE) ?? [];
}

/** @deprecated استخدم loadIslamicStoriesSeed */
export const ISLAMIC_STORIES_SEED: IslamicStorySeed[] = new Proxy([] as IslamicStorySeed[], {
  get(_target, prop, receiver) {
    const data = getIslamicStoriesCached();
    const value = Reflect.get(data, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(data) : value;
  },
  has(_target, prop) {
    return prop in getIslamicStoriesCached();
  },
  ownKeys() {
    return Reflect.ownKeys(getIslamicStoriesCached());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getIslamicStoriesCached(), prop);
  },
});

export async function filterIslamicStoriesSeed(opts?: {
  category?: string;
  era?: string;
  search?: string;
}): Promise<IslamicStorySeed[]> {
  let items = await loadIslamicStoriesSeed({ category: opts?.category });
  if (opts?.era && opts.era !== "الكل") {
    items = items.filter((s) => s.era === opts.era);
  }
  if (opts?.search?.trim()) {
    items = items.filter((s) => arabicMatchAny([s.title, s.summary, ...s.tags], opts.search!));
  }
  return items;
}
