import { adminFetch } from "@/lib/admin-api";

async function postTkn(body: Record<string, unknown>) {
  const res = await adminFetch("/api/admin/trusted-knowledge-network", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export type TknSource = {
  id?: string;
  slug?: string;
  name: string;
  source_type: string;
  source_url: string;
  category?: string;
  priority?: number;
  trust_score?: number;
  fetch_interval_hours?: number;
  active?: boolean;
  success_rate?: number;
  items_imported?: number;
  items_published?: number;
  last_sync_at?: string;
  last_error?: string;
  content_types?: string[];
  parser?: string;
  publication_policy?: { auto_publish?: boolean; min_trust?: number };
  connector_config?: Record<string, unknown>;
  type_label?: string;
};

export type TknOperation = {
  id: string;
  operation: string;
  status: string;
  items_found?: number;
  items_published?: number;
  duration_ms?: number;
  error_message?: string;
  created_at: string;
};

export async function getTknDashboard() {
  return postTkn({ action: "dashboard" });
}

export async function listTknSources(activeOnly = false) {
  return postTkn({ action: "list-sources", activeOnly });
}

export async function upsertTknSource(source: TknSource) {
  return postTkn({ action: "upsert-source", source });
}

export async function toggleTknSource(sourceId: string, active: boolean) {
  return postTkn({ action: "toggle-source", sourceId, active });
}

export async function syncTknSource(sourceId: string, contentType?: string) {
  return postTkn({ action: "sync-source", sourceId, contentType });
}

export async function listTknOperations(sourceId?: string) {
  return postTkn({ action: "list-operations", sourceId, limit: 50 });
}

export async function updateTknQuotas(dailyQuotas: Record<string, number>) {
  return postTkn({ action: "update-quotas", dailyQuotas });
}

export async function getTknSettings() {
  return postTkn({ action: "get-settings" });
}

export async function runTknPipeline(pipeline: string) {
  return postTkn({ action: "run-pipeline", pipeline });
}

export const TKN_SOURCE_TYPES = [
  ["rss", "RSS Feed"],
  ["json", "JSON Feed"],
  ["xml", "XML Feed"],
  ["rest", "REST API"],
  ["csv", "CSV File"],
  ["markdown", "Markdown"],
  ["html", "HTML Parser"],
  ["database", "Local Database"],
] as const;

export const TKN_CONTENT_TYPES = [
  ["benefits", "فوائد"],
  ["questions", "أسئلة"],
  ["hadith", "أحاديث"],
  ["rulings", "أحكام"],
  ["stories", "قصص"],
  ["articles", "مقالات"],
] as const;
