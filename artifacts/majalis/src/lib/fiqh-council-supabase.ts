import { supabase } from "./supabase";
import { logSupabaseError } from "./supabase-config";
import {
  FIQH_COUNCIL_ALL_SEED,
  FIQH_COUNCIL_ADMIN_ONLY_SEED,
} from "./fiqh-council-seed";
import type {
  FiqhCouncilItem,
  FiqhItemStatus,
  FiqhCouncilSource,
  FiqhSyncJob,
  FiqhDuplicateRecord,
  FiqhAuditEntry,
} from "./fiqh-council-types";

const TABLE = "fiqh_council_items";
const now = () => new Date().toISOString();

function isMissingTableError(err: unknown) {
  const msg = String((err as { message?: string })?.message || err || "");
  return msg.includes("fiqh_council_items") || msg.includes("does not exist") || msg.includes("42P01");
}

export async function adminGetAllFiqhCouncilItems() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return { data: FIQH_COUNCIL_ALL_SEED, error: null, usingSeed: true };
    }
    logSupabaseError("adminGetAllFiqhCouncilItems", error);
    return { data: FIQH_COUNCIL_ALL_SEED, error, usingSeed: true };
  }

  if (!data?.length) {
    return { data: FIQH_COUNCIL_ALL_SEED, error: null, usingSeed: true };
  }
  return { data: data as FiqhCouncilItem[], error: null, usingSeed: false };
}

export async function adminUpsertFiqhCouncilItem(row: Record<string, unknown>) {
  const payload: Record<string, unknown> = {
    ...row,
    updated_at: now(),
  };
  if (payload.status === "published" && !payload.published_at) {
    payload.published_at = now();
  }
  delete payload.id;

  if (row.id && !String(row.id).startsWith("seed-")) {
    return await supabase.from(TABLE).update(payload).eq("id", row.id);
  }

  if (row.slug) {
    const existing = await supabase.from(TABLE).select("id").eq("slug", row.slug).maybeSingle();
    if (existing.data?.id) {
      return await supabase.from(TABLE).update(payload).eq("id", existing.data.id);
    }
  }

  return await supabase.from(TABLE).insert(payload);
}

export async function adminDeleteFiqhCouncilItem(id: string) {
  if (String(id).startsWith("seed-")) {
    return { data: null, error: { message: "لا يمكن حذف بيانات البذور المحلية" } };
  }
  return await supabase.from(TABLE).delete().eq("id", id);
}

async function writeFiqhAudit(entry: {
  item_id?: string;
  action: string;
  from_status?: string;
  to_status?: string;
  notes?: string;
  payload?: Record<string, unknown>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("fiqh_council_audit").insert({
    ...entry,
    actor_id: user?.id,
    actor_email: user?.email,
    payload: entry.payload || {},
  });
}

export async function adminSetFiqhCouncilItemStatus(id: string, status: FiqhItemStatus, notes?: string) {
  if (String(id).startsWith("seed-")) {
    return { data: null, error: { message: "لا يمكن تغيير حالة بيانات البذور المحلية" } };
  }
  const { data: current } = await supabase.from(TABLE).select("status").eq("id", id).maybeSingle();
  const payload: Record<string, unknown> = { status, updated_at: now() };
  if (status === "published") payload.published_at = now();
  if (status === "approved") payload.approved_at = now();
  if (status === "archived") payload.archived_at = now();
  if (status === "rejected") payload.rejected_at = now();
  const result = await supabase.from(TABLE).update(payload).eq("id", id);
  if (!result.error) {
    await writeFiqhAudit({
      item_id: id,
      action: `status_${status}`,
      from_status: current?.status,
      to_status: status,
      notes,
    });
  }
  return result;
}

export async function adminApproveFiqhCouncilItem(id: string) {
  return adminSetFiqhCouncilItemStatus(id, "approved", "اعتماد المحتوى");
}

export async function adminRejectFiqhCouncilItem(id: string, reason: string) {
  if (String(id).startsWith("seed-")) {
    return { data: null, error: { message: "لا يمكن رفض بيانات البذور المحلية" } };
  }
  const result = await supabase.from(TABLE).update({
    status: "rejected",
    rejection_reason: reason,
    rejected_at: now(),
    updated_at: now(),
  }).eq("id", id);
  if (!result.error) {
    await writeFiqhAudit({ item_id: id, action: "reject", to_status: "rejected", notes: reason });
  }
  return result;
}

export async function adminPublishFiqhCouncilItem(id: string) {
  return adminSetFiqhCouncilItemStatus(id, "published", "نشر للعامة");
}

export async function adminGetFiqhCouncilItemPreview(slug: string) {
  const { data } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
  if (data) return { data: data as FiqhCouncilItem, error: null };
  const seed = FIQH_COUNCIL_ALL_SEED.find((item) => item.slug === slug);
  return { data: seed || null, error: seed ? null : { message: "غير موجود" } };
}

export function getAdminOnlySeedItems() {
  return FIQH_COUNCIL_ADMIN_ONLY_SEED;
}

export async function adminGetFiqhCouncilSources() {
  const { data, error } = await supabase
    .from("fiqh_council_sources")
    .select("*")
    .order("name");
  if (error) {
    if (isMissingTableError(error)) return { data: [] as FiqhCouncilSource[], error: null };
    return { data: [], error };
  }
  return { data: (data || []) as FiqhCouncilSource[], error: null };
}

export async function adminGetFiqhSyncJobs(limit = 20) {
  const { data, error } = await supabase
    .from("fiqh_council_sync_jobs")
    .select("*, fiqh_council_sources(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return { data: [] as FiqhSyncJob[], error: null };
    return { data: [], error };
  }
  return { data: (data || []) as FiqhSyncJob[], error: null };
}

export async function adminGetFiqhSyncLogs(jobId: string, limit = 50) {
  const { data, error } = await supabase
    .from("fiqh_council_sync_logs")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return { data: [], error: null };
    return { data: [], error };
  }
  return { data: data || [], error: null };
}

export async function adminTriggerFiqhSync(sourceSlugs?: string[]) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { ok: false, error: "يجب تسجيل الدخول" };

  const res = await fetch("/api/admin/sync-fiqh-council", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sourceSlugs: sourceSlugs || null }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: json.message || "فشلت المزامنة" };
  return { ok: true, result: json };
}

export async function adminArchiveFiqhCouncilItem(id: string) {
  if (String(id).startsWith("seed-")) {
    return { data: null, error: { message: "لا يمكن أرشفة بيانات البذور المحلية" } };
  }
  const result = await supabase.from(TABLE).update({
    status: "archived",
    archived_at: now(),
    updated_at: now(),
  }).eq("id", id);
  if (!result.error) {
    await writeFiqhAudit({ item_id: id, action: "archive", to_status: "archived" });
  }
  return result;
}

export async function adminGetFiqhDuplicates(limit = 30) {
  const { data, error } = await supabase
    .from("fiqh_council_duplicates")
    .select("*")
    .eq("status", "pending")
    .order("similarity_score", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return { data: [] as FiqhDuplicateRecord[], error: null };
    return { data: [], error };
  }
  return { data: (data || []) as FiqhDuplicateRecord[], error: null };
}

export async function adminResolveDuplicate(id: string, action: "merged" | "ignored") {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from("fiqh_council_duplicates").update({
    status: action,
    resolved_by: user?.id,
    resolved_at: now(),
  }).eq("id", id);
}

export async function adminGetFiqhAuditLog(itemId?: string, limit = 30) {
  let query = supabase.from("fiqh_council_audit").select("*").order("created_at", { ascending: false }).limit(limit);
  if (itemId) query = query.eq("item_id", itemId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return { data: [] as FiqhAuditEntry[], error: null };
    return { data: [], error };
  }
  return { data: (data || []) as FiqhAuditEntry[], error: null };
}

export async function adminGetFiqhStats() {
  const { data: items } = await adminGetAllFiqhCouncilItems();
  const all = items || [];
  return {
    total: all.length,
    published: all.filter((i) => i.status === "published").length,
    needsReview: all.filter((i) => ["imported", "needs_review", "review", "approved"].includes(i.status || "")).length,
    draft: all.filter((i) => i.status === "draft").length,
    archived: all.filter((i) => i.status === "archived").length,
    rejected: all.filter((i) => i.status === "rejected").length,
  };
}

export async function adminGetFiqhResearchLogs(limit = 30) {
  const { data, error } = await supabase
    .from("fiqh_research_search_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return { data: [], error: null };
    return { data: [], error };
  }
  return { data: data || [], error: null };
}

export async function adminGetFiqhResearchAnalytics(days = 30) {
  const { data, error } = await supabase.rpc("fiqh_research_analytics", { days });
  if (error) {
    if (isMissingTableError(error)) return { data: null, error: null };
    return { data: null, error };
  }
  return { data, error: null };
}

export async function adminGetFiqhUnanswered(limit = 30) {
  const { data, error } = await supabase
    .from("fiqh_research_unanswered")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return { data: [], error: null };
    return { data: [], error };
  }
  return { data: data || [], error: null };
}

export async function adminSetFiqhResearchEnabled(enabled: boolean) {
  return supabase
    .from("fiqh_research_settings")
    .update({ is_enabled: enabled, updated_at: now() })
    .eq("id", 1);
}

export async function adminLinkUnansweredQuestion(id: string, itemId: string) {
  return supabase.from("fiqh_research_unanswered").update({
    status: "linked",
    linked_item_id: itemId,
    resolved_at: now(),
  }).eq("id", id);
}

export async function adminDismissUnansweredQuestion(id: string) {
  return supabase.from("fiqh_research_unanswered").update({
    status: "dismissed",
    resolved_at: now(),
  }).eq("id", id);
}

// Legacy wrappers for fiqh_council_decisions table (kept for other admin sections)
export {
  adminGetAllFiqhDecisions,
  adminUpsertFiqhDecision,
  adminDeleteFiqhDecision,
  adminSetPlatformContentStatus,
} from "./platform-supabase";
