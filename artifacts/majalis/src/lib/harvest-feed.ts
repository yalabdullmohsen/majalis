import { isOutsideKuwaitHarvestItem } from "@/lib/lesson-kuwait-scope";
import { cleanHarvestDisplayText, isPresentableDisplayText } from "@/lib/harvest-display-text";
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
  type: "درس" | "حلقة" | "دورة" | "تسجيل" | "محاضرة" | "مسابقة" | "تنبيه";
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

/** تنظيف حقول العرض ورفض البطاقات الفاسدة (OCR / عناوين مقطوعة بلا معنى). */
export function sanitizeHarvestCard(raw: HarvestFeedCard): HarvestFeedCard | null {
  if (/…|\.{3}\s*$/.test(String(raw.title_ar || "").trim())) return null;
  const title_ar = cleanHarvestDisplayText(raw.title_ar);
  if (!isPresentableDisplayText(title_ar, 8)) return null;

  const summaryRaw = cleanHarvestDisplayText(raw.summary_ar);
  const summary_ar = isPresentableDisplayText(summaryRaw, 12) ? summaryRaw : "";

  const sheikhRaw = raw.sheikh ? cleanHarvestDisplayText(raw.sheikh) : "";
  const sheikh =
    sheikhRaw && isPresentableDisplayText(sheikhRaw, 3) && !/دروس الشيخ ومواعيد|الموقع الإلكترون/u.test(sheikhRaw)
      ? sheikhRaw
      : null;

  const placeRaw = raw.place ? cleanHarvestDisplayText(raw.place) : "";
  const place =
    placeRaw && isPresentableDisplayText(placeRaw, 3) && placeRaw.length <= 80 && !/^https?:/i.test(placeRaw)
      ? placeRaw
      : null;

  return {
    ...raw,
    title_ar,
    summary_ar,
    sheikh,
    place,
  };
}

export async function loadHarvestFeed(): Promise<HarvestFeedCard[]> {
  if (feedCache) return feedCache;
  const res = await fetch("/data/lessons/feed.json", { cache: "no-cache" });
  if (!res.ok) return [];
  const data = await res.json();
  const items: HarvestFeedCard[] = Array.isArray(data.items) ? data.items : [];
  const kuwaitOnly = items
    .filter((item) => !isOutsideKuwaitHarvestItem(item))
    .map(sanitizeHarvestCard)
    .filter((c): c is HarvestFeedCard => c != null);
  feedCache = kuwaitOnly;
  return kuwaitOnly;
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

/** أولوية العرض — أعلى = أهم (تسجيل مفتوح، موعد قريب، حلقة/دورة) */
export function feedPriorityScore(card: HarvestFeedCard): number {
  let score = 0;
  if (card.register_url) score += 120;
  if (card.starts_at) {
    const t = Date.parse(card.starts_at);
    if (Number.isFinite(t)) {
      const days = (t - Date.now()) / (24 * 60 * 60 * 1000);
      if (days >= 0 && days <= 14) score += 90 - Math.min(80, days * 4);
    }
  }
  if (card.type === "تسجيل") score += 70;
  if (card.type === "حلقة") score += 55;
  if (card.type === "دورة") score += 50;
  if (card.type === "درس" || card.type === "محاضرة") score += 45;
  if (card.type === "مسابقة") score += 40;
  if (card.published_at) {
    const ageDays = (Date.now() - Date.parse(card.published_at)) / (24 * 60 * 60 * 1000);
    if (Number.isFinite(ageDays) && ageDays >= 0) score += Math.max(0, 30 - ageDays);
  }
  return score;
}
