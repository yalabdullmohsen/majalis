/**
 * Auto Knowledge Engine — client service
 */

export type AkeEngineStats = {
  connectors_active?: number;
  connectors_healthy?: number;
  connectors_total?: number;
  items_new_today?: number;
  items_published_today?: number;
  items_review?: number;
  items_rejected?: number;
  items_duplicate?: number;
  items_archived?: number;
  broken_links?: number;
  avg_quality?: number;
  avg_trust?: number;
  runs_recent?: Array<Record<string, unknown>>;
  connectors_health?: Array<{
    slug: string;
    name: string;
    health_status: string;
    last_sync_at?: string;
    items_published?: number;
    broken_links?: number;
    is_active?: boolean;
  }>;
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

function authHeaders(): Record<string, string> {
  const secret = import.meta.env.VITE_ADMIN_API_SECRET || import.meta.env.VITE_CRON_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return headers;
}

async function akeAdminFetch(action: string, body?: Record<string, unknown>) {
  const res = await fetch(`/api/admin/auto-knowledge-engine?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: authHeaders(),
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  if (!res.ok) throw new Error(`AKE API ${action} failed`);
  return res.json();
}

export async function fetchAkeStats(days = 7): Promise<{
  stats: AkeEngineStats | null;
  usingLegacy?: boolean;
}> {
  try {
    const json = await akeAdminFetch("stats", { days });
    return { stats: json.stats, usingLegacy: json.usingLegacy };
  } catch {
    try {
      const res = await fetch(`/api/admin/knowledge-pipeline?action=stats&days=${days}`, {
        headers: authHeaders(),
      });
      if (!res.ok) return { stats: null };
      const json = await res.json();
      return { stats: json.stats, usingLegacy: true };
    } catch {
      return { stats: null };
    }
  }
}

export async function runAkeEngineManual(opts?: {
  maxItems?: number;
  checkLinks?: boolean;
  connectorSlug?: string;
}) {
  return akeAdminFetch("run", opts || {});
}

export async function runAkeHealthCheck() {
  return akeAdminFetch("health");
}

export async function searchKnowledgeHybrid(query: string, limit = 20): Promise<KnowledgeSearchResult[]> {
  try {
    const res = await fetch(`/api/knowledge-search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.results || json.items || [];
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
    const params = new URLSearchParams();
    if (opts.kind) params.set("kind", opts.kind);
    if (opts.recordId) params.set("recordId", opts.recordId);
    if (opts.limit) params.set("limit", String(opts.limit));

    const res = await fetch(`/api/knowledge-recommendations?${params}`);
    if (!res.ok) return { items: [], algorithm: "none" };
    return res.json();
  } catch {
    return { items: [], algorithm: "none" };
  }
}

/** @deprecated use fetchAkeStats */
export const fetchKnowledgeStats = fetchAkeStats;

/** @deprecated use runAkeEngineManual */
export const runKnowledgePipelineManual = runAkeEngineManual;

export type KnowledgePipelineStats = AkeEngineStats;
export const OFFICIAL_SOURCE_COUNT = 17;
