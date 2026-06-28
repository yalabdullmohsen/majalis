import { adminFetch } from "@/lib/admin-api";

const API = "/api/admin/autonomous-platform";

export type ManagedSource = {
  id?: string;
  slug: string;
  name: string;
  source_type: string;
  source_url: string;
  priority: number;
  trust_score: number;
  content_types: string[];
  active: boolean;
  health_score?: number;
  items_extracted_total?: number;
  items_extracted_last?: number;
  avg_fetch_ms?: number | null;
  error_rate_pct?: number;
  last_success_at?: string | null;
  last_error?: string | null;
  last_http_status?: number | null;
  last_response_ms?: number | null;
};

export async function listPlatformSources() {
  const res = await adminFetch(`${API}?action=sources`);
  return res.json() as Promise<{ ok: boolean; sources: ManagedSource[] }>;
}

export async function createPlatformSource(source: Partial<ManagedSource>) {
  const res = await adminFetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "source.create", source }),
  });
  return res.json();
}

export async function updatePlatformSource(source: Partial<ManagedSource>) {
  const res = await adminFetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "source.update", source }),
  });
  return res.json();
}

export async function deletePlatformSource(id: string) {
  const res = await adminFetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "source.delete", id }),
  });
  return res.json();
}

export async function togglePlatformSource(id: string, active: boolean) {
  const res = await adminFetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "source.toggle", id, active }),
  });
  return res.json();
}

export async function testPlatformSource(idOrUrl: string) {
  const res = await adminFetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "source.test", id: idOrUrl }),
  });
  return res.json();
}

export async function discoverPlatformFeeds(url: string) {
  const res = await adminFetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "discover", url }),
  });
  return res.json();
}

export async function fetchPlatformAnalytics() {
  const res = await adminFetch(`${API}?action=analytics`);
  return res.json();
}

export async function fetchDailyGoals() {
  const res = await adminFetch(`${API}?action=goals`);
  return res.json();
}

export async function runPlatformCycle(mode = "full") {
  const res = await adminFetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "run", mode }),
  });
  return res.json();
}

export const CONTENT_TYPE_OPTIONS = [
  "benefits",
  "questions",
  "hadith",
  "rulings",
  "stories",
  "articles",
];

export const SOURCE_TYPE_OPTIONS = ["rss", "atom", "feed", "website", "sitemap"];
