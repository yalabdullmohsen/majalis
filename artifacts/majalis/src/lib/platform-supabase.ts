import { supabase } from "./supabase";
import { logSupabaseError } from "./supabase-config";

const now = () => new Date().toISOString();

// ملاحظة (2026-07-18): دوال إدارة "fatwa" (adminGetAllFatwas/
// adminUpsertFatwa/adminDeleteFatwa) أُزيلت من هنا — لم يستدعِها أي مكوّن
// حي إلا مسار ميت واحد في AdminInlineEdit.tsx (case "fatwa" في
// saveContent) أُزيل بالتزامن. جدول fatwas في DB فارغ تماماً (0 صف).

// ─── Rulings Admin ───────────────────────────────────────────────────────────

export async function adminGetAllRulings() {
  const { data, error } = await supabase.from("sharia_rulings").select("*").order("created_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllRulings", error);
  return { data: data || [], error };
}

export async function adminUpsertRuling(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  if (row.id) return await supabase.from("sharia_rulings").update(payload).eq("id", row.id);
  return await supabase.from("sharia_rulings").insert(payload);
}

export async function adminDeleteRuling(id: string) {
  return await supabase.from("sharia_rulings").delete().eq("id", id);
}

// ─── Annual Courses Admin ────────────────────────────────────────────────────

export async function adminGetAllAnnualCourses() {
  const { data, error } = await supabase.from("annual_courses").select("*").order("created_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllAnnualCourses", error);
  return { data: data || [], error };
}

export async function adminUpsertAnnualCourse(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  if (row.id) return await supabase.from("annual_courses").update(payload).eq("id", row.id);
  return await supabase.from("annual_courses").insert(payload);
}

export async function adminDeleteAnnualCourse(id: string) {
  return await supabase.from("annual_courses").delete().eq("id", id);
}

// ─── Updates Admin ───────────────────────────────────────────────────────────

export async function adminGetAllUpdates() {
  const { data, error } = await supabase.from("platform_updates").select("*").order("published_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllUpdates", error);
  return { data: data || [], error };
}

export async function adminUpsertUpdate(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  if (row.id) return await supabase.from("platform_updates").update(payload).eq("id", row.id);
  return await supabase.from("platform_updates").insert(payload);
}

export async function adminDeleteUpdate(id: string) {
  return await supabase.from("platform_updates").delete().eq("id", id);
}

export async function adminSetPlatformContentStatus(
  table: "fiqh_council_decisions" | "sharia_rulings" | "annual_courses" | "platform_updates",
  id: string,
  status: string,
) {
  return await supabase.from(table).update({ status, updated_at: now() }).eq("id", id);
}
