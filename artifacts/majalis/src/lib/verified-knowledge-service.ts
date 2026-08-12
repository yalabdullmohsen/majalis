/**
 * Verified Knowledge Platform — admin client service
 */

import { adminFetch as apiFetch } from "@/lib/admin-api";

export type VerifiedSource = {
  slug: string;
  name: string;
  name_ar?: string;
  entity_name?: string;
  source_type: string;
  url?: string;
  trust_level: number;
  is_active: boolean;
  is_official?: boolean;
  licensing?: string;
  import_method?: string;
  connection_status?: string;
  items_imported?: number;
};

export type VerifiedSourcesDashboard = {
  total: number;
  official: number;
  active: number;
  sources: VerifiedSource[];
};

export type SectionQuality = {
  seed?: number;
  seed_items?: number;
  seed_categories?: number;
  db?: { total: number; verified: number };
};

export type QualityGap = {
  section: string;
  reason: string;
  priority: "high" | "medium" | "low";
};

export type QualityReport = {
  ok?: boolean;
  at?: string;
  report_date?: string;
  sections?: Record<string, SectionQuality>;
  totals?: {
    sources_total?: number;
    sources_active?: number;
    seed_corpus_total?: number;
    gaps_count?: number;
    verified_adhkar?: number;
    verified_hadith?: number;
    provenance_verified?: number;
  };
  gaps?: QualityGap[];
  recommendations?: string[];
  sources?: VerifiedSourcesDashboard;
};

export type VerifiedKnowledgeDashboard = {
  ok: boolean;
  report: QualityReport;
  sources: VerifiedSourcesDashboard;
};

async function vkFetch(action: string, body?: Record<string, unknown>) {
  const res = await apiFetch(`/api/admin/verified-knowledge?action=${action}`, {
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  if (!res.ok) throw new Error(`Verified knowledge API ${action} failed`);
  return res.json();
}

export async function fetchVerifiedKnowledgeDashboard(): Promise<VerifiedKnowledgeDashboard> {
  return vkFetch("dashboard");
}

export async function runVerifiedKnowledgeCycle(options?: {
  dryRun?: boolean;
  checkLinks?: boolean;
  persistVerification?: boolean;
}) {
  return vkFetch("run", options ?? {});
}

export async function bootstrapVerifiedKnowledge(options?: {
  dryRun?: boolean;
  persistProvenance?: boolean;
}) {
  return vkFetch("bootstrap", options ?? {});
}

export async function fetchVerifiedQualityReport(): Promise<{ ok: boolean; report: QualityReport }> {
  return vkFetch("report");
}
