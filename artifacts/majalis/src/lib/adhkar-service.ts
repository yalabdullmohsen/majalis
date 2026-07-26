/**
 * Published adhkar — seed + localStorage overrides + Supabase verified imports.
 */
import { useQuery } from "@tanstack/react-query";
import { getPublishedAdhkarItems } from "@/lib/adhkar-admin";
import type { AdhkarItem } from "@/lib/adhkar-seed";
import { fetchVerifiedAdhkarItems } from "@/lib/adhkar-supabase";

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
      const remote = await fetchVerifiedAdhkarItems();
      const local = getPublishedAdhkarItems();
      return mergeAdhkarSources(local, remote);
    },
    // Seed local data so UI renders immediately without a loading flash (eliminates CLS)
    initialData: () => mergeAdhkarSources(getPublishedAdhkarItems(), []),
    staleTime: 30_000,
  });
}
