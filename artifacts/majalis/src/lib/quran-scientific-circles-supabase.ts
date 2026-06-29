import { supabase } from "./supabase";
import { logSupabaseError } from "./supabase-config";

function now() {
  return new Date().toISOString();
}

export async function adminGetAllCircles() {
  const { data, error } = await supabase
    .from("quran_scientific_circles")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) logSupabaseError("adminGetAllCircles", error);
  return { data: data || [], error };
}

export async function adminUpsertCircle(row: Record<string, unknown>) {
  const payload = { ...row, updated_at: now() };
  if (row.id) return await supabase.from("quran_scientific_circles").update(payload).eq("id", row.id);
  return await supabase.from("quran_scientific_circles").insert(payload);
}

export async function adminDeleteCircle(id: string) {
  return await supabase.from("quran_scientific_circles").delete().eq("id", id);
}

export async function adminArchiveCircle(id: string) {
  return await supabase
    .from("quran_scientific_circles")
    .update({ status: "archived", updated_at: now() })
    .eq("id", id);
}

export async function adminPublishCircle(id: string, status = "published") {
  return await supabase
    .from("quran_scientific_circles")
    .update({ status, updated_at: now() })
    .eq("id", id);
}

export async function adminCreateImportJob(job: Record<string, unknown>) {
  return await supabase.from("quran_scientific_circle_import_jobs").insert({
    ...job,
    created_at: now(),
  });
}
