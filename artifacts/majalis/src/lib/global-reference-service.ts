/**
 * Global Scholarly Reference System — client service
 */

export type GlobalRef = {
  ref_id: string;
  content_kind: string;
  title?: string;
  author?: string;
  publisher?: string;
  verification_status?: string;
  documentation_level?: string;
  version_number?: number;
  created_at?: string;
  updated_at?: string;
  last_reviewed_at?: string;
};

export type ReferenceDashboard = {
  counts: {
    refs: number;
    relations: number;
    sources: number;
    verified: number;
    needs_review: number;
    incomplete: number;
  };
  verification_pct: number;
  avg_quality_score: number;
  sources: Array<{ slug: string; name: string; trust_level: number; connection_status?: string }>;
};

function authHeaders(): Record<string, string> {
  const secret = import.meta.env.VITE_ADMIN_API_SECRET || import.meta.env.VITE_CRON_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return headers;
}

export async function fetchReferenceDashboard(): Promise<ReferenceDashboard | null> {
  try {
    const res = await fetch("/api/admin/global-reference?action=dashboard", { headers: authHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function resolveGlobalReference(refId: string) {
  const res = await fetch(`/api/global-reference?action=resolve&ref=${encodeURIComponent(refId)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchRelationGraph(refId: string, depth = 2) {
  const res = await fetch(`/api/global-reference?action=graph&ref=${encodeURIComponent(refId)}&depth=${depth}`);
  if (!res.ok) return null;
  return res.json();
}

export async function runReferenceReview() {
  const res = await fetch("/api/admin/global-reference?action=review", { method: "POST", headers: authHeaders() });
  if (!res.ok) throw new Error("Review failed");
  return res.json();
}

export async function generateReferenceReport() {
  const res = await fetch("/api/admin/global-reference?action=report", { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.report;
}

export async function fetchThreeYearRoadmap() {
  const res = await fetch("/api/admin/global-reference?action=roadmap", { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.roadmap;
}

export async function auditSources() {
  const res = await fetch("/api/admin/global-reference?action=audit-sources", { method: "POST", headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return json.results || [];
}
