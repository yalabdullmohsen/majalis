import { supabase } from "@/lib/supabase";
import { logSupabaseError } from "@/lib/supabase-config";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { countVerifiedAdhkarItems } from "@/lib/adhkar-supabase";
import type { CmsContentKind } from "./content-types";

export type CmsDashboardStats = {
  indexTotal: number;
  indexByKind: Record<string, number>;
  importJobsTotal: number;
  contentImportJobsTotal: number;
  verifiedAdhkarTotal: number;
  lastImportAt: string | null;
  lastImportStatus: string | null;
  lastImportType: string | null;
  lastImportImported: number | null;
  duplicateKeys: number;
  scheduledCount: number;
  archivedCount: number;
  auditLogsToday: number;
  dbConnected: boolean;
  /** Which tables powered the dashboard (for debugging). */
  sources: string[];
};

async function safeCount(table: string): Promise<number | null> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    if (error.code !== "PGRST205") logSupabaseError(`count:${table}`, error);
    return null;
  }
  return count ?? 0;
}

export async function getCmsDashboardStats(): Promise<CmsDashboardStats> {
  const empty: CmsDashboardStats = {
    indexTotal: 0,
    indexByKind: {},
    importJobsTotal: 0,
    contentImportJobsTotal: 0,
    verifiedAdhkarTotal: 0,
    lastImportAt: null,
    lastImportStatus: null,
    lastImportType: null,
    lastImportImported: null,
    duplicateKeys: 0,
    scheduledCount: 0,
    archivedCount: 0,
    auditLogsToday: 0,
    dbConnected: isSupabaseConfigured(),
    sources: [],
  };

  if (!isSupabaseConfigured()) return empty;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const sources: string[] = [];

  try {
    const [
      cmsIndexTotal,
      legacyImportJobs,
      contentImportJobs,
      verifiedAdhkar,
      dedupKeys,
      scheduledCount,
      archivedCount,
      auditLogsToday,
    ] = await Promise.all([
      safeCount("cms_content_index"),
      safeCount("import_jobs"),
      safeCount("content_import_jobs"),
      countVerifiedAdhkarItems(),
      safeCount("content_dedup_keys"),
      safeCount("cms_content_index").then(async (n) => {
        if (n === null) return null;
        const { count, error } = await supabase
          .from("cms_content_index")
          .select("*", { count: "exact", head: true })
          .not("scheduled_at", "is", null);
        if (error) return null;
        return count ?? 0;
      }),
      safeCount("cms_content_index").then(async (n) => {
        if (n === null) return null;
        const { count, error } = await supabase
          .from("cms_content_index")
          .select("*", { count: "exact", head: true })
          .not("archived_at", "is", null);
        if (error) return null;
        return count ?? 0;
      }),
      safeCount("admin_audit_logs").then(async (n) => {
        if (n === null) return null;
        const { count, error } = await supabase
          .from("admin_audit_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfDay.toISOString());
        if (error) return null;
        return count ?? 0;
      }),
    ]);

    const indexByKind: Record<string, number> = {};
    if (cmsIndexTotal !== null) {
      sources.push("cms_content_index");
      const { data: kindRows } = await supabase.from("cms_content_index").select("content_kind");
      for (const row of kindRows || []) {
        const k = String(row.content_kind);
        indexByKind[k] = (indexByKind[k] || 0) + 1;
      }
    }

    if (legacyImportJobs !== null) sources.push("import_jobs");
    if (contentImportJobs !== null) sources.push("content_import_jobs");
    if (verifiedAdhkar !== null) sources.push("verified_adhkar_items");

    const indexTotal =
      cmsIndexTotal !== null && cmsIndexTotal > 0
        ? cmsIndexTotal
        : verifiedAdhkar !== null && verifiedAdhkar > 0
          ? verifiedAdhkar
          : cmsIndexTotal ?? verifiedAdhkar ?? 0;

    if (contentImportJobs !== null && legacyImportJobs === null) {
      // Production uses content import engine only
    }

    let lastImportAt: string | null = null;
    let lastImportStatus: string | null = null;
    let lastImportType: string | null = null;
    let lastImportImported: number | null = null;

    const { data: lastContentJob } = await supabase
      .from("content_import_jobs")
      .select("completed_at, status, type, imported, updated_at")
      .order("started_at", { ascending: false })
      .limit(1);

    if (lastContentJob?.[0]) {
      const j = lastContentJob[0];
      lastImportAt = j.completed_at || j.updated_at || null;
      lastImportStatus = j.status || null;
      lastImportType = j.type || null;
      lastImportImported = j.imported ?? null;
    } else {
      const { data: lastLegacyJob } = await supabase
        .from("import_jobs")
        .select("finished_at, status")
        .order("created_at", { ascending: false })
        .limit(1);
      if (lastLegacyJob?.[0]) {
        lastImportAt = lastLegacyJob[0].finished_at || null;
        lastImportStatus = lastLegacyJob[0].status || null;
      }
    }

    return {
      indexTotal,
      indexByKind,
      importJobsTotal: contentImportJobs ?? legacyImportJobs ?? 0,
      contentImportJobsTotal: contentImportJobs ?? 0,
      verifiedAdhkarTotal: verifiedAdhkar ?? 0,
      lastImportAt,
      lastImportStatus,
      lastImportType,
      lastImportImported,
      duplicateKeys: dedupKeys ?? 0,
      scheduledCount: scheduledCount ?? 0,
      archivedCount: archivedCount ?? 0,
      auditLogsToday: auditLogsToday ?? 0,
      dbConnected: true,
      sources,
    };
  } catch (err) {
    logSupabaseError("getCmsDashboardStats", err);
    return { ...empty, dbConnected: false };
  }
}

export type ContentImportJobRow = {
  id: string;
  type: string;
  status: string;
  filename: string | null;
  imported: number;
  skipped: number;
  failed: number;
  total_rows: number;
  completed_at: string | null;
  started_at: string;
};

export async function getRecentContentImportJobs(limit = 10): Promise<ContentImportJobRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("content_import_jobs")
    .select("id, type, status, filename, imported, skipped, failed, total_rows, completed_at, started_at")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code !== "PGRST205") logSupabaseError("getRecentContentImportJobs", error);
    return [];
  }
  return (data as ContentImportJobRow[]) || [];
}

export async function getRecentImportJobs(limit = 10) {
  if (!isSupabaseConfigured()) return [];

  const contentJobs = await getRecentContentImportJobs(limit);
  if (contentJobs.length) {
    return contentJobs.map((j) => ({
      id: j.id,
      content_kind: j.type,
      status: j.status,
      inserted_count: j.imported,
      updated_count: j.skipped,
      filename: j.filename,
      total_rows: j.total_rows,
    }));
  }

  const { data, error } = await supabase
    .from("import_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code !== "PGRST205") logSupabaseError("getRecentImportJobs", error);
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
    if (error.code !== "PGRST205") logSupabaseError("getDuplicateReport", error);
    return [];
  }

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
