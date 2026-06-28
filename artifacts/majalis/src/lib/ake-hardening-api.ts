import { adminFetch } from "@/lib/admin-api";

export type HardeningConnector = {
  slug: string;
  name?: string;
  health: string;
  lastSuccessfulSync?: string;
  avgResponseMs: number;
  failureRatePct: number;
  itemsDiscovered: number;
  itemsPublished: number;
  duplicatePct: number;
  trustScore: number;
  autoPublish: boolean;
  isActive: boolean;
};

export type HardeningDashboard = {
  ok: boolean;
  at: string;
  tablesReady: boolean;
  systemStatus: "healthy" | "warning" | "critical" | "idle" | "unknown";
  rpc: {
    ok: boolean;
    engineStatsCallable: boolean;
    missingRequired: string[];
    missingGrants: string[];
  };
  connectors: {
    total: number;
    active: number;
    healthy: number;
    degraded: number;
    down: number;
    panel: HardeningConnector[];
  };
  analytics: {
    daily?: Record<string, unknown>;
    weekly?: Record<string, unknown>;
    monthly?: Record<string, unknown>;
    history?: Array<Record<string, unknown>>;
  };
  publishing24h: Record<string, unknown>;
  workers: Array<Record<string, unknown>>;
  incidents: Array<Record<string, unknown>>;
  fiqhMigration: { ok: boolean; migrated: number; failed: number; pending: number };
  discoveredSources: Array<Record<string, unknown>>;
  openAlerts: Array<Record<string, unknown>>;
  cronStatus: Array<Record<string, unknown>>;
  pipelineFailures: Array<Record<string, unknown>>;
  queueMetrics: { pending: number; running: number; failed: number };
  retryQueue: Array<Record<string, unknown>>;
  rejectedQueue: Array<Record<string, unknown>>;
  pipeline: {
    stages: Array<{ name: string; count: number }>;
    queue: { pending: number; running: number; failed: number };
    avgAiConfidence: number;
  };
};

async function hardeningFetch(action: string, body?: Record<string, unknown>) {
  const res = await adminFetch(`/api/admin/ake-hardening?action=${action}`, {
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Hardening API ${action} failed`);
  }
  return res.json();
}

export async function fetchHardeningDashboard(): Promise<HardeningDashboard> {
  return hardeningFetch("dashboard");
}

export async function runFiqhMigration(dryRun = false, limit = 50) {
  return hardeningFetch("migrate-fiqh", { dryRun, limit });
}

export async function runIncidentRecovery() {
  return hardeningFetch("recover", {});
}

export async function repairAkeRpc(force = false) {
  return hardeningFetch("repair-rpc", { force });
}

export async function runSourceDiscovery(urls: string[] = [], limit = 5) {
  return hardeningFetch("discover-sources", { urls, limit });
}

export async function applyHardeningMigration() {
  return hardeningFetch("apply-migration", {});
}
