import { createClient } from "@supabase/supabase-js";

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || "").trim();
const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "").trim();

const isConfigured = url.startsWith("https://");

// @ts-ignore
export const supabase = isConfigured
  ? createClient(url, key)
  : createClient(
      "https://placeholder.supabase.co",
      "placeholder-anon-key-placeholder-anon-key-placeholder-anon-key-p"
    );

export async function signUp(email: string, password: string, fullName: string) {
  return await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return { ...user, profile };
}

export async function getSheikhs() {
  const { data, error } = await supabase
    .from("sheikhs")
    .select("*")
    .order("name");
  return { data: data || [], error };
}

export async function getSheikhById(id: string) {
  const { data: sheikh } = await supabase
    .from("sheikhs")
    .select("*")
    .eq("id", id)
    .single();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("sheikh_id", id)
    .eq("status", "approved");
  return { sheikh, lessons: lessons || [] };
}

export async function getLessons({
  category,
  city,
  search,
}: { category?: string; city?: string; search?: string } = {}) {
  let q = supabase
    .from("lessons")
    .select("*, sheikhs(name, city)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (category && category !== "الكل") q = q.eq("category", category);
  if (city && city !== "كل المحافظات") q = q.eq("city", city);
  const { data, error } = await q;
  let result = data || [];
  if (search?.trim()) {
    const s = search.trim();
    result = result.filter(
      (l: any) =>
        l.title?.includes(s) || l.mosque?.includes(s) || l.city?.includes(s)
    );
  }
  return { data: result, error };
}

export async function registerForLesson(userId: string, lessonId: string) {
  return await supabase
    .from("lesson_registrations")
    .insert({ user_id: userId, lesson_id: lessonId });
}

export async function unregisterFromLesson(userId: string, lessonId: string) {
  return await supabase
    .from("lesson_registrations")
    .delete()
    .eq("user_id", userId)
    .eq("lesson_id", lessonId);
}

export async function getMyRegistrations(userId: string) {
  const { data } = await supabase
    .from("lesson_registrations")
    .select("lesson_id")
    .eq("user_id", userId);
  return (data || []).map((r: any) => r.lesson_id);
}

export async function getApprovedFawaid() {
  const { data, error } = await supabase
    .from("fawaid")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function submitFawaid(
  userId: string,
  text: string,
  authorName: string
) {
  return await supabase.from("fawaid").insert({
    text,
    author_name: authorName,
    submitted_by: userId,
    status: "pending",
  });
}

export async function getLibrary({
  type,
  category,
}: { type?: string; category?: string } = {}) {
  let q = supabase
    .from("library_items")
    .select("*")
    .eq("status", "approved");
  if (type) q = q.eq("type", type);
  if (category) q = q.eq("category", category);
  const { data, error } = await q.order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function getPendingFawaid() {
  const { data } = await supabase
    .from("fawaid")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function moderateFawaid(id: string, status: string) {
  return await supabase.from("fawaid").update({ status }).eq("id", id);
}

export async function getMiracles({
  category,
  sourceType,
}: { category?: string; sourceType?: string } = {}) {
  let q = supabase
    .from("scientific_miracles")
    .select("*")
    .eq("status", "approved");
  if (category) q = q.eq("category", category);
  if (sourceType) q = q.eq("source_type", sourceType);
  const { data, error } = await q.order("created_at", { ascending: false });
  return { data: data || [], error };
}

// ─── Admin CRUD ─────────────────────────────────────────────────────────────

export async function adminGetStats() {
  const [s, l, lib, mir, fw] = await Promise.all([
    supabase.from("sheikhs").select("id", { count: "exact", head: true }),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("library_items").select("id", { count: "exact", head: true }),
    supabase.from("scientific_miracles").select("id", { count: "exact", head: true }),
    supabase.from("fawaid").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return { sheikhs: s.count || 0, lessons: l.count || 0, library: lib.count || 0, miracles: mir.count || 0, pendingFawaid: fw.count || 0 };
}

// Sheikhs
export async function adminGetAllSheikhs() {
  const { data, error } = await supabase.from("sheikhs").select("*").order("name");
  return { data: data || [], error };
}
export async function adminUpsertSheikh(row: any) {
  const { id, ...rest } = row;
  if (id) return await supabase.from("sheikhs").update(rest).eq("id", id);
  return await supabase.from("sheikhs").insert(rest);
}
export async function adminDeleteSheikh(id: string) {
  return await supabase.from("sheikhs").delete().eq("id", id);
}

// Lessons
export async function adminGetAllLessons() {
  const { data, error } = await supabase
    .from("lessons").select("*, sheikhs(name)").order("created_at", { ascending: false });
  return { data: data || [], error };
}
export async function adminUpsertLesson(row: any) {
  const { id, sheikhs, ...rest } = row;
  if (id) return await supabase.from("lessons").update(rest).eq("id", id);
  return await supabase.from("lessons").insert(rest);
}
export async function adminDeleteLesson(id: string) {
  return await supabase.from("lessons").delete().eq("id", id);
}

// Library
export async function adminGetAllLibrary() {
  const { data, error } = await supabase
    .from("library_items").select("*").order("created_at", { ascending: false });
  return { data: data || [], error };
}
export async function adminUpsertLibraryItem(row: any) {
  const { id, ...rest } = row;
  if (id) return await supabase.from("library_items").update(rest).eq("id", id);
  return await supabase.from("library_items").insert(rest);
}
export async function adminDeleteLibraryItem(id: string) {
  return await supabase.from("library_items").delete().eq("id", id);
}

// Miracles
export async function adminGetAllMiracles() {
  const { data, error } = await supabase
    .from("scientific_miracles").select("*").order("created_at", { ascending: false });
  return { data: data || [], error };
}
export async function adminUpsertMiracle(row: any) {
  const { id, ...rest } = row;
  if (id) return await supabase.from("scientific_miracles").update(rest).eq("id", id);
  return await supabase.from("scientific_miracles").insert(rest);
}
export async function adminDeleteMiracle(id: string) {
  return await supabase.from("scientific_miracles").delete().eq("id", id);
}

// Fawaid (all)
export async function adminGetAllFawaid(status?: string) {
  let q = supabase.from("fawaid").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return data || [];
}
export async function adminDeleteFawaid(id: string) {
  return await supabase.from("fawaid").delete().eq("id", id);
}

// Users
export async function adminGetUsers() {
  const { data, error } = await supabase
    .from("profiles").select("*").order("created_at", { ascending: false });
  return { data: data || [], error };
}
export async function adminUpdateUserRole(userId: string, role: string) {
  return await supabase.from("profiles").update({ role }).eq("id", userId);
}
