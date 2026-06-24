import { createClient } from "@supabase/supabase-js";
import { arabicMatchAny, arabicSearchPatterns, ilikePattern } from "./arabic-search";
import {
  DEMO_QA_CATEGORIES,
  filterDemoQa,
  searchDemoContent,
} from "./demo-content";
import { formatSupabaseError, isSupabaseConfigured, logSupabaseError } from "./supabase-config";

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

const isConfigured = isSupabaseConfigured();

export { isSupabaseConfigured, formatSupabaseError };

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
  if (!isConfigured) return { data: [], error: null };

  let q = supabase
    .from("lessons")
    .select("*, sheikhs(name, city)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (category && category !== "الكل") q = q.eq("category", category);
  if (city && city !== "كل المحافظات") q = q.eq("city", city);
  const { data, error } = await q;
  if (error) {
    logSupabaseError("getLessons", error);
    return { data: [], error };
  }

  let result = data || [];
  if (search?.trim()) {
    const s = search.trim();
    result = result.filter((l: any) =>
      arabicMatchAny(
        [
          l.title,
          l.description,
          l.mosque,
          l.city,
          l.category,
          l.speaker_name,
          l.sheikhs?.name,
          ...(Array.isArray(l.keywords) ? l.keywords : []),
        ],
        s
      )
    );
  }
  return { data: result, error: null };
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
  const [sheikhs, lessonsRes, library, miracles, fawaidTotal, pendingFawaid, qa, quizPublished] = await Promise.all([
    supabase.from("sheikhs").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("status"),
    supabase.from("library_items").select("*", { count: "exact", head: true }),
    supabase.from("scientific_miracles").select("*", { count: "exact", head: true }),
    supabase.from("fawaid").select("*", { count: "exact", head: true }),
    supabase.from("fawaid").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("qa_questions").select("status"),
    supabase.from("quiz_questions").select("*", { count: "exact", head: true }).eq("status", "published"),
  ]);
  const lessons = lessonsRes.data || [];
  const qaRows = qa.data || [];
  return {
    sheikhsCount: sheikhs.count ?? 0,
    lessonsTotal: lessons.length,
    lessonsApproved: lessons.filter((l: any) => l.status === "approved").length,
    lessonsPending: lessons.filter((l: any) => l.status === "pending").length,
    libraryCount: library.count ?? 0,
    miraclesCount: miracles.count ?? 0,
    fawaidTotal: fawaidTotal.count ?? 0,
    pendingFawaidCount: pendingFawaid.count ?? 0,
    qaTotal: qaRows.length,
    qaPublished: qaRows.filter((q: any) => q.status === "published").length,
    quizCount: quizPublished.count ?? 0,
  };
}

export async function adminGetDashboardStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    { count: users },
    { count: lessons },
    { count: books },
    { count: benefits },
    { count: qa },
    { count: reports },
    { count: trans },
    { count: todayViews },
    { data: recentReports },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("library_items").select("*", { count: "exact", head: true }),
    supabase.from("fawaid").select("*", { count: "exact", head: true }),
    supabase.from("qa_questions").select("*", { count: "exact", head: true }),
    supabase.from("error_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("transcriptions").select("*", { count: "exact", head: true }),
    supabase.from("content_views").select("*", { count: "exact", head: true }).gte("viewed_at", startOfDay.toISOString()),
    supabase.from("error_reports").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
  ]);

  return {
    stats: {
      totalUsers: users || 0,
      totalLessons: lessons || 0,
      totalBooks: books || 0,
      totalBenefits: benefits || 0,
      totalQA: qa || 0,
      pendingReports: reports || 0,
      todayViews: todayViews || 0,
      totalTranscriptions: trans || 0,
    },
    recentReports: recentReports || [],
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

export async function adminUpsertFawaid(data: any) {
  const { id, ...rest } = data;
  if (!rest.status) rest.status = "approved";
  if (id) return await supabase.from("fawaid").update(rest).eq("id", id);
  return await supabase.from("fawaid").insert(rest);
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
  if (!isConfigured) {
    return { data: DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"), error: null, usingDemo: true };
  }

  const { data, error } = await supabase
    .from("qa_categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    logSupabaseError("getQaCategories", error);
    return { data: DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"), error, usingDemo: true };
  }

  return { data: data || [], error: null, usingDemo: false };
}

export async function getQaQuestions({ categoryId, search }: { categoryId?: string; search?: string } = {}) {
  if (!isConfigured) {
    return {
      data: filterDemoQa({ categoryId, search }),
      error: null,
      usingDemo: true,
    };
  }

  let q = supabase
    .from("qa_questions")
    .select("*, qa_categories(name, slug)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (categoryId && categoryId !== "all") {
    q = q.eq("category_id", categoryId);
  }

  if (search?.trim()) {
    const patterns = arabicSearchPatterns(search);
    const orParts = patterns.flatMap((p) => {
      const like = ilikePattern(p);
      return [`question.ilike.${like}`, `answer.ilike.${like}`, `evidence.ilike.${like}`, `reference.ilike.${like}`];
    });
    if (orParts.length) q = q.or(orParts.join(","));
  }

  const { data, error } = await q;

  if (error) {
    logSupabaseError("getQaQuestions", error, { categoryId, search });
    return {
      data: filterDemoQa({ categoryId, search }),
      error,
      usingDemo: true,
    };
  }

  let result = data || [];
  if (search?.trim()) {
    const s = search.trim();
    result = result.filter((x: any) =>
      arabicMatchAny(
        [x.question, x.answer, x.evidence, x.reference, x.qa_categories?.name],
        s
      )
    );
  }

  return { data: result, error: null, usingDemo: false };
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

// ─── المسابقات الشرعية ───────────────────────────────────────────────────────────

export async function getQuizQuestions({ section, level }: { section?: string; level?: string } = {}) {
  let q = supabase
    .from("quiz_questions")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (section && section !== "الكل") q = q.eq("section", section);
  if (level && level !== "الكل") q = q.eq("level", level);
  const { data, error } = await q;
  return { data: data || [], error };
}

export async function adminGetQuizQuestions() {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function adminUpsertQuizQuestion(data: any) {
  const { id, ...rest } = data;
  rest.updated_at = new Date().toISOString();
  if (id) return await supabase.from("quiz_questions").update(rest).eq("id", id);
  return await supabase.from("quiz_questions").insert(rest);
}

export async function adminDeleteQuizQuestion(id: string) {
  return await supabase.from("quiz_questions").delete().eq("id", id);
}

export async function adminSetQuizQuestionStatus(id: string, status: string) {
  return await supabase
    .from("quiz_questions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
}

// ─── Search ────────────────────────────────────────────────────────────────────

export type SearchResults = {
  lessons: any[];
  library: any[];
  miracles: any[];
  sheikhs: any[];
  qa: any[];
  fawaid: any[];
  error?: string | null;
  usingDemo?: boolean;
};

const EMPTY_SEARCH: SearchResults = {
  lessons: [],
  library: [],
  miracles: [],
  sheikhs: [],
  qa: [],
  fawaid: [],
};

function mergeUniqueById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

async function searchLessonsFallback(term: string) {
  const patterns = arabicSearchPatterns(term);
  const queries = patterns.map((p) => {
    const like = ilikePattern(p);
    return supabase
      .from("lessons")
      .select("id, title, category, description, sheikhs(name)")
      .eq("status", "approved")
      .or(`title.ilike.${like},description.ilike.${like},category.ilike.${like},mosque.ilike.${like},city.ilike.${like}`)
      .limit(40);
  });

  const responses = await Promise.all(queries);
  const rows = responses.flatMap((r) => {
    if (r.error) logSupabaseError("searchLessonsFallback", r.error, { term });
    return r.data || [];
  });

  const filtered = mergeUniqueById(rows).filter((l: any) =>
    arabicMatchAny(
      [
        l.title,
        l.description,
        l.category,
        l.mosque,
        l.city,
        l.speaker_name,
        l.sheikhs?.name,
        ...(Array.isArray(l.keywords) ? l.keywords : []),
      ],
      term
    )
  );

  return { data: filtered, errors: responses.map((r) => r.error).filter(Boolean) };
}

async function searchSheikhsFallback(term: string) {
  const patterns = arabicSearchPatterns(term);
  const responses = await Promise.all(
    patterns.map((p) =>
      supabase.from("sheikhs").select("id, name, bio, specialties").ilike("name", ilikePattern(p)).limit(20)
    )
  );
  const rows = mergeUniqueById(responses.flatMap((r) => r.data || [])).filter((s: any) =>
    arabicMatchAny([s.name, s.bio, ...(s.specialties || [])], term)
  );
  return { data: rows, errors: responses.map((r) => r.error).filter(Boolean) };
}

async function searchLibraryFallback(term: string) {
  const patterns = arabicSearchPatterns(term);
  const responses = await Promise.all(
    patterns.map((p) => {
      const like = ilikePattern(p);
      return supabase
        .from("library_items")
        .select("id, title, type, description, category")
        .eq("status", "approved")
        .or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`)
        .limit(20);
    })
  );
  const rows = mergeUniqueById(responses.flatMap((r) => r.data || [])).filter((it: any) =>
    arabicMatchAny([it.title, it.description, it.category, it.type], term)
  );
  return { data: rows, errors: responses.map((r) => r.error).filter(Boolean) };
}

async function searchQaFallback(term: string) {
  const patterns = arabicSearchPatterns(term);
  const responses = await Promise.all(
    patterns.map((p) => {
      const like = ilikePattern(p);
      return supabase
        .from("qa_questions")
        .select("id, question, answer, qa_categories(name)")
        .eq("status", "published")
        .or(`question.ilike.${like},answer.ilike.${like}`)
        .limit(20);
    })
  );
  const rows = mergeUniqueById(responses.flatMap((r) => r.data || [])).filter((x: any) =>
    arabicMatchAny([x.question, x.answer, x.qa_categories?.name], term)
  );
  return { data: rows, errors: responses.map((r) => r.error).filter(Boolean) };
}

async function searchMiraclesFallback(term: string) {
  const like = ilikePattern(term);
  const { data, error } = await supabase
    .from("scientific_miracles")
    .select("id, title, category, body")
    .eq("status", "approved")
    .or(`title.ilike.${like},body.ilike.${like}`)
    .limit(15);
  if (error) logSupabaseError("searchMiraclesFallback", error, { term });
  return {
    data: (data || []).filter((m: any) => arabicMatchAny([m.title, m.body, m.category], term)),
    errors: error ? [error] : [],
  };
}

async function searchFawaidFallback(term: string) {
  const like = ilikePattern(term);
  const { data, error } = await supabase
    .from("fawaid")
    .select("id, text, author_name")
    .eq("status", "approved")
    .ilike("text", like)
    .limit(15);
  if (error) logSupabaseError("searchFawaidFallback", error, { term });
  return {
    data: (data || []).filter((f: any) => arabicMatchAny([f.text, f.author_name], term)),
    errors: error ? [error] : [],
  };
}

async function searchEverythingFallback(term: string): Promise<SearchResults> {
  const [lessons, sheikhs, library, qa, miracles, fawaid] = await Promise.all([
    searchLessonsFallback(term),
    searchSheikhsFallback(term),
    searchLibraryFallback(term),
    searchQaFallback(term),
    searchMiraclesFallback(term),
    searchFawaidFallback(term),
  ]);

  const errors = [
    ...lessons.errors,
    ...sheikhs.errors,
    ...library.errors,
    ...qa.errors,
    ...miracles.errors,
    ...fawaid.errors,
  ];

  return {
    lessons: lessons.data,
    sheikhs: sheikhs.data,
    library: library.data,
    qa: qa.data,
    miracles: miracles.data,
    fawaid: fawaid.data,
    error: errors.length ? formatSupabaseError(errors[0]) : null,
    usingDemo: false,
  };
}

export async function searchEverything(term: string): Promise<SearchResults> {
  const query = term.trim();
  if (!query) return { ...EMPTY_SEARCH };

  if (!isConfigured) {
    const demo = searchDemoContent(query);
    return { ...demo, usingDemo: true, error: null };
  }

  try {
    const { data, error } = await supabase.rpc("search_platform", { query });

    if (!error && data) {
      return {
        lessons: data.lessons || [],
        library: data.library || [],
        miracles: data.miracles || [],
        sheikhs: data.sheikhs || [],
        qa: data.qa || [],
        fawaid: data.fawaid || [],
        usingDemo: false,
        error: null,
      };
    }

    if (error) {
      logSupabaseError("searchEverything.rpc", error, { query });
    }
  } catch (err) {
    logSupabaseError("searchEverything.rpc", err, { query });
  }

  const fallback = await searchEverythingFallback(query);
  const total =
    fallback.lessons.length +
    fallback.library.length +
    fallback.miracles.length +
    fallback.sheikhs.length +
    fallback.qa.length +
    fallback.fawaid.length;

  if (total === 0) {
    const demo = searchDemoContent(query);
    const demoTotal =
      demo.lessons.length +
      demo.library.length +
      demo.sheikhs.length +
      demo.qa.length +
      demo.fawaid.length;
    if (demoTotal > 0) {
      return { ...demo, usingDemo: true, error: fallback.error ?? null };
    }
  }

  return fallback;
}
