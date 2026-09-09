import type { HistoryCategory, HistoryKind, IslamicHistoryItem } from "./types";
import { HISTORY_ERA_META, type HistoryEraMeta } from "./era-meta";

import seerah from "./seerah.json";
import rashidun from "./rashidun.json";
import umayyad from "./umayyad.json";
import abbasid from "./abbasid.json";
import andalus from "./andalus.json";
import seljukAyyubid from "./seljuk-ayyubid.json";
import mamluk from "./mamluk.json";
import ottoman from "./ottoman.json";
import civilization from "./civilization.json";
import modern from "./modern.json";

export type { HistoryCategory, HistoryKind, VerificationLevel, IslamicHistoryItem } from "./types";
export type { HistoryEraMeta } from "./era-meta";
export { HISTORY_ERA_META } from "./era-meta";

/** تسميات نوع العنصر للعرض — لا تختلق تصنيفات أدق من البيانات */
export const HISTORY_KIND_LABELS: Record<HistoryKind, string> = {
  era: "عصر",
  event: "حدث",
  institution: "مؤسسة",
  city: "مدينة",
};

export const HISTORY_CATEGORIES: Record<HistoryCategory, string> = {
  seerah: HISTORY_ERA_META.seerah.title,
  rashidun: HISTORY_ERA_META.rashidun.title,
  umayyad: HISTORY_ERA_META.umayyad.title,
  abbasid: HISTORY_ERA_META.abbasid.title,
  andalus: HISTORY_ERA_META.andalus.title,
  "seljuk-ayyubid": HISTORY_ERA_META["seljuk-ayyubid"].title,
  mamluk: HISTORY_ERA_META.mamluk.title,
  ottoman: HISTORY_ERA_META.ottoman.title,
  civilization: HISTORY_ERA_META.civilization.title,
  modern: HISTORY_ERA_META.modern.title,
};

/** ترتيب العصور في الخط الزمني */
export const HISTORY_CATEGORY_ORDER: HistoryCategory[] = [
  "seerah",
  "rashidun",
  "umayyad",
  "abbasid",
  "andalus",
  "seljuk-ayyubid",
  "mamluk",
  "ottoman",
  "civilization",
  "modern",
];

function compareTimeline(a: IslamicHistoryItem, b: IslamicHistoryItem): number {
  const ao = a.timelineOrder ?? Number.MAX_SAFE_INTEGER;
  const bo = b.timelineOrder ?? Number.MAX_SAFE_INTEGER;
  if (ao !== bo) return ao - bo;
  const ca = HISTORY_CATEGORY_ORDER.indexOf(a.category);
  const cb = HISTORY_CATEGORY_ORDER.indexOf(b.category);
  return ca - cb;
}

export const ISLAMIC_HISTORY_ITEMS: IslamicHistoryItem[] = [
  ...(seerah as IslamicHistoryItem[]),
  ...(rashidun as IslamicHistoryItem[]),
  ...(umayyad as IslamicHistoryItem[]),
  ...(abbasid as IslamicHistoryItem[]),
  ...(andalus as IslamicHistoryItem[]),
  ...(seljukAyyubid as IslamicHistoryItem[]),
  ...(mamluk as IslamicHistoryItem[]),
  ...(ottoman as IslamicHistoryItem[]),
  ...(civilization as IslamicHistoryItem[]),
  ...(modern as IslamicHistoryItem[]),
].sort(compareTimeline);

export function getHistoryItem(id: string): IslamicHistoryItem | undefined {
  return ISLAMIC_HISTORY_ITEMS.find((item) => item.id === id);
}

export function getHistoryByCategory(category: HistoryCategory): IslamicHistoryItem[] {
  return ISLAMIC_HISTORY_ITEMS.filter((item) => item.category === category).sort(compareTimeline);
}

export function getFeaturedItems(): IslamicHistoryItem[] {
  return ISLAMIC_HISTORY_ITEMS.filter((item) => item.featured).sort(compareTimeline);
}

export function getStartHereItems(): IslamicHistoryItem[] {
  return ISLAMIC_HISTORY_ITEMS.filter((item) => item.startHere).sort(compareTimeline);
}

export function searchHistoryItems(query: string): IslamicHistoryItem[] {
  const q = query.trim();
  if (!q) return [];
  return ISLAMIC_HISTORY_ITEMS.filter((item) => {
    const hay = [
      item.title,
      item.summary,
      item.detail,
      item.era,
      item.place ?? "",
      item.causes ?? "",
      item.outcomes ?? "",
      item.lessons ?? "",
      ...(item.relatedPersons ?? []),
      ...item.sources,
    ].join("\n");
    return hay.includes(q);
  });
}

/** مجموعات الدول/العصور مع أحداثها مرتّبة زمنياً */
export function getHistoryErasWithEvents(): Array<{
  meta: HistoryEraMeta;
  events: IslamicHistoryItem[];
}> {
  return HISTORY_CATEGORY_ORDER.map((id) => ({
    meta: HISTORY_ERA_META[id],
    events: getHistoryByCategory(id),
  }));
}

/** فهرس المرحلة داخل المسار (1-based) */
export function getEraStageInfo(category: HistoryCategory): {
  index: number;
  total: number;
  meta: HistoryEraMeta;
  eventCount: number;
} {
  const index = HISTORY_CATEGORY_ORDER.indexOf(category) + 1;
  return {
    index: Math.max(index, 1),
    total: HISTORY_CATEGORY_ORDER.length,
    meta: HISTORY_ERA_META[category],
    eventCount: getHistoryByCategory(category).length,
  };
}

export function getAdjacentEra(
  category: HistoryCategory,
): { prev?: HistoryCategory; next?: HistoryCategory } {
  const i = HISTORY_CATEGORY_ORDER.indexOf(category);
  if (i < 0) return {};
  return {
    prev: i > 0 ? HISTORY_CATEGORY_ORDER[i - 1] : undefined,
    next: i < HISTORY_CATEGORY_ORDER.length - 1 ? HISTORY_CATEGORY_ORDER[i + 1] : undefined,
  };
}

/** الحدث السابق/التالي ضمن نفس المرحلة (ثم على الخط الزمني العام إن لزم) */
export function getAdjacentHistoryItems(id: string): {
  prev?: IslamicHistoryItem;
  next?: IslamicHistoryItem;
} {
  const item = getHistoryItem(id);
  if (!item) return {};
  const sameEra = getHistoryByCategory(item.category);
  const localIdx = sameEra.findIndex((x) => x.id === id);
  if (localIdx >= 0) {
    return {
      prev: localIdx > 0 ? sameEra[localIdx - 1] : undefined,
      next: localIdx < sameEra.length - 1 ? sameEra[localIdx + 1] : undefined,
    };
  }
  const globalIdx = ISLAMIC_HISTORY_ITEMS.findIndex((x) => x.id === id);
  if (globalIdx < 0) return {};
  return {
    prev: globalIdx > 0 ? ISLAMIC_HISTORY_ITEMS[globalIdx - 1] : undefined,
    next:
      globalIdx < ISLAMIC_HISTORY_ITEMS.length - 1
        ? ISLAMIC_HISTORY_ITEMS[globalIdx + 1]
        : undefined,
  };
}

export function getSameEraRelated(
  item: IslamicHistoryItem,
  limit = 6,
): IslamicHistoryItem[] {
  return getHistoryByCategory(item.category)
    .filter((x) => x.id !== item.id)
    .slice(0, limit);
}
