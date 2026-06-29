import { adminFetch } from "@/lib/admin-api";

export type DataAcquisitionDashboard = {
  ok: boolean;
  storage: string;
  sources: {
    total: number;
    active: number;
    error: number;
    list: Array<{
      id: string;
      slug: string;
      name: string;
      source_type: string;
      trust_score: number;
      status: string;
      last_checked_at?: string;
      items_extracted_total?: number;
    }>;
  };
  items: {
    total: number;
    published: number;
    review: number;
    duplicate: number;
    rejected: number;
  };
  reviewQueue: number;
  metrics: { classificationAccuracyPct: number; publishRatePct: number };
  recentLogs: Array<{ id: string; level: string; message: string }>;
};

export async function getDataAcquisitionDashboard(): Promise<DataAcquisitionDashboard> {
  const res = await adminFetch("/api/admin/data-acquisition?action=dashboard");
  if (!res.ok) throw new Error("dashboard_failed");
  return res.json();
}

export async function runDataAcquisition(mode = "hourly") {
  const res = await adminFetch("/api/admin/data-acquisition", {
    method: "POST",
    body: JSON.stringify({ action: "run", mode }),
  });
  return res.json();
}

export async function runDataAcquisitionSource(sourceId: string) {
  const res = await adminFetch("/api/admin/data-acquisition", {
    method: "POST",
    body: JSON.stringify({ action: "run-source", sourceId }),
  });
  return res.json();
}

export async function toggleDataAcquisitionSource(sourceId: string) {
  const res = await adminFetch("/api/admin/data-acquisition", {
    method: "POST",
    body: JSON.stringify({ action: "source.toggle", sourceId }),
  });
  return res.json();
}

export async function seedDataAcquisitionSources() {
  const res = await adminFetch("/api/admin/data-acquisition", {
    method: "POST",
    body: JSON.stringify({ action: "seed" }),
  });
  return res.json();
}
