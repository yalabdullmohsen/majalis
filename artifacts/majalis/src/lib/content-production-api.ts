import { adminFetch } from "@/lib/admin-api";

export type ContentProductionDashboard = {
  ok?: boolean;
  flow?: string[];
  pipelines?: Record<string, unknown>;
  cronJobs?: string[];
  jobs?: Array<{
    id: string;
    name_ar: string;
    interval_label: string;
    last_run_at?: string;
    last_success_at?: string;
    last_duration_ms?: number;
    last_status?: string;
  }>;
  sources?: Array<{ slug: string; name: string; pipeline: string; active: boolean; trust_level: number }>;
  production?: {
    today: { produced: number; published: number; rejected: number; duplicate: number; byPipeline: unknown[] };
    week: { produced: number; published: number; rejected: number };
    month: { produced: number; published: number; rejected: number };
  };
  observability?: {
    logs: unknown[];
    retries: unknown[];
    dlq: unknown[];
    health: unknown[];
    alerts: unknown[];
    runs: unknown[];
  };
  readiness?: { score: number; activeSources: number; healthyJobs: number; openAlerts: number };
};

export async function getContentProductionDashboard(): Promise<ContentProductionDashboard> {
  const res = await adminFetch("/api/admin/content-production?action=dashboard");
  if (!res.ok) throw new Error("Failed to load content production dashboard");
  return res.json();
}

export async function runContentProductionJob(jobId: string) {
  const res = await adminFetch(`/api/admin/content-production?action=run-job&job=${encodeURIComponent(jobId)}`, {
    method: "POST",
  });
  return res.json();
}

export async function getContentProductionObservability() {
  const res = await adminFetch("/api/admin/content-production?action=observability");
  return res.json();
}

export async function processContentRetryQueue() {
  const res = await adminFetch("/api/admin/content-production?action=retry-queue", { method: "POST" });
  return res.json();
}
