import { adminFetch } from "@/lib/admin-api";

export type ZeroTouchAudit = {
  readinessPct: number;
  healthScore: number;
  tablesEnabled: string;
  migrationsApplied: number;
  migrationsPending: number;
  migrationsFailed: number;
  cronJobsWorking: string;
  workersStatus: string;
  queueStatus: string;
  systemsOperational: string;
  deployVerified: boolean;
  deployHealthy: boolean;
  failedChecks: string[];
  criticalErrors: number;
  healthBreakdown: Array<{ id: string; label: string; score: number; detail: string }>;
  healthDeductions: Array<{ id: string; label: string; score: number; detail: string }>;
  manualIntervention?: Array<{ type: string; name: string; reason: string }>;
};

export type ZeroTouchInfo = {
  startupValidation: {
    tables: { expected: number; present: number; missing: string[] };
    issues: Array<{ type: string; name: string; autoFixable?: boolean }>;
    alerts: Array<{ severity: string; code: string; message: string }>;
    criticalCount: number;
  };
  migrationState: {
    applied: { count: number };
    pending: { count: number; names: string[] };
    failed: { count: number; items: Array<{ migration: string; scope: string; reason: string }> };
    scopes: Array<{ scope: string; status: string; missingTables: string[] }>;
  };
  automationVerify: {
    ok: boolean;
    failedChecks: string[];
    checks: Array<{ id: string; label: string; ok: boolean }>;
  };
  health: { healthScore: number; breakdown: ZeroTouchAudit["healthBreakdown"] };
  audit: ZeroTouchAudit;
  alerts: Array<{ severity: string; code: string; message: string }>;
  manualIntervention: Array<{ type: string; name: string; reason: string }>;
};

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
  zeroTouch?: ZeroTouchInfo;
};

export async function fetchProductionLockdownReport(zeroTouch = true): Promise<LockdownReport> {
  const qs = zeroTouch ? "?action=readiness" : "?action=report";
  const res = await adminFetch(`/api/admin/production-lockdown${qs}`);
  if (!res.ok) throw new Error("Failed to load lockdown report");
  const json = await res.json();
  return json.report;
}

export async function runProductionRecovery(): Promise<{ ok: boolean }> {
  const res = await adminFetch("/api/admin/production-lockdown?action=recovery", { method: "POST" });
  const json = await res.json();
  return { ok: json.ok === true };
}

export async function runZeroTouchActivate(): Promise<{ ok: boolean; activation?: unknown }> {
  const res = await adminFetch("/api/admin/production-lockdown?action=activate", { method: "POST" });
  const json = await res.json();
  return { ok: json.ok === true, activation: json.activation };
}

export async function runZeroTouchSelfHeal(): Promise<{ ok: boolean }> {
  const res = await adminFetch("/api/admin/production-lockdown?action=self-heal", { method: "POST" });
  const json = await res.json();
  return { ok: json.ok === true };
}
