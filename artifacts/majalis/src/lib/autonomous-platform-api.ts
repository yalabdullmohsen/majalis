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
  return res.json() as Promise<{ ok: boolean; sources: ManagedSource[]; message?: string; code?: string; missing?: string[] }>;
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

export type ProductionHealthPayload = {
  ok: boolean;
  platformVersion: string;
  readinessPct: number;
  readinessBreakdown?: Record<string, { weight: number; score: number }>;
  blockersCount?: number;
  checklist?: Array<{ id: string; label: string; status: string; reason: string }>;
  autoActivationNote?: string;
  at: string;
  infrastructure: Array<{
    key: string;
    priority: string;
    present: boolean;
    impact: string;
    status: string;
    whyRequired?: string;
    stoppedFunctions?: string[];
    howToFix?: string[];
    howToVerify?: string[];
  }>;
  migration: {
    ok: boolean;
    appliedPct: number;
    present: string[];
    missing: string[];
    expectedVsActual?: {
      expected: { tables: string[]; indexes: string[]; policies: string[] };
      actual: {
        tables: { present: string[]; missing: string[] };
        indexes: { present: string[]; missing: string[]; skipped?: boolean; reason?: string };
        policies: { present: string[]; missing: string[]; skipped?: boolean; reason?: string };
      };
    };
  };
  bootstrap: { blockedReason?: string | null; failureDetail?: { step?: string; error?: string } | null };
  database: {
    counts: Record<string, number | null>;
    emptyReasons: Record<string, { code: string; message: string; fix?: string } | null>;
    sources: { db: number; jsonSeed: number; active: number };
    pipelineStatus?: { state: string; label: string; detail: string };
    pipelineRuns: Array<{
      id: string;
      pipeline: string;
      status: string;
      produced?: number;
      published?: number;
      duration_ms?: number;
      started_at?: string;
    }>;
    selfHealing: Array<{ event_type: string; component: string; action_taken: string; success: boolean }>;
  };
  crons: {
    crons: Array<{
      path: string;
      schedule: string;
      label: string;
      enabled?: boolean;
      registered?: boolean;
      lastRun?: string | null;
      lastSuccess?: string | null;
      lastFailure?: string | null;
      nextRun?: string | null;
      averageRuntimeMs?: number | null;
      itemsProcessed?: number;
      neverRunReason?: string | null;
    }>;
    blockReason?: string | null;
  };
  logs?: Record<string, { ok: boolean; count?: number; entries: Array<{ component: string; event: string; message?: string; created_at: string }> }>;
  security: { cronAuthConfigured: boolean; serviceRoleConfigured: boolean; aiMode: string };
  blockers: Array<{ type: string; key?: string; impact: string; severity?: string; programmaticFix?: boolean; howToFix?: string[] }>;
  ownerActions: Array<{ secret: string; addTo: string; impact: string; howToFix?: string[]; howToVerify?: string[] }>;
};

export async function fetchProductionHealth() {
  const res = await adminFetch(`${API}?action=health`);
  return res.json() as Promise<ProductionHealthPayload>;
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
