/**
 * خدمة عميل للمحتوى الموحّد المستورد من Instagram (دورات/فعاليات/فوائد/
 * إعلانات) — تُعيد فقط المحتوى المعتمَد (status="published") الذي اعتمده
 * مراجِع بشري من لوحة الإدارة؛ لا محتوى تجريبي أو غير مراجَع يظهر للزوار.
 */
import { supabase } from "@/lib/supabase";
import { adminFetch } from "@/lib/admin-api";
import type { AutoImportedContent } from "@/lib/auto-content/auto-content-utils";

const PUBLISHED = { status: "published", verification_status: "verified" } as const;

export async function getBenefitCards(limit = 8): Promise<AutoImportedContent[]> {
  const { data, error } = await supabase
    .from("auto_imported_content")
    .select("*")
    .eq("content_type", "benefit")
    .match(PUBLISHED)
    .order("pinned", { ascending: false })
    .order("last_displayed_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) return [];
  return (data || []) as AutoImportedContent[];
}

export async function getUpcomingEvents(limit = 12): Promise<AutoImportedContent[]> {
  const { data, error } = await supabase
    .from("auto_imported_content")
    .select("*")
    .eq("content_type", "event")
    .match(PUBLISHED)
    .neq("status", "archived")
    .order("event_start_at", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) return [];
  return (data || []) as AutoImportedContent[];
}

export async function getCourses(limit = 20): Promise<AutoImportedContent[]> {
  const { data, error } = await supabase
    .from("auto_imported_content")
    .select("*")
    .eq("content_type", "course")
    .match(PUBLISHED)
    .order("event_start_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []) as AutoImportedContent[];
}

export async function getAnnouncements(limit = 20): Promise<AutoImportedContent[]> {
  const { data, error } = await supabase
    .from("auto_imported_content")
    .select("*")
    .eq("content_type", "announcement")
    .match(PUBLISHED)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []) as AutoImportedContent[];
}

/* ── إدارة (تتطلب صلاحية) ── */

export async function adminListUnifiedContent(status = "needs_review") {
  const { data, error } = await supabase
    .from("auto_imported_content")
    .select("*")
    .in("content_type", ["course", "event", "benefit", "announcement"])
    .eq("status", status)
    .order("created_at", { ascending: false });
  return { data: (data || []) as AutoImportedContent[], error };
}

export async function adminUpdateUnifiedContent(id: string, patch: Partial<AutoImportedContent>) {
  const { data, error } = await supabase
    .from("auto_imported_content")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  return { data: data as AutoImportedContent | null, error };
}

export async function adminSetPinned(id: string, pinned: boolean) {
  return adminUpdateUnifiedContent(id, { pinned });
}

export async function adminDeleteUnifiedContent(id: string) {
  const { error } = await supabase.from("auto_imported_content").delete().eq("id", id);
  return { ok: !error, error };
}

export async function adminTriggerInstagramSync() {
  const res = await adminFetch("/api/admin/auto-content?action=run", { method: "POST" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "فشلت المزامنة");
  }
  return res.json();
}
