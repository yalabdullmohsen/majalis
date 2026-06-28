import { adminFetch } from "@/lib/admin-api";

const API = "/api/admin/deployment-pipeline";

export type DeploymentDashboard = {
  ok: boolean;
  stats: {
    lastDeployment: Record<string, unknown> | null;
    lastPipelineRun: Record<string, unknown> | null;
    lastRollback: Record<string, unknown> | null;
    stats: {
      totalDeploys: number;
      successDeploys: number;
      rollbackCount: number;
      autoMergeCount: number;
      deploySuccessRate: number | null;
    };
    recentRuns: Array<Record<string, unknown>>;
    recentDeployments: Array<Record<string, unknown>>;
    selfHealEvents: Array<Record<string, unknown>>;
  };
  health: {
    ok?: boolean;
    production?: boolean;
    supabase?: { status?: string };
    cron?: { secretConfigured?: boolean; status?: string };
    ai?: { status?: string };
    queue?: { pending?: number; failed?: number; status?: string };
    database?: { status?: string };
    metrics?: Record<string, unknown>;
    errors?: string[];
  };
  vercel: Array<{
    id: string;
    url: string;
    state: string;
    createdAt: number;
    commitSha?: string;
  }>;
  version?: string;
  at?: string;
};

export async function fetchDeploymentDashboard(): Promise<DeploymentDashboard> {
  const res = await adminFetch(`${API}?action=dashboard`);
  if (!res.ok) throw new Error("Failed to load deployment dashboard");
  return res.json();
}

export async function runPostDeployVerify() {
  const res = await adminFetch(`${API}?action=verify`, { method: "POST" });
  return res.json();
}

export async function runProductionSelfHeal() {
  const res = await adminFetch(`${API}?action=heal`, { method: "POST" });
  return res.json();
}
