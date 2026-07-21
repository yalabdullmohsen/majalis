import { requestFetch } from "@/lib/request-manager";
import { supabase } from "./supabase";
import { logSupabaseError } from "./supabase-config";
import {
  FIQH_COUNCIL_ALL_SEED,
  FIQH_COUNCIL_ADMIN_ONLY_SEED,
} from "./fiqh-council-seed";
import {
  calculateCompletionScore,
  verifyFiqhItem,
  type FiqhVerificationIssue,
} from "./fiqh-verification-service";
import type {
  FiqhCouncilItem,
  FiqhItemStatus,
  FiqhCouncilSource,
  FiqhSyncJob,
  FiqhDuplicateRecord,
  FiqhAuditEntry,
  FiqhReviewLog,
  FiqhQualityStats,
} from "./fiqh-council-types";

const TABLE = "fiqh_council_items";
const now = () => new Date().toISOString();

function isMissingTableError(err: unknown) {
  const e = err as { message?: string; code?: string } | null;
  const msg = String(e?.message || err || "");
  const code = String(e?.code || "");
  // "Could not find the function/table ... in the schema cache" هي رسالة PostgREST
  // القياسية (كود PGRST202/PGRST205) لدالة RPC أو جدول غير موجودَين إطلاقًا في
  // قاعدة البيانات — نمط أوسع من فحص اسم جدول واحد فقط، مطابق لنفس النمط
  // المُستخدَم في rulings-service.ts لنفس فئة الخطأ. بدونه، دوال RPC غير موجودة
  // فعليًا (مثل fiqh_council_quality_stats وfiqh_research_analytics) كانت لا
  // تسقط تلقائيًا لبيانات احتياطية محسوبة، فتُظهر لوحات تحكم المشرف إحصاءات
  // صفرية بصمت (2026-07-16). نفحص code وmessage معًا لأن PostgREST يُرجعهما
  // كحقلين منفصلين، لا كود مُضمَّن داخل نص الرسالة بالضرورة.
  return (
    msg.includes("fiqh_council_items") ||
    msg.includes("does not exist") ||
    msg.includes("42P01") ||
    /Could not find/i.test(msg) ||
    code === "PGRST202" ||
    code === "PGRST205"
  );
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
  const item = row as FiqhCouncilItem;
  const completion_score = calculateCompletionScore(item);
  const verification = verifyFiqhItem({ ...item, completion_score } as FiqhCouncilItem);

  const payload: Record<string, unknown> = {
    ...row,
    completion_score,
    verification_issues: verification.issues,
    updated_at: now(),
  };
  if (payload.status === "published" && !payload.published_at) {
    payload.published_at = now();
  }
  if (verification.needsReview && payload.status === "published") {
    payload.status = "needs_review";
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

async function writeFiqhReviewLog(entry: {
  item_id?: string;
  session_id?: string;
  action: string;
  from_status?: string;
  to_status?: string;
  notes?: string;
  completion_score?: number;
  verification_issues?: FiqhVerificationIssue[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("fiqh_review_logs").insert({
    ...entry,
    actor_id: user?.id,
    actor_email: user?.email,
    verification_issues: entry.verification_issues || [],
  });
}

async function logReviewTransition(
  itemId: string,
  action: string,
  fromStatus: string | undefined,
  toStatus: string | undefined,
  notes?: string,
  extra?: { completion_score?: number; verification_issues?: FiqhVerificationIssue[] },
) {
  await writeFiqhAudit({
    item_id: itemId,
    action,
    from_status: fromStatus,
    to_status: toStatus,
    notes,
    payload: extra as Record<string, unknown>,
  });
  await writeFiqhReviewLog({
    item_id: itemId,
    action,
    from_status: fromStatus,
    to_status: toStatus,
    notes,
    completion_score: extra?.completion_score,
    verification_issues: extra?.verification_issues,
  });
}

export async function adminSetFiqhCouncilItemStatus(id: string, status: FiqhItemStatus, notes?: string) {
  if (String(id).startsWith("seed-")) {
    return { data: null, error: { message: "لا يمكن تغيير حالة بيانات البذور المحلية" } };
  }
  const { data: currentRow } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  const current = currentRow as FiqhCouncilItem | null;
  if (!current) return { data: null, error: { message: "العنصر غير موجود" } };

  if (status === "published") {
    const { data: allItems } = await adminGetAllFiqhCouncilItems();
    const verification = verifyFiqhItem(current, {
      existingItems: (allItems || []).filter((i) => i.id !== id),
    });
    if (!verification.canPublish) {
      await logReviewTransition(id, "verify_fail", current.status, "needs_review", notes, {
        completion_score: verification.completionScore,
        verification_issues: verification.issues,
      });
      await supabase.from(TABLE).update({
        status: "needs_review",
        verification_issues: verification.issues,
        completion_score: verification.completionScore,
        updated_at: now(),
      }).eq("id", id);
      return {
        data: null,
        error: {
          message: `لا يمكن النشر: ${verification.issues.map((i) => i.message).join(" · ")}`,
        },
      };
    }
  }

  const payload: Record<string, unknown> = {
    status,
    updated_at: now(),
    completion_score: calculateCompletionScore(current),
  };
  if (status === "published") {
    payload.published_at = now();
    payload.documentation_level = "official_verified";
    payload.confidence_level = "source_verified";
    payload.verification_issues = [];
  }
  if (status === "approved") payload.approved_at = now();
  if (status === "archived") payload.archived_at = now();
  if (status === "rejected") payload.rejected_at = now();
  if (status === "needs_review") payload.verification_issues = verifyFiqhItem(current).issues;

  const result = await supabase.from(TABLE).update(payload).eq("id", id);
  if (!result.error) {
    await logReviewTransition(id, `status_${status}`, current.status, status, notes, {
      completion_score: payload.completion_score as number,
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
  const { data: current } = await supabase.from(TABLE).select("status").eq("id", id).maybeSingle();
  const result = await supabase.from(TABLE).update({
    status: "rejected",
    rejection_reason: reason,
    rejected_at: now(),
    updated_at: now(),
    documentation_level: "rejected",
  }).eq("id", id);
  if (!result.error) {
    await logReviewTransition(id, "reject", current?.status, "rejected", reason);
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

  const res = await requestFetch("/api/admin/sync-fiqh-council", {
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
  const { data: current } = await supabase.from(TABLE).select("status").eq("id", id).maybeSingle();
  const result = await supabase.from(TABLE).update({
    status: "archived",
    archived_at: now(),
    updated_at: now(),
    documentation_level: "archived",
  }).eq("id", id);
  if (!result.error) {
    await logReviewTransition(id, "archive", current?.status, "archived");
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

export async function adminGetSuggestedRelations(status: "pending" | "approved" | "rejected" | "merged" = "pending") {
  const { data, error } = await supabase
    .from("fiqh_council_suggested_relations")
    .select("*, item:fiqh_council_items!fiqh_council_suggested_relations_item_id_fkey(*), related_item:fiqh_council_items!fiqh_council_suggested_relations_related_item_id_fkey(*)")
    .eq("status", status)
    .order("similarity_score", { ascending: false })
    .limit(50);
  if (error) {
    if (isMissingTableError(error)) return { data: [], error: null };
    return { data: [], error };
  }
  return { data: data || [], error: null };
}

export async function adminUpsertSuggestedRelation(payload: {
  item_id: string;
  related_item_id: string;
  similarity_score: number;
  match_reasons: string[];
}) {
  return supabase.from("fiqh_council_suggested_relations").upsert(
    { ...payload, status: "pending" },
    { onConflict: "item_id,related_item_id" },
  );
}

export async function adminApproveSuggestedRelation(id: string, relationType = "related") {
  const { data: row } = await supabase
    .from("fiqh_council_suggested_relations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (row) {
    await supabase.from("fiqh_council_relations").upsert({
      item_id: row.item_id,
      related_item_id: row.related_item_id,
      relation_type: relationType,
      source: "auto_approved",
    }, { onConflict: "item_id,related_item_id,relation_type" });
  }

  return supabase.from("fiqh_council_suggested_relations").update({
    status: "approved",
    reviewed_at: now(),
  }).eq("id", id);
}

export async function adminRejectSuggestedRelation(id: string, notes?: string) {
  return supabase.from("fiqh_council_suggested_relations").update({
    status: "rejected",
    review_notes: notes || null,
    reviewed_at: now(),
  }).eq("id", id);
}

export async function adminMergeSuggestedRelation(id: string) {
  return supabase.from("fiqh_council_suggested_relations").update({
    status: "merged",
    reviewed_at: now(),
  }).eq("id", id);
}

export async function adminGetRelationAuditLog(limit = 20) {
  const { data, error } = await supabase
    .from("fiqh_council_audit")
    .select("*")
    .ilike("action", "%relation%")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return { data: [], error: null };
    return { data: [], error };
  }
  return { data: data || [], error: null };
}

export async function adminGetFiqhSessions(limit = 50) {
  const { data, error } = await supabase
    .from("fiqh_council_sessions")
    .select("*")
    .order("start_date", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return { data: [], error: null };
    return { data: [], error };
  }
  return { data: data || [], error: null };
}

export async function adminUpsertFiqhSession(payload: Record<string, unknown>) {
  return supabase.from("fiqh_council_sessions").upsert({
    ...payload,
    updated_at: now(),
  });
}

export async function adminArchiveFiqhSession(id: string) {
  return supabase.from("fiqh_council_sessions").update({
    status: "archived",
    publish_status: "archived",
    updated_at: now(),
  }).eq("id", id);
}

export async function adminGetFiqhAlerts(limit = 30) {
  const { data, error } = await supabase
    .from("fiqh_council_admin_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return { data: [], error: null };
    return { data: [], error };
  }
  return { data: data || [], error: null };
}

export async function adminMarkFiqhAlertRead(id: string) {
  return supabase.from("fiqh_council_admin_alerts").update({ is_read: true }).eq("id", id);
}

export async function adminCreateFiqhAlert(payload: {
  alert_type: string;
  title: string;
  message?: string;
  entity_type?: string;
  entity_id?: string;
  severity?: "info" | "warning" | "error";
}) {
  return supabase.from("fiqh_council_admin_alerts").insert({
    ...payload,
    severity: payload.severity || "info",
  });
}

export async function adminReturnFiqhItemForEdit(id: string, notes: string) {
  if (String(id).startsWith("seed-")) {
    return { data: null, error: { message: "لا يمكن تعديل بيانات البذور المحلية" } };
  }
  const { data: current } = await supabase.from(TABLE).select("status").eq("id", id).maybeSingle();
  const result = await supabase.from(TABLE).update({
    status: "needs_review",
    updated_at: now(),
  }).eq("id", id);
  if (!result.error) {
    await logReviewTransition(id, "return_for_edit", current?.status, "needs_review", notes);
  }
  return result;
}

export async function adminGetFiqhReviewLogs(itemId?: string, limit = 50) {
  let query = supabase.from("fiqh_review_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (itemId) query = query.eq("item_id", itemId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return { data: [] as FiqhReviewLog[], error: null };
    return { data: [] as FiqhReviewLog[], error };
  }
  return { data: (data || []) as FiqhReviewLog[], error: null };
}

export async function adminGetFiqhQualityStats(): Promise<{ data: FiqhQualityStats | null; error: unknown }> {
  const { data, error } = await supabase.rpc("fiqh_council_quality_stats");
  if (error) {
    if (isMissingTableError(error)) {
      const { data: items } = await adminGetAllFiqhCouncilItems();
      const all = items || [];
      return {
        data: {
          published_count: all.filter((i) => i.status === "published").length,
          needs_review_count: all.filter((i) => ["imported", "needs_review", "review", "approved"].includes(i.status || "")).length,
          missing_source_count: all.filter((i) => !i.source_name || !i.source_url).length,
          missing_category_count: all.filter((i) => !i.category).length,
          broken_links_count: all.filter((i) => i.link_status === "broken" || i.link_status === "timeout").length,
          duplicate_pending_count: 0,
          avg_completion_score: all.length
            ? Math.round(all.reduce((s, i) => s + (i.completion_score ?? calculateCompletionScore(i)), 0) / all.length)
            : 0,
        },
        error: null,
      };
    }
    return { data: null, error };
  }
  return { data: data as FiqhQualityStats, error: null };
}

export async function adminTriggerFiqhLinkCheck() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { ok: false, error: "يجب تسجيل الدخول" };

  const res = await requestFetch("/api/admin/check-fiqh-links", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: json.message || "فشل فحص الروابط" };
  return { ok: true, result: json };
}

export { adminSetPlatformContentStatus } from "./platform-supabase";
