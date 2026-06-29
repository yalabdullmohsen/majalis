/**
 * Global Knowledge Engine (GKE) — client API
 */
import { adminFetch } from "@/lib/admin-api";

export type GkeLayerStatus = {
  id: string;
  label: string;
  phase: number;
  status: "active" | "pending";
  implementation?: string;
  delegate?: string[];
};

export type GkeDashboard = {
  ok: boolean;
  version: string;
  phase: number;
  health: {
    version: string;
    phase: number;
    status: string;
    score: number;
    layers: GkeLayerStatus[];
    subsystems: Record<string, unknown>;
    principles?: string[];
  };
  validation: {
    ok: boolean;
    layers: GkeLayerStatus[];
    duration_ms?: number;
  };
  pipeline: string[];
};

export async function getGkeDashboard(): Promise<GkeDashboard> {
  const res = await adminFetch("/api/admin/global-knowledge-engine?action=dashboard");
  if (!res.ok) throw new Error("gke_dashboard_failed");
  return res.json();
}

export async function validateGkeArchitecture() {
  const res = await adminFetch("/api/admin/global-knowledge-engine?action=validate");
  if (!res.ok) throw new Error("gke_validate_failed");
  return res.json();
}

export async function runGkeDryRun(sample?: {
  title?: string;
  body?: string;
  content_kind?: string;
}) {
  const res = await adminFetch("/api/admin/global-knowledge-engine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "dry-run", sample }),
  });
  return res.json();
}
