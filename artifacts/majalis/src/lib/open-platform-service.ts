/**
 * Open Islamic Platform — client service
 */

export type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  tier: string;
  is_active: boolean;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
};

export type OpenPlatformDashboard = {
  keys: ApiKey[];
  usage: { total: number; by_resource: Record<string, number>; avg_response_ms: number; errors: number };
  resources: Array<{ id: string; kind: string; label: string; label_en: string }>;
  cache: { entries: number; max: number };
};

function authHeaders(): Record<string, string> {
  const secret = import.meta.env.VITE_ADMIN_API_SECRET || import.meta.env.VITE_CRON_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return headers;
}

export async function fetchOpenPlatformDashboard(): Promise<OpenPlatformDashboard | null> {
  try {
    const res = await fetch("/api/admin/open-platform?action=dashboard", { headers: authHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function createApiKey(name: string, scopes = ["read", "search"], tier = "free") {
  const res = await fetch("/api/admin/open-platform?action=create-key", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, scopes, tier }),
  });
  if (!res.ok) throw new Error("Failed to create key");
  return res.json();
}

export async function revokeApiKey(keyId: string) {
  const res = await fetch("/api/admin/open-platform?action=revoke-key", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ key_id: keyId }),
  });
  if (!res.ok) throw new Error("Failed to revoke key");
  return res.json();
}

export async function fetchApiLogs(limit = 50) {
  const res = await fetch(`/api/admin/open-platform?action=logs&limit=${limit}`, { headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return json.logs || [];
}

export async function createWebhook(url: string, events: string[], name?: string) {
  const res = await fetch("/api/admin/open-platform?action=create-webhook", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ url, events, name }),
  });
  if (!res.ok) throw new Error("Failed to create webhook");
  return res.json();
}

export async function fetchWebhooks() {
  const res = await fetch("/api/admin/open-platform?action=webhooks", { headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return json.webhooks || [];
}

export async function generateOpenPlatformReport() {
  const res = await fetch("/api/admin/open-platform?action=report", { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.report;
}

export async function fetchReleasePlan() {
  const res = await fetch("/api/admin/open-platform?action=plan", { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.plan;
}

export const API_VERSIONS = ["v1", "v2", "v3"];

export const WEBHOOK_EVENTS = [
  "content.created",
  "content.updated",
  "content.deleted",
  "course.completed",
  "fatwa.published",
  "fiqh_decision.published",
  "lesson.published",
  "source.updated",
];
