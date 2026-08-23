/**
 * تحميل بطاقات حصاد المصادر من feed.json
 */
export type HarvestFeedSource = {
  id: string;
  name_ar: string;
  url: string;
  post_url: string;
  platform: string;
};

export type HarvestFeedCard = {
  id: string;
  type: "درس" | "حلقة" | "دورة" | "خطبة" | "تسجيل" | "إعلان";
  title_ar: string;
  summary_ar: string;
  sheikh: string | null;
  place: string | null;
  audience: "عام" | "رجال" | "نساء" | "نشء";
  starts_at: string | null;
  time_text: string | null;
  register_url: string | null;
  sources: HarvestFeedSource[];
  image_url: string | null;
  published_at: string;
  confidence: number;
};

export type HarvestAccountsFile = {
  version: number;
  updated_at: string;
  accounts: HarvestAccount[];
};

export type HarvestAccount = {
  id: string;
  platform: string;
  handle: string;
  url: string;
  name_ar: string;
  kind: string;
  topics: string[];
  audience: string;
  region_ar: string;
  site?: string;
  contact?: string;
  enabled: boolean;
  poll_priority: string;
  last_seen_at: string | null;
};

let feedCache: HarvestFeedCard[] | null = null;
let accountsCache: HarvestAccount[] | null = null;

export async function loadHarvestFeed(): Promise<HarvestFeedCard[]> {
  if (feedCache) return feedCache;
  const res = await fetch("/data/lessons/feed.json", { cache: "no-cache" });
  if (!res.ok) return [];
  const data = await res.json();
  const items: HarvestFeedCard[] = Array.isArray(data.items) ? data.items : [];
  feedCache = items;
  return items;
}

export async function loadHarvestAccounts(): Promise<HarvestAccount[]> {
  if (accountsCache) return accountsCache;
  const res = await fetch("/data/sources/accounts.json", { cache: "no-cache" });
  if (!res.ok) return [];
  const data: HarvestAccountsFile = await res.json();
  const items = data.accounts ?? [];
  accountsCache = items;
  return items;
}

export function invalidateHarvestCache() {
  feedCache = null;
  accountsCache = null;
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function isThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);
  return d >= start;
}

export function feedForAccount(feed: HarvestFeedCard[], accountId: string): HarvestFeedCard[] {
  return feed.filter((c) => c.sources.some((s) => s.id === accountId));
}
