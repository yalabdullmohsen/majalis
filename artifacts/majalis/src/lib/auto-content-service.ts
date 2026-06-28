import { adminFetch as apiFetch } from "@/lib/admin-api";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import type {
  AutoImportedContent,
  AutoImportLog,
  AutoImportRun,
  MergedUpdateItem,
  TrustedSource,
} from "@/lib/auto-content/auto-content-utils";
import { mapContentTypeToUpdateType } from "@/lib/auto-content/auto-content-utils";
import { requestFetch } from "@/lib/request-manager";

export type AutoContentJobStatus = {
  ok: boolean;
  jobId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  phase: string;
  progress: number;
  result: {
    fetched?: number;
    deduped?: number;
    published?: number;
    review?: number;
    failed?: number;
    imported?: number;
    skipped?: number;
    durationMs?: number;
  } | null;
  error: string | null;
  logs?: Array<{ at: string; phase: string; message: string }>;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
};

export type AutoContentJobSummary = {
  id: string;
  type: string;
  status: string;
  phase: string;
  progress: number;
  result?: AutoContentJobStatus["result"];
  error_message?: string | null;
  created_at?: string;
  finished_at?: string;
};

export async function adminGetAutoImportedContent(status?: string) {
  let q = supabase
    .from("auto_imported_content")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  return { data: (data || []) as AutoImportedContent[], error };
}

export async function adminGetTrustedSources() {
  const { data, error } = await supabase
    .from("trusted_sources")
    .select("*")
    .order("name");
  return { data: (data || []) as TrustedSource[], error };
}

export async function adminGetAutoImportLogs(limit = 30) {
  const { data, error } = await supabase
    .from("auto_import_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: (data || []) as AutoImportLog[], error };
}

export async function adminGetAutoImportRuns(limit = 10) {
  const { data, error } = await supabase
    .from("auto_import_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return { data: (data || []) as AutoImportRun[], error };
}

export async function adminGetAutoContentJobs(limit = 10) {
  const { data, error } = await supabase
    .from("auto_content_jobs")
    .select("id, type, status, phase, progress, result, error_message, created_at, finished_at, started_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: (data || []) as AutoContentJobSummary[], error };
}

export async function adminApproveAutoContent(id: string) {
  const { data, error } = await supabase
    .from("auto_imported_content")
    .update({
      status: "published",
      verification_status: "verified",
      pipeline_stage: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  return { data: data as AutoImportedContent | null, error };
}

export async function adminRejectAutoContent(id: string) {
  const { data, error } = await supabase
    .from("auto_imported_content")
    .update({
      status: "rejected",
      verification_status: "rejected",
      pipeline_stage: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  return { data: data as AutoImportedContent | null, error };
}

export async function getPublishedAutoContent(limit = 20) {
  const { data, error } = await supabase.rpc("get_published_auto_content", {
    p_limit: limit,
    p_content_type: null,
  });
  return { data: (data || []) as AutoImportedContent[], error };
}

export async function getPublishedAutoContentBySlug(slug: string) {
  const { data, error } = await supabase.rpc("get_published_auto_content_by_slug", {
    p_slug: slug,
  });
  const item = Array.isArray(data) ? data[0] : data;
  return { data: (item || null) as AutoImportedContent | null, error };
}

export async function fetchLiveAutoContent(limit = 20): Promise<AutoImportedContent[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const res = await requestFetch(`/api/auto-content?limit=${limit}`);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.items || []) as AutoImportedContent[];
  } catch {
    return [];
  }
}

export async function fetchLiveAutoContentBySlug(slug: string): Promise<AutoImportedContent | null> {
  try {
    const res = await requestFetch(`/api/auto-content?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return (json.item || json.items?.[0] || null) as AutoImportedContent | null;
  } catch {
    return null;
  }
}

export function autoContentToUpdateItem(item: AutoImportedContent): MergedUpdateItem {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    update_type: mapContentTypeToUpdateType(item.content_type),
    source_url: `/updates/auto/${item.slug}`,
    published_at: item.published_at || item.created_at,
    slug: item.slug,
    isAuto: true,
    source_name: item.source_name,
    seo_title: item.seo_title,
    seo_description: item.seo_description,
  };
}

export async function getMergedPlatformUpdates(limit = 100): Promise<{ data: MergedUpdateItem[]; usingSeed: boolean }> {
  const { getPlatformUpdates } = await import("@/lib/platform-content-service");

  const [platformRes, liveAuto] = await Promise.all([
    getPlatformUpdates(limit),
    fetchLiveAutoContent(limit),
  ]);

  const autoItems = liveAuto.map(autoContentToUpdateItem);
  const platformItems: MergedUpdateItem[] = (platformRes.data || []).map((u) => ({
    id: u.id,
    title: u.title,
    summary: u.summary,
    update_type: u.update_type,
    source_url: u.source_url,
    published_at: u.published_at,
    isAuto: false,
  }));

  const merged = [...platformItems, ...autoItems].sort((a, b) => {
    const da = new Date(a.published_at || 0).getTime();
    const db = new Date(b.published_at || 0).getTime();
    return db - da;
  });

  return { data: merged.slice(0, limit), usingSeed: platformRes.usingSeed && autoItems.length === 0 };
}

/** Start async auto-content sync job — returns immediately with jobId (< 1s). */
export async function startAutoContentJob(): Promise<{ ok: boolean; jobId: string; status: string }> {
  const res = await apiFetch("/api/admin/auto-content?action=start", { method: "POST" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "فشل بدء المزامنة");
  }
  return json;
}

/** Poll job status — short timeout safe for 2s polling interval. */
export async function getAutoContentJobStatus(jobId: string): Promise<AutoContentJobStatus> {
  const res = await apiFetch(
    `/api/admin/auto-content?action=status&jobId=${encodeURIComponent(jobId)}`,
    { method: "GET" },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "تعذر قراءة حالة المهمة");
  }
  return json as AutoContentJobStatus;
}

export async function cancelAutoContentJob(jobId: string) {
  const res = await apiFetch(
    `/api/admin/auto-content?action=cancel&jobId=${encodeURIComponent(jobId)}`,
    { method: "POST" },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "فشل إلغاء المهمة");
  }
  return json;
}

/** @deprecated Use startAutoContentJob + polling instead */
export async function triggerAutoContentSync() {
  return startAutoContentJob();
}

export async function fetchAutoContentPipelineStats() {
  const res = await apiFetch("/api/admin/auto-content?action=stats");
  if (!res.ok) return null;
  return res.json();
}

export const AUTO_CONTENT_PHASE_LABELS: Record<string, string> = {
  queued: "في الانتظار",
  fetch_sources: "جلب المصادر",
  normalize: "تطبيع البيانات",
  validate: "التحقق",
  dedup: "إزالة التكرار",
  classify: "التصنيف",
  ai_enrich: "تحليل AI",
  publish: "النشر",
  reindex: "إعادة الفهرسة",
  done: "اكتمل",
  failed: "فشل",
  cancelled: "أُلغي",
};
