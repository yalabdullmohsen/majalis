/**
 * Scholarly Intelligence Engine — client service
 */

import { adminFetch as apiFetch } from "@/lib/admin-api";
import { T } from "@/lib/terminology";

export type IntelligentSearchResult = {
  id?: string;
  kind: string;
  kind_label?: string;
  title: string;
  summary?: string;
  href: string;
  source_name?: string;
  verification_status?: string;
  trust_level?: number;
  quality_score?: number;
  keywords?: string[];
  updated_at?: string;
  relevance_score?: number;
};

export type IntelligentSearchResponse = {
  ok: boolean;
  query: string;
  count: number;
  results: IntelligentSearchResult[];
  groups: Record<string, IntelligentSearchResult[]>;
  topics: Array<{ slug: string; title: string }>;
  response_ms?: number;
  cached?: boolean;
  query_info?: { normalized: string; expanded_terms: string[] };
};

export type TopicSection = {
  quran: IntelligentSearchResult[];
  hadith: IntelligentSearchResult[];
  fatwa: IntelligentSearchResult[];
  library: IntelligentSearchResult[];
  lessons: IntelligentSearchResult[];
  scholars: IntelligentSearchResult[];
  articles: IntelligentSearchResult[];
  qa: IntelligentSearchResult[];
  fawaid: IntelligentSearchResult[];
  fiqh: IntelligentSearchResult[];
  courses: IntelligentSearchResult[];
  miracles: IntelligentSearchResult[];
  knowledge: IntelligentSearchResult[];
};

export type TopicContentResponse = {
  ok: boolean;
  topic: {
    slug: string;
    title: string;
    title_en?: string;
    category?: string;
    keywords?: string[];
  };
  sections: TopicSection;
  total_count: number;
  related_topics: Array<{ slug: string; title: string }>;
};

export type SearchAnalytics = {
  top_queries: Array<{ query: string; count: number }>;
  top_topics: Array<{ slug: string; title: string; count: number }>;
  zero_result_queries: Array<{ query: string; count: number }>;
  content_gaps: Array<{ query: string; count: number }>;
  avg_response_ms: number;
  click_through_rate: number;
  total_searches: number;
  quality_score: number;
};

function sessionId(): string {
  const key = "majalis_search_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export async function intelligentSearch(
  query: string,
  opts?: {
    limit?: number;
    type?: string;
    author?: string;
    status?: string;
    language?: string;
    year?: number;
  },
): Promise<IntelligentSearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.type) params.set("type", opts.type);
  if (opts?.author) params.set("author", opts.author);
  if (opts?.status) params.set("status", opts.status);
  if (opts?.language) params.set("lang", opts.language);
  if (opts?.year) params.set("year", String(opts.year));
  params.set("sessionId", sessionId());

  const res = await fetch(`/api/intelligent-search?${params}`);
  if (!res.ok) return { ok: false, query, count: 0, results: [], groups: {}, topics: [] };
  return res.json();
}

export async function trackSearchClick(opts: {
  query: string;
  resultId?: string;
  kind?: string;
}) {
  try {
    await fetch("/api/intelligent-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "click", ...opts, sessionId: sessionId() }),
    });
  } catch {
    /* best effort */
  }
}

export async function fetchTopicContent(slug: string): Promise<TopicContentResponse | null> {
  try {
    const res = await fetch(`/api/topic-content?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchAllTopics(): Promise<Array<{ slug: string; title: string; category?: string }>> {
  try {
    const res = await fetch("/api/topic-content");
    if (!res.ok) return [];
    const json = await res.json();
    return json.topics || [];
  } catch {
    return [];
  }
}

export async function fetchContentRelations(opts: {
  kind?: string;
  recordId?: string;
  topicSlug?: string;
  query?: string;
  limit?: number;
}): Promise<{ items: IntelligentSearchResult[]; algorithm: string }> {
  const params = new URLSearchParams();
  if (opts.kind) params.set("kind", opts.kind);
  if (opts.recordId) params.set("recordId", opts.recordId);
  if (opts.topicSlug) params.set("topicSlug", opts.topicSlug);
  if (opts.query) params.set("query", opts.query);
  if (opts.limit) params.set("limit", String(opts.limit));

  try {
    const res = await fetch(`/api/content-relations?${params}`);
    if (!res.ok) return { items: [], algorithm: "none" };
    const json = await res.json();
    return { items: json.items || [], algorithm: json.algorithm || "none" };
  } catch {
    return { items: [], algorithm: "none" };
  }
}

export async function fetchSearchAnalytics(days = 30): Promise<SearchAnalytics | null> {
  try {
    const res = await apiFetch(`/api/admin/search-analytics?action=dashboard&days=${days}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.analytics;
  } catch {
    return null;
  }
}

export async function generateIntelligenceReport(): Promise<Record<string, unknown> | null> {
  try {
    const res = await apiFetch("/api/admin/search-analytics?action=report");
    if (!res.ok) return null;
    const json = await res.json();
    return json.report;
  } catch {
    return null;
  }
}

export const SECTION_LABELS: Record<keyof TopicSection, string> = {
  quran: "الآيات",
  hadith: "الأحاديث",
  fatwa: "الفتاوى",
  library: "الكتب",
  lessons: "الدروس",
  scholars: "العلماء",
  articles: "المقالات",
  qa: T.qa,
  fawaid: "الفوائد",
  fiqh: "المجمع الفقهي",
  courses: "الدورات",
  miracles: "الإعجاز العلمي",
  knowledge: "محرك المعرفة",
};
