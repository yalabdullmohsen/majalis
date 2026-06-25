import { supabase } from "@/lib/supabase";
import { logSupabaseError } from "@/lib/supabase-config";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import type { CmsContentKind } from "./content-types";

export type CmsDashboardStats = {
  indexTotal: number;
  indexByKind: Record<string, number>;
  importJobsTotal: number;
  lastImportAt: string | null;
  lastImportStatus: string | null;
  duplicateKeys: number;
  scheduledCount: number;
  archivedCount: number;
  auditLogsToday: number;
  dbConnected: boolean;
};

export async function getCmsDashboardStats(): Promise<CmsDashboardStats> {
  const empty: CmsDashboardStats = {
    indexTotal: 0,
    indexByKind: {},
    importJobsTotal: 0,
    lastImportAt: null,
    lastImportStatus: null,
    duplicateKeys: 0,
    scheduledCount: 0,
    archivedCount: 0,
    auditLogsToday: 0,
    dbConnected: isSupabaseConfigured(),
  };

  if (!isSupabaseConfigured()) return empty;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const [
      { count: indexTotal },
      { data: kindRows },
      { count: importJobsTotal },
      { data: lastJob },
      { count: duplicateKeys },
      { count: scheduledCount },
      { count: archivedCount },
      { count: auditLogsToday },
    ] = await Promise.all([
      supabase.from("cms_content_index").select("*", { count: "exact", head: true }),
      supabase.from("cms_content_index").select("content_kind"),
      supabase.from("import_jobs").select("*", { count: "exact", head: true }),
      supabase.from("import_jobs").select("finished_at, status").order("created_at", { ascending: false }).limit(1),
      supabase.from("content_dedup_keys").select("*", { count: "exact", head: true }),
      supabase.from("cms_content_index").select("*", { count: "exact", head: true }).not("scheduled_at", "is", null),
      supabase.from("cms_content_index").select("*", { count: "exact", head: true }).not("archived_at", "is", null),
      supabase.from("admin_audit_logs").select("*", { count: "exact", head: true }).gte("created_at", startOfDay.toISOString()),
    ]);

    const indexByKind: Record<string, number> = {};
    for (const row of kindRows || []) {
      const k = String(row.content_kind);
      indexByKind[k] = (indexByKind[k] || 0) + 1;
    }

    return {
      indexTotal: indexTotal || 0,
      indexByKind,
      importJobsTotal: importJobsTotal || 0,
      lastImportAt: lastJob?.[0]?.finished_at || null,
      lastImportStatus: lastJob?.[0]?.status || null,
      duplicateKeys: duplicateKeys || 0,
      scheduledCount: scheduledCount || 0,
      archivedCount: archivedCount || 0,
      auditLogsToday: auditLogsToday || 0,
      dbConnected: true,
    };
  } catch (err) {
    logSupabaseError("getCmsDashboardStats", err);
    return { ...empty, dbConnected: false };
  }
}

export async function getRecentImportJobs(limit = 10) {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("import_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError("getRecentImportJobs", error);
    return [];
  }
  return data || [];
}

export async function cmsUnifiedSearch(query: string, kinds?: CmsContentKind[], limit = 30) {
  if (!isSupabaseConfigured() || !query.trim()) return [];

  const { data, error } = await supabase.rpc("cms_search", {
    query: query.trim(),
    kinds: kinds || null,
    limit_per_kind: Math.ceil(limit / (kinds?.length || 5)),
  });

  if (error) {
    logSupabaseError("cmsUnifiedSearch", error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getDuplicateReport() {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from("content_dedup_keys")
    .select("content_kind, external_key, title_norm, record_table, record_id")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseError("getDuplicateReport", error);
    return [];
  }

  // Group by external_key duplicates
  const keyCounts = new Map<string, number>();
  for (const row of data || []) {
    if (!row.external_key) continue;
    const k = `${row.content_kind}:${row.external_key}`;
    keyCounts.set(k, (keyCounts.get(k) || 0) + 1);
  }

  return [...keyCounts.entries()]
    .filter(([, n]) => n > 1)
    .map(([key, count]) => ({ key, count }));
}
