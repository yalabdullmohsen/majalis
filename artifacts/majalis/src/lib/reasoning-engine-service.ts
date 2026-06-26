/**
 * Islamic Knowledge Reasoning Engine — admin client service
 */

import { adminFetch as apiFetch } from "@/lib/admin-api";

export type ReasoningDashboard = {
  ok: boolean;
  at: string;
  entities: {
    refs: number;
    verified: number;
    adhkar: number;
    hadith: number;
  };
  graph: {
    relations: number;
    relation_types: Array<{ type: string; count: number }>;
  };
  queries: {
    last_24h: number;
    answered_24h: number;
    avg_confidence_7d: number | null;
    recent: Array<Record<string, unknown>>;
  };
  quality: {
    open_issues: number;
  };
};

export type ReasoningCitation = {
  ref_id: string;
  content_kind: string;
  title: string;
  excerpt: string;
  href: string;
  source_name: string | null;
  trust_score: number;
  tier_label: string | null;
};

async function reFetch(action: string, body?: Record<string, unknown>) {
  const res = await apiFetch(`/api/admin/knowledge-reasoning?action=${action}`, {
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  if (!res.ok) throw new Error(`Reasoning API ${action} failed`);
  return res.json();
}

export async function fetchReasoningDashboard(): Promise<{
  ok: boolean;
  dashboard: ReasoningDashboard;
  top_linked: Array<{ ref_id: string; link_count: number }>;
}> {
  return reFetch("dashboard");
}

export async function runReasoningCycle(options?: { autoFix?: boolean; inferenceLimit?: number }) {
  return reFetch("run", options ?? {});
}

export async function runReasoningQuery(query: string) {
  return reFetch("query", { query });
}

export async function scanReasoningQuality(limit = 100) {
  return reFetch("quality", { limit });
}

export async function autoFixReasoningGraph(inferenceLimit = 100) {
  return reFetch("fix", { inferenceLimit });
}

export async function publicReasoningQuery(query: string) {
  const res = await fetch("/api/knowledge-reasoning", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Reasoning query failed");
  return res.json();
}
