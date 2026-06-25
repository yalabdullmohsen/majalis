/**
 * Client service for AI Knowledge Engine admin & search.
 */

export type KnowledgePipelineStats = {
  sources_active?: number;
  sources_total?: number;
  items_today?: number;
  items_published_today?: number;
  items_review?: number;
  items_rejected?: number;
  items_duplicate?: number;
  avg_quality?: number;
  top_categories?: Array<{ category: string; cnt: number }>;
  runs_recent?: Array<Record<string, unknown>>;
  section_completion?: Record<string, number>;
};

export type KnowledgeSearchResult = {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  content_kind?: string;
  scholar?: string;
  quality_score?: number;
  trust_score?: number;
  verification_status?: string;
  rank?: number;
  source?: string;
};

export type KnowledgeRecommendation = {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  kind?: string;
  score?: number;
  url?: string;
  record_id?: string;
};

async function adminFetch(action: string, body?: Record<string, unknown>) {
  const secret = import.meta.env.VITE_ADMIN_API_SECRET || import.meta.env.VITE_CRON_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;

  const res = await fetch(`/api/admin/knowledge-pipeline?action=${action}`, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  if (!res.ok) throw new Error(`Knowledge API ${action} failed`);
  return res.json();
}

export async function fetchKnowledgeStats(days = 7): Promise<{
  stats: KnowledgePipelineStats | null;
  usingSeed?: boolean;
}> {
  try {
    return await adminFetch("stats", { days });
  } catch {
    return { stats: null, usingSeed: true };
  }
}

export async function runKnowledgePipelineManual(opts?: {
  maxItems?: number;
  skipPublish?: boolean;
}) {
  return adminFetch("run", opts || {});
}

export async function searchKnowledgeHybrid(query: string, limit = 20): Promise<KnowledgeSearchResult[]> {
  try {
    const res = await fetch(`/api/knowledge-search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.results || [];
  } catch {
    return [];
  }
}

export async function fetchKnowledgeRecommendations(opts: {
  kind?: string;
  recordId?: string;
  limit?: number;
}): Promise<{ items: KnowledgeRecommendation[]; algorithm: string; source_title?: string }> {
  try {
    const params = new URLSearchParams({ action: "recommend" });
    if (opts.kind) params.set("kind", opts.kind);
    if (opts.recordId) params.set("recordId", opts.recordId);
    if (opts.limit) params.set("limit", String(opts.limit));

    const secret = import.meta.env.VITE_ADMIN_API_SECRET || import.meta.env.VITE_CRON_SECRET;
    const headers: Record<string, string> = {};
    if (secret) headers.Authorization = `Bearer ${secret}`;

    const res = await fetch(`/api/admin/knowledge-pipeline?${params}`, { headers });
    if (!res.ok) return { items: [], algorithm: "none" };
    return res.json();
  } catch {
    return { items: [], algorithm: "none" };
  }
}

export const OFFICIAL_SOURCE_COUNT = 8;
