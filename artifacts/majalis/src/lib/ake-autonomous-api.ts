import { adminFetch } from "@/lib/admin-api";

export type AutonomousDashboard = {
  ok: boolean;
  at: string;
  systemStatus: string;
  pipelineStages: string[];
  contentTypes: Record<string, { table: string; label: string }>;
  queue: { pending: number; review: number };
  rejections24h: Array<Record<string, unknown>>;
  topRejectionReasons: Array<{ reason: string; count: number }>;
  publishing24h: Record<string, number>;
  connectors: { active: number; healthy: number; failing: number };
  monitoring: Record<string, unknown>;
  hourlyReports: Array<Record<string, unknown>>;
  weeklyReports: Array<Record<string, unknown>>;
  contentEngines: Record<string, unknown> | null;
};

async function akeAutonomousFetch(action: string, body?: Record<string, unknown>) {
  const res = await adminFetch(`/api/admin/ake-autonomous?action=${action}`, {
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `AKE autonomous API ${action} failed`);
  }
  return res.json();
}

export async function fetchAutonomousDashboard(): Promise<AutonomousDashboard> {
  return akeAutonomousFetch("dashboard");
}

export async function runAutonomousCycle(includeContentEngines = true) {
  return akeAutonomousFetch("run-cycle", { includeContentEngines });
}

export async function generateAutonomousReport(type: string, force = false) {
  return akeAutonomousFetch("report", { type, force });
}
