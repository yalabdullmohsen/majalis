import {
  daysUntilOccasion,
  estimateHijriDate,
  ISLAMIC_OCCASIONS,
  type IslamicOccasion,
} from "@/lib/islamic-occasions-seed";
import { arabicMatchAny } from "@/lib/arabic-search";

export type IslamicOccasionView = IslamicOccasion & {
  daysRemaining: number | null;
  nextGregorian?: string | null;
};

/**
 * محسوبة محليًا دائمًا — جدول islamic_occasions_cache غير موجود في قاعدة
 * البيانات (لم يُنشأ قط)، وكان استدعاؤه يفشل صامتًا على كل تحميل للرئيسية
 * (خطأ PGRST205 في الطرفية) قبل الرجوع لهذا الحساب المحلي نفسه في كل مرة.
 */
export async function loadIslamicOccasions(): Promise<IslamicOccasionView[]> {
  const today = estimateHijriDate();
  return ISLAMIC_OCCASIONS.map((occasion) => ({
    ...occasion,
    daysRemaining: daysUntilOccasion(occasion, today),
  }));
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
