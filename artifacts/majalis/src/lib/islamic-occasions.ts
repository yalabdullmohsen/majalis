import {
  daysUntilOccasion,
  estimateHijriDate,
  ISLAMIC_OCCASIONS,
  type IslamicOccasion,
} from "@/lib/islamic-occasions-seed";
import { arabicMatchAny } from "@/lib/arabic-search";
import {
  enrichOccasionForPublish,
  type PublishableOccasion,
} from "@/lib/religious-content";

export type IslamicOccasionView = PublishableOccasion & {
  daysRemaining: number | null;
  nextGregorian?: string | null;
};

/**
 * تُحمَّل المناسبات من البذرة ثم تُمرَّر على طبقة التوثيق والتحقق.
 * أي مناسبة بلا سجل موثّق معتمد لا تُعرض للعامة.
 */
export async function loadIslamicOccasions(): Promise<IslamicOccasionView[]> {
  const today = estimateHijriDate();
  const out: IslamicOccasionView[] = [];
  for (const occasion of ISLAMIC_OCCASIONS) {
    const enriched = enrichOccasionForPublish(occasion);
    if (!enriched) continue;
    out.push({
      ...enriched,
      daysRemaining: daysUntilOccasion(enriched, today),
    });
  }
  return out;
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

export type { IslamicOccasion };
