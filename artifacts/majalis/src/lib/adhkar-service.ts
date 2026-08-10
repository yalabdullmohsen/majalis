/**
 * Published adhkar — seed + localStorage overrides + Supabase verified imports.
 */
import { useQuery } from "@tanstack/react-query";
import { getPublishedAdhkarItems } from "@/lib/adhkar-admin";
import type { AdhkarItem } from "@/lib/adhkar-seed";
import { fetchVerifiedAdhkarItems } from "@/lib/adhkar-supabase";
import { LruCache } from "@/lib/lru-cache";

/** Bounded merge-result cache — prevents retaining unbounded adhkar list snapshots. */
const ADHKAR_LIST_CACHE = new LruCache<string, AdhkarItem[]>(4);

/** لا تُعرض للعامة أذكارٌ صُرِّح بضعفها — منهج الموقع: لا ضعيف في الترغيب/التعبّد. */
export function isPublishableAdhkar(item: AdhkarItem): boolean {
  const g = (item.grade || "").trim();
  if (!g) return true;
  if (/ضعيف|موضوع|منكر|واه/.test(g)) return false;
  return true;
}

export function mergeAdhkarSources(local: AdhkarItem[], remote: AdhkarItem[]): AdhkarItem[] {
  const byId = new Map<string, AdhkarItem>();
  for (const item of local) byId.set(item.id, item);
  for (const item of remote) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()].filter(isPublishableAdhkar);
}

export function usePublishedAdhkarItems() {
  return useQuery({
    queryKey: ["adhkar", "published", "no-daif"],
    queryFn: async () => {
      const cacheKey = "published:no-daif";
      const { withOfflineFirst, getCachedAdhkarPack, cacheAdhkarPack } = await import(
        "@/lib/offline-content-store"
      );

      const { data } = await withOfflineFirst({
        readCache: async () => {
          const pack = await getCachedAdhkarPack();
          if (pack?.length) return mergeAdhkarSources(pack, []);
          return null;
        },
        fetchOnline: async () => {
          const remote = await fetchVerifiedAdhkarItems();
          const local = getPublishedAdhkarItems();
          return mergeAdhkarSources(local, remote);
        },
        writeCache: async (merged) => {
          await cacheAdhkarPack(merged, `adhkar:${merged.length}`);
        },
      });

      const merged =
        data ?? mergeAdhkarSources(getPublishedAdhkarItems(), []);
      ADHKAR_LIST_CACHE.set(cacheKey, merged);
      return merged;
    },
    // Seed local data so UI renders immediately without a loading flash (eliminates CLS)
    initialData: () => {
      const hit = ADHKAR_LIST_CACHE.get("published:no-daif");
      if (hit) return hit;
      return mergeAdhkarSources(getPublishedAdhkarItems(), []);
    },
    staleTime: 30_000,
  });
}
