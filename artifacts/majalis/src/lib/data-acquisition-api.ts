/**
 * GKE Data Acquisition — client API
 */
import { adminFetch } from "@/lib/admin-api";

export type AcquisitionMetrics = {
  total_sources: number;
  active_sources: number;
  total_imported: number;
  total_accepted: number;
  total_rejected: number;
  total_duplicate: number;
  success_rate: number;
  duplicate_rate: number;
  validation_rate: number;
  avg_processing_ms: number;
  queue_size: number;
  shadow_mode: boolean;
};

export type AcquisitionDashboard = {
  ok: boolean;
  shadow_mode: { enabled: boolean; auto_publish: boolean; description: string };
  metrics: AcquisitionMetrics;
  best_sources: Array<Record<string, unknown>>;
  worst_sources: Array<Record<string, unknown>>;
  most_active: Array<Record<string, unknown>>;
  recent_shadow_items: Array<Record<string, unknown>>;
  recent_errors: Array<{ slug: string; error: string }>;
  integration_phases: Array<{ content_kind: string; label_ar: string; enabled: boolean }>;
  production_ready: Record<string, unknown>;
};

export async function getAcquisitionDashboard(): Promise<AcquisitionDashboard> {
  const res = await adminFetch("/api/admin/global-knowledge-engine?action=acquisition");
  if (!res.ok) throw new Error("acquisition_dashboard_failed");
  return res.json();
}

export async function syncGkeSources() {
  const res = await adminFetch("/api/admin/global-knowledge-engine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sync-sources" }),
  });
  return res.json();
}

export async function runShadowSync(slug: string) {
  const res = await adminFetch("/api/admin/global-knowledge-engine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "shadow-sync", slug }),
  });
  return res.json();
}

export async function initAcquisition() {
  const res = await adminFetch("/api/admin/global-knowledge-engine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "init-acquisition" }),
  });
  return res.json();
}
