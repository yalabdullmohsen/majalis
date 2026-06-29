import { adminFetch } from "@/lib/admin-api";

export type CmsOpsStats = {
  publishedToday: number;
  pendingReview: number;
  rejectedToday: number;
  importQueued: number;
  importProcessing: number;
  importCompletedToday: number;
  importFailedToday: number;
  importSuccessRatePct: number | null;
  automationRunsToday: number;
  workerStatus: string;
  queueStatus: string;
  databaseHealth: string;
  lastImport?: { id: string; type: string; status: string; updated_at: string; error_message?: string } | null;
  lastAutomation?: { engine_id: string; status: string; started_at: string; duration_ms?: number } | null;
};

export async function fetchCmsOpsStats(): Promise<{ ok: boolean; ops?: CmsOpsStats; error?: string }> {
  const res = await adminFetch("/api/admin/cms-ops?action=ops-stats");
  const json = await res.json();
  return json;
}

export async function runImportQueue(limit = 3): Promise<{ ok: boolean; processed?: number; error?: string }> {
  const res = await adminFetch("/api/admin/cms-ops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "run-import-queue", limit }),
  });
  return res.json();
}

export async function runCmsIntegrityCheck(): Promise<{ ok: boolean; integrity?: { issues: unknown[] } }> {
  const res = await adminFetch("/api/admin/cms-ops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "integrity-check" }),
  });
  return res.json();
}
