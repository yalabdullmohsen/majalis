import { adminFetch } from "@/lib/admin-api";

export type LockdownReport = {
  at: string;
  healthScore: number;
  readinessPct: number;
  systems: Array<{ id: string; name: string; status: string; evidence: string; cron?: string | null }>;
  crons: Array<{
    path: string;
    schedule: string;
    lastRun?: string | null;
    durationMs?: number | null;
    lastResult?: string;
    lastError?: string | null;
    successCount?: number;
    failureCount?: number;
    endpointReachable?: boolean;
    httpStatus?: number;
  }>;
  routes: Array<{ route: string; ok: boolean; status: number; ms: number }>;
  apis: Array<{ path: string; ok: boolean; status: number; ms: number }>;
  scores: Record<string, string | number>;
  dataIntegrity: { issueCount: number; issues: unknown[] };
  akpHealth: { readinessPct: number; blockers: unknown[] };
};

export async function fetchProductionLockdownReport(): Promise<LockdownReport> {
  const res = await adminFetch("/api/admin/production-lockdown?action=report");
  if (!res.ok) throw new Error("Failed to load lockdown report");
  const json = await res.json();
  return json.report;
}

export async function runProductionRecovery(): Promise<{ ok: boolean }> {
  const res = await adminFetch("/api/admin/production-lockdown?action=recovery", { method: "POST" });
  const json = await res.json();
  return { ok: json.ok === true };
}
