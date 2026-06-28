import { requestFetch } from "@/lib/request-manager";
/**
 * Auto Knowledge Engine — client service
 */

import { adminFetch as apiFetch } from "@/lib/admin-api";

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
  sync_state?: {
    global_backfill_completed?: boolean;
    global_import_mode?: string;
    last_successful_sync_at?: string;
    current_month_key?: string;
  } | null;
  backfill?: {
    month_key?: string;
    connectors_completed?: number;
    connectors_total?: number;
    global_completed?: boolean;
    import_mode?: string;
    month_imported?: number;
    month_published?: number;
    remaining_estimate?: number;
  };
  connectors_health?: Array<{
    slug: string;
    name: string;
    health_status: string;
    last_sync_at?: string;
    items_published?: number;
    broken_links?: number;
    is_active?: boolean;
    backfill_completed?: boolean;
    sync_cursor_at?: string;
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

async function akeAdminFetch(action: string, body?: Record<string, unknown>) {
  const res = await apiFetch(`/api/admin/auto-knowledge-engine?action=${action}`, {
    method: body ? "POST" : "GET",
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
      const res = await apiFetch(`/api/admin/knowledge-pipeline?action=stats&days=${days}`);
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
  maxItemsPerConnector?: number;
  checkLinks?: boolean;
  connectorSlug?: string;
  importMode?: "backfill" | "incremental" | "auto";
}) {
  return akeAdminFetch("run-engine", opts || {});
}

export async function runAkeHealthCheck() {
  return akeAdminFetch("health");
}

export type SystemHealth = {
  ok: boolean;
  at: string;
  durationMs?: number;
  metrics?: {
    sourcesTotal?: number;
    sourcesActive?: number;
    itemsNewToday?: number;
    itemsPublishedToday?: number;
    itemsPublished?: number;
    itemsPending?: number;
    lastDurationMs?: number | null;
  };
  errors?: string[];
  ai?: { status?: string; openai?: string; anthropic?: string };
  supabase?: { status?: string; serviceRole?: boolean };
  cron?: { status?: string; secretConfigured?: boolean };
  queue?: { status?: string; pending?: number; failed?: number };
  env?: Record<string, boolean>;
};

export async function fetchSystemHealth(): Promise<SystemHealth | null> {
  try {
    return await akeAdminFetch("system");
  } catch {
    try {
      const res = await apiFetch("/api/admin/auto-content?action=system");
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }
}

export async function searchKnowledgeHybrid(query: string, limit = 20): Promise<KnowledgeSearchResult[]> {
  try {
    const res = await requestFetch(`/api/knowledge-search?q=${encodeURIComponent(query)}&limit=${limit}`);
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

    const res = await requestFetch(`/api/knowledge-recommendations?${params}`);
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
