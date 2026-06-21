import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string || "https://placeholder.supabase.co";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string || "placeholder-key";

export const supabase = createClient(url, key);

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  return { ...user, profile };
}

export async function getSheikhs() {
  const { data, error } = await supabase
    .from("sheikhs").select("*").order("name");
  return { data: data || [], error };
}

export async function getSheikhById(id: string) {
  const { data: sheikh } = await supabase
    .from("sheikhs").select("*").eq("id", id).single();
  const { data: lessons } = await supabase
    .from("lessons").select("*").eq("sheikh_id", id).eq("status", "approved");
  return { sheikh, lessons: lessons || [] };
}

export async function getLessons({ category, city, search }: { category?: string; city?: string; search?: string } = {}) {
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
      (l: any) => l.title?.includes(s) || l.mosque?.includes(s) || l.city?.includes(s)
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
    .from("lesson_registrations").delete()
    .eq("user_id", userId).eq("lesson_id", lessonId);
}

export async function getMyRegistrations(userId: string) {
  const { data } = await supabase
    .from("lesson_registrations")
    .select("lesson_id").eq("user_id", userId);
  return (data || []).map((r: any) => r.lesson_id);
}

export async function getApprovedFawaid() {
  const { data, error } = await supabase
    .from("fawaid").select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function submitFawaid(userId: string, text: string, authorName: string) {
  return await supabase.from("fawaid").insert({
    text, author_name: authorName, submitted_by: userId, status: "pending",
  });
}

export async function getPendingFawaid() {
  const { data } = await supabase
    .from("fawaid").select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function moderateFawaid(id: string, status: string) {
  return await supabase.from("fawaid").update({ status }).eq("id", id);
}

export async function getLibrary({ type, category }: { type?: string; category?: string } = {}) {
  let q = supabase.from("library_items").select("*").eq("status", "approved");
  if (type) q = q.eq("type", type);
  if (category) q = q.eq("category", category);
  const { data, error } = await q.order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function getMiracles({ category, sourceType }: { category?: string; sourceType?: string } = {}) {
  let q = supabase.from("scientific_miracles").select("*").eq("status", "approved");
  if (category) q = q.eq("category", category);
  if (sourceType) q = q.eq("source_type", sourceType);
  const { data, error } = await q.order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function getMyAchievements(userId: string) {
  const { data } = await supabase
    .from("achievements").select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  return data || [];
}

export async function searchEverything(term: string) {
  const q = `%${term}%`;
  const [lessons, library, miracles, sheikhs] = await Promise.all([
    supabase.from("lessons").select("id, title, category").eq("status", "approved").ilike("title", q),
    supabase.from("library_items").select("id, title, type").eq("status", "approved").ilike("title", q),
    supabase.from("scientific_miracles").select("id, title, category").eq("status", "approved").ilike("title", q),
    supabase.from("sheikhs").select("id, name").ilike("name", q),
  ]);
  return {
    lessons: lessons.data || [],
    library: library.data || [],
    miracles: miracles.data || [],
    sheikhs: sheikhs.data || [],
  };
}
