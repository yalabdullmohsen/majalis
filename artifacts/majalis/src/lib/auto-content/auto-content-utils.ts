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

export function mapContentTypeToUpdateType(contentType: string): string {
  const map: Record<string, string> = {
    fatwa: "فتوى",
    resolution: "قرار",
    recommendation: "قرار",
    hadith: "خبر علمي",
    adhkar: "خبر علمي",
    scientific_miracle: "خبر علمي",
    benefit: "خبر علمي",
    article: "خبر علمي",
  };
  return map[contentType] || "خبر علمي";
}

export function calculateQualityScore(item: {
  title?: string;
  summary?: string;
  content?: string;
  source_url?: string;
  category?: string;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  source_verified?: boolean;
}): number {
  let score = 0;
  if (item.title) score += 15;
  if (item.summary) score += 15;
  if (item.content && item.content.length > 300) score += 15;
  if (item.source_url) score += 10;
  if (item.category) score += 10;
  if (item.tags && item.tags.length > 0) score += 10;
  if (item.seo_title) score += 10;
  if (item.seo_description) score += 10;
  if (item.source_verified) score += 5;
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
  seo_title?: string;
  seo_description?: string;
  structured_data?: Record<string, unknown>;
  source_verified?: boolean;
  pipeline_stage?: string;
  ai_analysis?: Record<string, unknown>;
  error_details?: Record<string, unknown>;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // حقول أتمتة Instagram متعددة الأنواع (دورات/فعاليات/فوائد/إعلانات)
  source_account?: string;
  source_post_id?: string;
  source_published_at?: string;
  attribution_name?: string;
  organization_name?: string;
  image_url?: string;
  media_type?: "image" | "video" | "carousel" | string;
  registration_url?: string;
  event_start_at?: string;
  event_end_at?: string;
  expires_at?: string;
  review_status?: string;
  content_hash?: string;
  last_displayed_at?: string;
  display_count?: number;
  pinned?: boolean;
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
  run_id?: string;
  source_id?: string;
  status: string;
  message?: string;
  pipeline_stage?: string;
  error_details?: Record<string, unknown>;
  duration_ms?: number;
  item_title?: string;
  item_external_key?: string;
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  created_at: string;
};

export type AutoImportRun = {
  id: string;
  trigger_type: string;
  status: string;
  sources_total: number;
  sources_ok: number;
  sources_failed: number;
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  duration_ms?: number;
  error_summary?: string;
  started_at: string;
  finished_at?: string;
};

export type MergedUpdateItem = {
  id: string;
  title: string;
  summary?: string;
  update_type: string;
  source_url?: string;
  published_at?: string;
  slug?: string;
  isAuto?: boolean;
  source_name?: string;
  seo_title?: string;
  seo_description?: string;
};

export const PUBLIC_AUTO_CONTENT_FILTER = {
  status: "published",
  verification_status: "verified",
} as const;
