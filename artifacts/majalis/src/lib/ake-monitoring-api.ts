import { adminFetch } from "@/lib/admin-api";

export type AkeAlert = {
  id: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  title?: string;
  message: string;
  status?: string;
  connector_slug?: string;
  dedupe_key?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

export type CronStatus = {
  name: string;
  label: string;
  schedule: string;
  lastRun: string | null;
  lastStatus: string;
  durationMs?: number;
  errorMessage?: string;
};

export type MonitoringDashboard = {
  ok: boolean;
  at: string;
  systemStatus: "healthy" | "warning" | "critical" | "idle" | "unknown";
  connectors: { active: number; healthy: number; failing: number };
  publishing24h: {
    lessons: number;
    benefits: number;
    questions: number;
    knowledgePublished: number;
    fetched: number;
    rejected: number;
  };
  openAlerts: AkeAlert[];
  criticalAlerts: AkeAlert[];
  cronStatus: CronStatus[];
  pipelineFailures: Array<Record<string, unknown>>;
  sourceEvents: Array<Record<string, unknown>>;
  dailyReports: Array<Record<string, unknown>>;
  tablesReady: boolean;
};

async function monitoringFetch(action: string, body?: Record<string, unknown>) {
  const res = await adminFetch(`/api/admin/ake-monitoring?action=${action}`, {
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Monitoring API ${action} failed`);
  }
  return res.json();
}

export async function fetchMonitoringDashboard(): Promise<MonitoringDashboard> {
  return monitoringFetch("dashboard");
}

export async function resolveMonitoringAlert(alertId: string, ignored = false) {
  return monitoringFetch("resolve", { alertId, ignored });
}

export async function sendMonitoringTestAlert() {
  return monitoringFetch("test-alert", {});
}

export async function generateMonitoringReport(force = false) {
  return monitoringFetch("generate-report", { force });
}

export async function evaluateMonitoringRulesNow() {
  return monitoringFetch("evaluate", {});
}
