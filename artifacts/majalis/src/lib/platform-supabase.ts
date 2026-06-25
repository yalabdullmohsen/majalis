import { supabase } from "./supabase";
import { logSupabaseError } from "./supabase-config";

const now = () => new Date().toISOString();

// ─── Fiqh Council Admin ──────────────────────────────────────────────────────

export async function adminGetAllFiqhDecisions() {
  const { data, error } = await supabase
    .from("fiqh_council_decisions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllFiqhDecisions", error);
  return { data: data || [], error };
}

export async function adminUpsertFiqhDecision(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  if (row.id) {
    return await supabase.from("fiqh_council_decisions").update(payload).eq("id", row.id);
  }
  return await supabase.from("fiqh_council_decisions").insert(payload);
}

export async function adminDeleteFiqhDecision(id: string) {
  return await supabase.from("fiqh_council_decisions").delete().eq("id", id);
}

// ─── Fatwa Admin ─────────────────────────────────────────────────────────────

export async function adminGetAllFatwas() {
  const { data, error } = await supabase.from("fatwas").select("*").order("created_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllFatwas", error);
  return { data: data || [], error };
}

export async function adminUpsertFatwa(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  if (row.id) return await supabase.from("fatwas").update(payload).eq("id", row.id);
  return await supabase.from("fatwas").insert(payload);
}

export async function adminDeleteFatwa(id: string) {
  return await supabase.from("fatwas").delete().eq("id", id);
}

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
  table: "fiqh_council_decisions" | "fatwas" | "sharia_rulings" | "annual_courses" | "platform_updates",
  id: string,
  status: string,
) {
  return await supabase.from(table).update({ status, updated_at: now() }).eq("id", id);
}
