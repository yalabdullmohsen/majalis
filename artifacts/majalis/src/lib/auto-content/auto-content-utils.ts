export function createSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export function createExternalKey(sourceName: string, url: string, title: string): string {
  const raw = `${sourceName}|${url}|${title}`;
  if (typeof Buffer !== "undefined") {
    return Buffer.from(raw).toString("base64").replace(/=/g, "").slice(0, 180);
  }
  return btoa(unescape(encodeURIComponent(raw))).replace(/=/g, "").slice(0, 180);
}

export function cleanText(input = ""): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

export function detectContentType(title: string, text: string): string {
  const value = `${title} ${text}`;
  if (value.includes("فتوى")) return "fatwa";
  if (value.includes("قرار")) return "resolution";
  if (value.includes("توصية")) return "recommendation";
  if (value.includes("حديث")) return "hadith";
  if (value.includes("ذكر") || value.includes("أذكار")) return "adhkar";
  if (value.includes("إعجاز")) return "scientific_miracle";
  if (value.includes("فائدة")) return "benefit";
  return "article";
}

export function calculateQualityScore(item: {
  title?: string;
  summary?: string;
  content?: string;
  source_url?: string;
  category?: string;
  tags?: string[];
}): number {
  let score = 0;
  if (item.title) score += 20;
  if (item.summary) score += 20;
  if (item.content && item.content.length > 300) score += 20;
  if (item.source_url) score += 20;
  if (item.category) score += 10;
  if (item.tags && item.tags.length > 0) score += 10;
  return Math.min(score, 100);
}

export type AutoImportedContent = {
  id: string;
  external_key: string;
  title: string;
  slug: string;
  content_type: string;
  category?: string;
  summary?: string;
  content?: string;
  source_name: string;
  source_url: string;
  original_url?: string;
  tags?: string[];
  verification_status: string;
  status: string;
  quality_score: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
};

export type TrustedSource = {
  id: string;
  name: string;
  source_type: string;
  url: string;
  category?: string;
  trust_level: number;
  is_active: boolean;
  last_synced_at?: string;
};

export type AutoImportLog = {
  id: string;
  source_id?: string;
  status: string;
  message?: string;
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  created_at: string;
};

export const PUBLIC_AUTO_CONTENT_FILTER = {
  status: "published",
  verification_status: "verified",
} as const;
