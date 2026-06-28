import { supabase } from "./supabase";
import { logSupabaseError } from "./supabase-config";
import { writeAuditLog } from "@/lib/cms/audit-log";
import type { ContactMessage } from "./platform-types";

const now = () => new Date().toISOString();

type PlatformTable =
  | "fiqh_council_decisions"
  | "fatwas"
  | "sharia_rulings"
  | "annual_courses"
  | "platform_updates"
  | "quran_circles"
  | "mutoon_texts"
  | "mutoon_lessons"
  | "contact_messages";

async function auditCrud(
  action: "create" | "update" | "delete" | "publish" | "unpublish" | "archive" | "import",
  table: string,
  recordId?: string,
  metadata?: Record<string, unknown>,
) {
  await writeAuditLog({ action, table_name: table, record_id: recordId, metadata });
}

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
  const isUpdate = Boolean(row.id);
  const result = isUpdate
    ? await supabase.from("fiqh_council_decisions").update(payload).eq("id", row.id)
    : await supabase.from("fiqh_council_decisions").insert(payload);
  if (!result.error) await auditCrud(isUpdate ? "update" : "create", "fiqh_council_decisions", String(row.id || ""));
  return result;
}

export async function adminDeleteFiqhDecision(id: string) {
  const result = await supabase.from("fiqh_council_decisions").delete().eq("id", id);
  if (!result.error) await auditCrud("delete", "fiqh_council_decisions", id);
  return result;
}

// ─── Fatwa Admin ─────────────────────────────────────────────────────────────

export async function adminGetAllFatwas() {
  const { data, error } = await supabase.from("fatwas").select("*").order("created_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllFatwas", error);
  return { data: data || [], error };
}

export async function adminUpsertFatwa(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  const isUpdate = Boolean(row.id);
  const result = isUpdate
    ? await supabase.from("fatwas").update(payload).eq("id", row.id)
    : await supabase.from("fatwas").insert(payload);
  if (!result.error) await auditCrud(isUpdate ? "update" : "create", "fatwas", String(row.id || ""));
  return result;
}

export async function adminDeleteFatwa(id: string) {
  const result = await supabase.from("fatwas").delete().eq("id", id);
  if (!result.error) await auditCrud("delete", "fatwas", id);
  return result;
}

// ─── Rulings Admin ───────────────────────────────────────────────────────────

export async function adminGetAllRulings() {
  const { data, error } = await supabase.from("sharia_rulings").select("*").order("created_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllRulings", error);
  return { data: data || [], error };
}

export async function adminUpsertRuling(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  const isUpdate = Boolean(row.id);
  const result = isUpdate
    ? await supabase.from("sharia_rulings").update(payload).eq("id", row.id)
    : await supabase.from("sharia_rulings").insert(payload);
  if (!result.error) await auditCrud(isUpdate ? "update" : "create", "sharia_rulings", String(row.id || ""));
  return result;
}

export async function adminDeleteRuling(id: string) {
  const result = await supabase.from("sharia_rulings").delete().eq("id", id);
  if (!result.error) await auditCrud("delete", "sharia_rulings", id);
  return result;
}

// ─── Annual Courses Admin ────────────────────────────────────────────────────

export async function adminGetAllAnnualCourses() {
  const { data, error } = await supabase.from("annual_courses").select("*").order("created_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllAnnualCourses", error);
  return { data: data || [], error };
}

export async function adminUpsertAnnualCourse(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  const isUpdate = Boolean(row.id);
  const result = isUpdate
    ? await supabase.from("annual_courses").update(payload).eq("id", row.id)
    : await supabase.from("annual_courses").insert(payload);
  if (!result.error) await auditCrud(isUpdate ? "update" : "create", "annual_courses", String(row.id || ""));
  return result;
}

export async function adminDeleteAnnualCourse(id: string) {
  const result = await supabase.from("annual_courses").delete().eq("id", id);
  if (!result.error) await auditCrud("delete", "annual_courses", id);
  return result;
}

// ─── Updates Admin ───────────────────────────────────────────────────────────

export async function adminGetAllUpdates() {
  const { data, error } = await supabase.from("platform_updates").select("*").order("published_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllUpdates", error);
  return { data: data || [], error };
}

export async function adminUpsertUpdate(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  const isUpdate = Boolean(row.id);
  const result = isUpdate
    ? await supabase.from("platform_updates").update(payload).eq("id", row.id)
    : await supabase.from("platform_updates").insert(payload);
  if (!result.error) await auditCrud(isUpdate ? "update" : "create", "platform_updates", String(row.id || ""));
  return result;
}

export async function adminDeleteUpdate(id: string) {
  const result = await supabase.from("platform_updates").delete().eq("id", id);
  if (!result.error) await auditCrud("delete", "platform_updates", id);
  return result;
}

// ─── Quran Circles Admin ─────────────────────────────────────────────────────

export async function adminGetAllQuranCircles() {
  const { data, error } = await supabase.from("quran_circles").select("*").order("created_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllQuranCircles", error);
  return { data: data || [], error };
}

export async function adminUpsertQuranCircle(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  const isUpdate = Boolean(row.id);
  const result = isUpdate
    ? await supabase.from("quran_circles").update(payload).eq("id", row.id)
    : await supabase.from("quran_circles").insert(payload);
  if (!result.error) await auditCrud(isUpdate ? "update" : "create", "quran_circles", String(row.id || ""));
  return result;
}

export async function adminDeleteQuranCircle(id: string) {
  const result = await supabase.from("quran_circles").delete().eq("id", id);
  if (!result.error) await auditCrud("delete", "quran_circles", id);
  return result;
}

// ─── Mutoon Admin ────────────────────────────────────────────────────────────

export async function adminGetAllMutoon() {
  const { data, error } = await supabase.from("mutoon_texts").select("*").order("title");
  if (error) logSupabaseError("adminGetAllMutoon", error);
  return { data: data || [], error };
}

export async function adminUpsertMutoon(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  const isUpdate = Boolean(row.id);
  const result = isUpdate
    ? await supabase.from("mutoon_texts").update(payload).eq("id", row.id)
    : await supabase.from("mutoon_texts").insert(payload);
  if (!result.error) await auditCrud(isUpdate ? "update" : "create", "mutoon_texts", String(row.id || ""));
  return result;
}

export async function adminDeleteMutoon(id: string) {
  const result = await supabase.from("mutoon_texts").delete().eq("id", id);
  if (!result.error) await auditCrud("delete", "mutoon_texts", id);
  return result;
}

export async function adminGetMutoonLessons(mutoonId: string) {
  const { data, error } = await supabase
    .from("mutoon_lessons")
    .select("*")
    .eq("mutoon_id", mutoonId)
    .order("sort_order");
  if (error) logSupabaseError("adminGetMutoonLessons", error);
  return { data: data || [], error };
}

export async function adminUpsertMutoonLesson(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  const isUpdate = Boolean(row.id);
  const result = isUpdate
    ? await supabase.from("mutoon_lessons").update(payload).eq("id", row.id)
    : await supabase.from("mutoon_lessons").insert(payload);
  if (!result.error) await auditCrud(isUpdate ? "update" : "create", "mutoon_lessons", String(row.id || ""));
  return result;
}

export async function adminDeleteMutoonLesson(id: string) {
  const result = await supabase.from("mutoon_lessons").delete().eq("id", id);
  if (!result.error) await auditCrud("delete", "mutoon_lessons", id);
  return result;
}

// ─── Contact Messages Admin ──────────────────────────────────────────────────

export async function adminGetAllContactMessages() {
  const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllContactMessages", error);
  return { data: data || [], error };
}

export async function adminUpdateContactMessage(id: string, patch: Partial<ContactMessage>) {
  const result = await supabase.from("contact_messages").update({ ...patch, updated_at: now() }).eq("id", id);
  if (!result.error) await auditCrud("update", "contact_messages", id);
  return result;
}

// ─── Shared platform content status ──────────────────────────────────────────

export async function adminSetPlatformContentStatus(table: PlatformTable, id: string, status: string) {
  const patch: Record<string, unknown> = { status, updated_at: now() };
  if (status === "archived") patch.archived_at = now();
  if (status === "approved") {
    patch.archived_at = null;
    patch.published_at = now();
  }
  const result = await supabase.from(table).update(patch).eq("id", id);
  if (!result.error) {
    const action = status === "approved" ? "publish" : status === "archived" ? "archive" : "update";
    await auditCrud(action, table, id, { status });
  }
  return result;
}

// ─── Import / Export ─────────────────────────────────────────────────────────

export async function adminExportTable(table: PlatformTable) {
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
  if (error) logSupabaseError("adminExportTable", error, { table });
  return { data: data || [], error };
}

export async function adminImportRows(table: PlatformTable, rows: Record<string, unknown>[]) {
  const cleaned = rows.map(({ id: _id, created_at: _c, ...rest }) => ({ ...rest, updated_at: now() }));
  const { data, error } = await supabase.from(table).upsert(cleaned, { onConflict: "external_key" }).select("id");
  if (!error) await auditCrud("import", table, undefined, { count: rows.length });
  return { data: data || [], error };
}

export async function adminSearchTable(table: PlatformTable, search: string, limit = 50) {
  const q = search.trim();
  if (!q) {
    return adminExportTable(table);
  }
  const { data, error } = await supabase.from(table).select("*").limit(limit);
  if (error) return { data: [], error };
  const filtered = (data || []).filter((row: Record<string, unknown>) =>
    JSON.stringify(row).includes(q) || Object.values(row).some((v) => String(v ?? "").includes(q)),
  );
  return { data: filtered, error: null };
}
