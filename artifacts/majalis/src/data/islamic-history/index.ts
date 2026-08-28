import type { HistoryCategory, IslamicHistoryItem } from "./types";

import seerah from "./seerah.json";
import rashidun from "./rashidun.json";
import umayyad from "./umayyad.json";
import abbasid from "./abbasid.json";
import andalus from "./andalus.json";
import seljukAyyubid from "./seljuk-ayyubid.json";
import mamluk from "./mamluk.json";
import ottoman from "./ottoman.json";
import civilization from "./civilization.json";
import personalities from "./personalities.json";

export type { HistoryCategory, HistoryKind, VerificationLevel, IslamicHistoryItem } from "./types";

export const HISTORY_CATEGORIES: Record<HistoryCategory, string> = {
  seerah: "السيرة النبوية",
  rashidun: "عصر الخلفاء الراشدين",
  umayyad: "الدولة الأموية",
  abbasid: "الدولة العباسية",
  andalus: "الأندلس",
  "seljuk-ayyubid": "السلاجقة والأيوبيون",
  mamluk: "المماليك",
  ottoman: "الدولة العثمانية",
  civilization: "الحضارة الإسلامية",
  personalities: "شخصيات تاريخية",
};

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
  ...(personalities as IslamicHistoryItem[]),
];

export function getHistoryItem(id: string): IslamicHistoryItem | undefined {
  return ISLAMIC_HISTORY_ITEMS.find((item) => item.id === id);
}

export function getHistoryByCategory(category: HistoryCategory): IslamicHistoryItem[] {
  return ISLAMIC_HISTORY_ITEMS.filter((item) => item.category === category);
}

export function getFeaturedItems(): IslamicHistoryItem[] {
  return ISLAMIC_HISTORY_ITEMS.filter((item) => item.featured);
}

export function getStartHereItems(): IslamicHistoryItem[] {
  return ISLAMIC_HISTORY_ITEMS.filter((item) => item.startHere);
}

export function searchHistoryItems(query: string): IslamicHistoryItem[] {
  const q = query.trim();
  if (!q) return [];
  return ISLAMIC_HISTORY_ITEMS.filter(
    (item) =>
      item.title.includes(q) ||
      item.summary.includes(q) ||
      item.detail.includes(q) ||
      (item.place?.includes(q) ?? false) ||
      (item.era.includes(q) ?? false),
  );
}
