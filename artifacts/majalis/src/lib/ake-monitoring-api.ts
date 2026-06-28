import { requestFetch } from "@/lib/request-manager";

export type MonitoringDashboard = {
  ok: boolean;
  at: string;
  systemStatus: string;
  connectors: { active: number; healthy: number; failing: number };
  publishing24h: Record<string, number>;
  openAlerts: Array<{ id?: string; title?: string; severity?: string; message?: string }>;
  criticalAlerts: unknown[];
  cronStatus: Array<{ name: string; lastRun: string | null; lastStatus: string }>;
  pipelineFailures: unknown[];
  sourceEvents: unknown[];
  dailyReports: unknown[];
};

export async function fetchAkeMonitoringDashboard(): Promise<MonitoringDashboard> {
  const res = await requestFetch("/api/admin/ake-monitoring?action=dashboard");
  if (!res.ok) throw new Error(`Monitoring API ${res.status}`);
  return res.json();
}

export async function fetchAkeRejections(limit = 50) {
  const res = await requestFetch(`/api/admin/ake-monitoring?action=rejections&limit=${limit}`);
  if (!res.ok) throw new Error(`Rejections API ${res.status}`);
  return res.json();
}

export async function evaluateMonitoringRules() {
  const res = await requestFetch("/api/admin/ake-monitoring?action=evaluate");
  if (!res.ok) throw new Error(`Evaluate API ${res.status}`);
  return res.json();
}
