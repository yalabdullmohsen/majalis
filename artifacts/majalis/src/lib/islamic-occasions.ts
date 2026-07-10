import {
  daysUntilOccasion,
  estimateHijriDate,
  ISLAMIC_OCCASIONS,
  type IslamicOccasion,
} from "@/lib/islamic-occasions-seed";
import { getIslamicOccasionsCacheFromDb } from "@/lib/supabase";
import { arabicMatchAny } from "@/lib/arabic-search";

export type IslamicOccasionView = IslamicOccasion & {
  daysRemaining: number | null;
  nextGregorian?: string | null;
};

export async function loadIslamicOccasions(): Promise<IslamicOccasionView[]> {
  const today = estimateHijriDate();
  const cache = await getIslamicOccasionsCacheFromDb();

  if (!cache.length) {
    return ISLAMIC_OCCASIONS.map((occasion) => ({
      ...occasion,
      daysRemaining: daysUntilOccasion(occasion, today),
    }));
  }

  const cacheMap = new Map(cache.map((row) => [row.occasion_id, row]));

  return ISLAMIC_OCCASIONS.map((occasion) => {
    const row = cacheMap.get(occasion.id);
    return {
      ...occasion,
      daysRemaining: row?.days_remaining ?? daysUntilOccasion(occasion, today),
      nextGregorian: row?.next_gregorian_date ?? null,
    };
  });
}

export function sortOccasionsByUpcoming(items: IslamicOccasionView[]) {
  return [...items].sort((a, b) => {
    if (a.daysRemaining == null && b.daysRemaining == null) return 0;
    if (a.daysRemaining == null) return 1;
    if (b.daysRemaining == null) return -1;
    return a.daysRemaining - b.daysRemaining;
  });
}

export async function filterOccasionsWithCache(query: string): Promise<IslamicOccasionView[]> {
  const q = query.trim().toLowerCase();
  const items = await loadIslamicOccasions();
  if (!q) return items;
  return items.filter((o) => arabicMatchAny([o.name, o.summary, ...o.deeds], q));
}
