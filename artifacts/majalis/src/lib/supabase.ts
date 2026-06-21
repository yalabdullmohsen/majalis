import { createClient } from "@supabase/supabase-js";

// Normalize to the bare project origin (https://xxx.supabase.co).
// The supabase-js client appends /rest/v1, /auth/v1, etc. itself, so any
// path (e.g. a stray "/rest/v1/") or trailing slash in the env value must be
// stripped — otherwise requests become ".../rest/v1//auth/v1/signup" → PGRST125.
function normalizeSupabaseUrl(raw: string): string {
  const v = (raw || "").trim();
  try {
    return new URL(v).origin;
  } catch {
    return v.replace(/\/+$/, "");
  }
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string);
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || "").trim();

const isConfigured = url.startsWith("http");

// @ts-ignore
export const supabase = isConfigured
  ? createClient(url, key)
  : createClient("https://placeholder.supabase.co", "placeholder-anon-key-placeholder-anon-key-placeholder-anon-key-p");

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

  // Fetch existing profile
  let { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  // If no profile exists yet (trigger may be missing), create it now
  if (!profile) {
    const { data: created } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? "",
        role: "user",
      }, { onConflict: "id" })
      .select("*")
      .single();
    profile = created;
  }

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

// ─── Admin CRUD ────────────────────────────────────────────────────────────────

export async function adminGetStats() {
  const [sheikhs, lessonsRes, library, miracles, pendingFawaid] = await Promise.all([
    supabase.from("sheikhs").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("status"),
    supabase.from("library_items").select("*", { count: "exact", head: true }),
    supabase.from("scientific_miracles").select("*", { count: "exact", head: true }),
    supabase.from("fawaid").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const lessons = lessonsRes.data || [];
  return {
    sheikhsCount: sheikhs.count ?? 0,
    lessonsTotal: lessons.length,
    lessonsApproved: lessons.filter((l: any) => l.status === "approved").length,
    lessonsPending: lessons.filter((l: any) => l.status === "pending").length,
    libraryCount: library.count ?? 0,
    miraclesCount: miracles.count ?? 0,
    pendingFawaidCount: pendingFawaid.count ?? 0,
  };
}

export async function adminGetSheikhs() {
  const { data, error } = await supabase.from("sheikhs").select("*").order("name");
  return { data: data || [], error };
}

export async function adminUpsertSheikh(data: any) {
  const { id, ...rest } = data;
  if (id) return await supabase.from("sheikhs").update(rest).eq("id", id);
  return await supabase.from("sheikhs").insert(rest);
}

export async function adminDeleteSheikh(id: string) {
  return await supabase.from("sheikhs").delete().eq("id", id);
}

export async function adminGetLessons() {
  const { data, error } = await supabase
    .from("lessons").select("*, sheikhs(name)")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function adminUpsertLesson(data: any) {
  const { id, sheikhs, ...rest } = data;
  if (id) return await supabase.from("lessons").update(rest).eq("id", id);
  return await supabase.from("lessons").insert(rest);
}

export async function adminDeleteLesson(id: string) {
  return await supabase.from("lessons").delete().eq("id", id);
}

export async function adminGetLibrary() {
  const { data, error } = await supabase
    .from("library_items").select("*, sheikhs(name)")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function adminUpsertLibraryItem(data: any) {
  const { id, sheikhs, ...rest } = data;
  if (id) return await supabase.from("library_items").update(rest).eq("id", id);
  return await supabase.from("library_items").insert(rest);
}

export async function adminDeleteLibraryItem(id: string) {
  return await supabase.from("library_items").delete().eq("id", id);
}

export async function adminGetMiracles() {
  const { data, error } = await supabase
    .from("scientific_miracles").select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function adminUpsertMiracle(data: any) {
  const { id, ...rest } = data;
  if (id) return await supabase.from("scientific_miracles").update(rest).eq("id", id);
  return await supabase.from("scientific_miracles").insert(rest);
}

export async function adminDeleteMiracle(id: string) {
  return await supabase.from("scientific_miracles").delete().eq("id", id);
}

export async function adminGetAllFawaid() {
  const { data, error } = await supabase
    .from("fawaid").select("*").order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function adminDeleteFawaid(id: string) {
  return await supabase.from("fawaid").delete().eq("id", id);
}

export async function adminGetUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function adminUpdateUserRole(userId: string, role: string) {
  return await supabase.from("profiles").update({ role }).eq("id", userId);
}

// ─── الأسئلة والأجوبة الدينية ───────────────────────────────────────────────────

export async function getQaCategories() {
  const { data, error } = await supabase
    .from("qa_categories")
    .select("*")
    .order("created_at", { ascending: true });
  return { data: data || [], error };
}

export async function getQaQuestions({ categoryId, search }: { categoryId?: string; search?: string } = {}) {
  let q = supabase
    .from("qa_questions")
    .select("*, qa_categories(name, slug)")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (categoryId && categoryId !== "all") q = q.eq("category_id", categoryId);
  const { data, error } = await q;
  let result = data || [];
  if (search?.trim()) {
    const s = search.trim();
    result = result.filter(
      (x: any) => x.question?.includes(s) || x.answer?.includes(s)
    );
  }
  return { data: result, error };
}

export async function adminGetQuestions() {
  const { data, error } = await supabase
    .from("qa_questions")
    .select("*, qa_categories(name, slug)")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function adminUpsertQuestion(data: any) {
  const { id, qa_categories, ...rest } = data;
  if (!rest.ruling_type) rest.ruling_type = null;
  if (!rest.category_id) rest.category_id = null;
  rest.updated_at = new Date().toISOString();
  if (id) return await supabase.from("qa_questions").update(rest).eq("id", id);
  return await supabase.from("qa_questions").insert(rest);
}

export async function adminDeleteQuestion(id: string) {
  return await supabase.from("qa_questions").delete().eq("id", id);
}

export async function adminSetQuestionStatus(id: string, status: string) {
  return await supabase
    .from("qa_questions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
}

// ─── Search ────────────────────────────────────────────────────────────────────

export async function searchEverything(term: string) {
  const q = `%${term}%`;
  const [lessons, library, miracles, sheikhs, qa, fawaid] = await Promise.all([
    supabase.from("lessons").select("id, title, category").eq("status", "approved").ilike("title", q),
    supabase.from("library_items").select("id, title, type").eq("status", "approved").ilike("title", q),
    supabase.from("scientific_miracles").select("id, title, category").eq("status", "approved").ilike("title", q),
    supabase.from("sheikhs").select("id, name").ilike("name", q),
    supabase.from("qa_questions").select("id, question, qa_categories(name)").eq("status", "published").ilike("question", q),
    supabase.from("fawaid").select("id, text, author_name").eq("status", "approved").ilike("text", q),
  ]);
  return {
    lessons: lessons.data || [],
    library: library.data || [],
    miracles: miracles.data || [],
    sheikhs: sheikhs.data || [],
    qa: qa.data || [],
    fawaid: fawaid.data || [],
  };
}
