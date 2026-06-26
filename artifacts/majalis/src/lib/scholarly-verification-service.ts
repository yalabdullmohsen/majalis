/**
 * Scholarly Verification — admin client service
 */

export type ScholarlySectionStats = {
  total: number;
  verified: number;
  needs_review: number;
  rejected: number;
  duplicate: number;
};

export type ScholarlyVerificationReport = {
  generated_at: string;
  items_scanned: number;
  verified_count: number;
  needs_review_count: number;
  rejected_count: number;
  duplicate_count: number;
  broken_links_count: number;
  documentation_completeness_percent: number;
  readiness_score: number;
  section_stats: Record<string, ScholarlySectionStats>;
  next_priorities: string[];
};

export type ScholarlyDashboard = {
  ok: boolean;
  latest_run?: Record<string, unknown> | null;
  provenance_stats?: Record<string, unknown> | null;
  report?: ScholarlyVerificationReport;
};

export type ScholarlySearchResult = {
  content_type: string;
  content_id: string;
  title: string;
  source_name: string;
  source_url: string;
  verification_status: string;
  trust_level?: number;
  quality_score?: number;
};

function authHeaders(): Record<string, string> {
  const secret = import.meta.env.VITE_ADMIN_API_SECRET || import.meta.env.VITE_CRON_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return headers;
}

async function svFetch(action: string, body?: Record<string, unknown>) {
  const res = await fetch(`/api/admin/scholarly-verification?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: authHeaders(),
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  if (!res.ok) throw new Error(`Scholarly verification API ${action} failed`);
  return res.json();
}

export async function fetchScholarlyDashboard(): Promise<ScholarlyDashboard> {
  return svFetch("dashboard");
}

export async function runScholarlyScan(options?: {
  checkLinks?: boolean;
  useAi?: boolean;
  persist?: boolean;
}) {
  return svFetch("scan", options ?? {});
}

export async function searchScholarly(filters: {
  query?: string;
  source_name?: string;
  author?: string;
  content_type?: string;
  verification_status?: string;
  limit?: number;
}) {
  return svFetch("search", { filters });
}

export async function publicScholarlySearch(filters: {
  query?: string;
  content_type?: string;
  verification_status?: string;
  source_name?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.content_type) params.set("type", filters.content_type);
  if (filters.verification_status) params.set("status", filters.verification_status);
  if (filters.source_name) params.set("source", filters.source_name);
  if (filters.limit) params.set("limit", String(filters.limit));
  const res = await fetch(`/api/scholarly-search?${params.toString()}`);
  if (!res.ok) throw new Error("Scholarly search failed");
  return res.json();
}
