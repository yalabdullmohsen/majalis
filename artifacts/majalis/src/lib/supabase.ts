import { createClient } from "@supabase/supabase-js";
import { arabicMatchAny, arabicSearchPatterns, ilikePattern } from "./arabic-search";
import {
  DEMO_FAWAID,
  DEMO_LIBRARY,
  DEMO_LESSONS,
  DEMO_MIRACLES,
  DEMO_QA_CATEGORIES,
  DEMO_SHEIKHS,
  filterDemoQa,
  searchDemoContent,
} from "./demo-content";
import { LESSONS_SEED, findSeedLessonById } from "./lessons-seed";
import { DEMO_QUIZ_QUESTIONS } from "./quiz-seed";
import { ADHKAR_CATEGORIES, filterAdhkar } from "./adhkar-seed";
import { searchPlatformSeed } from "./platform-search";
import { safeSupabaseQuery, isMissingSchemaError } from "./safe-supabase";

/** Columns that exist on the live `sheikhs` table (no image_url / avatar_url). */
const SHEIKH_EMBED = "sheikhs(id, name, city, photo_url)";
const SHEIKH_EMBED_MIN = "sheikhs(name, photo_url)";
import { validateSheikhImage, safeUploadFileName } from "./file-validation";
import { sanitizeFormRecord } from "./sanitize";
import { isSupabaseConfigured, formatSupabaseError, logSupabaseError } from "./supabase-config";

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

export const supabase = isConfigured
  ? createClient(url, key)
  : createClient("https://placeholder.supabase.co", "placeholder-anon-key-placeholder-anon-key-placeholder-anon-key-p" as string);

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
  if (!isConfigured) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let profile;
    const { data: initialProfile, error: profileError } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();
    profile = initialProfile;

    if (profileError) {
      logSupabaseError("getCurrentUser.profile", profileError);
    }

    if (!profile) {
      const { data: created, error: createError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name ?? "",
          role: "user",
        }, { onConflict: "id" })
        .select("*")
        .single();
      if (createError) logSupabaseError("getCurrentUser.createProfile", createError);
      profile = created;
    }

    return { ...user, profile };
  } catch (err) {
    logSupabaseError("getCurrentUser", err);
    return null;
  }
}

export async function getSheikhs() {
  return safeSupabaseQuery(
    "getSheikhs",
    () => supabase.from("sheikhs").select("*").order("name"),
    DEMO_SHEIKHS,
  );
}

export async function getSheikhById(id: string) {
  if (!isConfigured) {
    const sheikh = DEMO_SHEIKHS.find((s) => s.id === id) || null;
    const lessons = DEMO_LESSONS.filter((l) => l.sheikhs?.name === sheikh?.name);
    return { sheikh, lessons };
  }

  try {
    const { data: sheikh, error: sheikhError } = await supabase
      .from("sheikhs").select("*").eq("id", id).single();
    if (sheikhError) throw sheikhError;

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select(`*, ${SHEIKH_EMBED_MIN}`)
      .eq("sheikh_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (lessonsError) throw lessonsError;

    return { sheikh, lessons: lessons || [] };
  } catch (err) {
    logSupabaseError("getSheikhById", err, { id });
    const sheikh = DEMO_SHEIKHS.find((s) => s.id === id) || DEMO_SHEIKHS[0] || null;
    const lessons = DEMO_LESSONS.filter((l) => l.sheikhs?.name === sheikh?.name);
    return { sheikh, lessons };
  }
}

function filterLessonsList(
  rows: any[],
  { category, city, search }: { category?: string; city?: string; search?: string } = {},
) {
  let result = rows;
  if (category && category !== "الكل") {
    result = result.filter((l) => l.category === category);
  }
  if (city && city !== "كل المحافظات") {
    result = result.filter((l) => l.city === city);
  }
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
        s,
      ),
    );
  }
  return result;
}

export async function fetchApprovedLessonsFromDb() {
  if (!isConfigured) return { data: [] as any[], error: null, usingSeed: true };

  try {
    const { data, error } = await supabase
      .from("lessons")
      .select(`*, ${SHEIKH_EMBED}`)
      .eq("status", "approved")
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError("fetchApprovedLessonsFromDb", err);
    return { data: [], error: err, usingSeed: true };
  }
}

export async function getLessons({ category, city, search }: { category?: string; city?: string; search?: string } = {}) {
  const fallback = filterLessonsList(LESSONS_SEED, { category, city, search });

  if (!isConfigured) {
    return { data: fallback, error: null, usingSeed: true };
  }

  try {
    const { data } = await fetchApprovedLessonsFromDb();
    const result = filterLessonsList(data, { category, city, search });
    if (result.length === 0 && fallback.length > 0) {
      return { data: fallback, error: null, usingSeed: true };
    }
    return { data: result, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError("getLessons", err);
    return { data: fallback, error: null, usingSeed: true };
  }
}

export async function getLessonById(id: string) {
  const fallback = findSeedLessonById(id) || DEMO_LESSONS.find((l) => l.id === id) || null;

  if (!isConfigured) {
    return { lesson: fallback, error: null, usingSeed: true };
  }

  try {
    const byId = await supabase
      .from("lessons")
      .select(`*, ${SHEIKH_EMBED}`)
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();

    if (byId.error) throw byId.error;
    if (byId.data) return { lesson: byId.data, error: null, usingSeed: false };

    const byExternalKey = await supabase
      .from("lessons")
      .select(`*, ${SHEIKH_EMBED}`)
      .eq("external_key", id)
      .eq("status", "approved")
      .maybeSingle();

    if (byExternalKey.error) throw byExternalKey.error;
    return {
      lesson: byExternalKey.data || fallback,
      error: null,
      usingSeed: !byExternalKey.data && !!fallback,
    };
  } catch (err) {
    logSupabaseError("getLessonById", err, { id });
    return { lesson: fallback, error: null, usingSeed: true };
  }
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
  return safeSupabaseQuery(
    "getApprovedFawaid",
    () => supabase.from("fawaid").select("*").eq("status", "approved").order("created_at", { ascending: false }),
    DEMO_FAWAID,
  );
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
  const filterSeed = (rows: typeof DEMO_LIBRARY) => {
    let result = rows;
    if (type) result = result.filter((r) => r.type === type);
    if (category) result = result.filter((r) => r.category === category);
    return result;
  };

  if (!isConfigured) {
    return { data: filterSeed(DEMO_LIBRARY), error: null, usingSeed: true };
  }

  try {
    let q = supabase.from("library_items").select("*").eq("status", "approved");
    if (type) q = q.eq("type", type);
    if (category) q = q.eq("category", category);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    const rows = data || [];
    if (rows.length === 0) {
      return { data: filterSeed(DEMO_LIBRARY), error: null, usingSeed: true };
    }
    return { data: rows, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError("getLibrary", err);
    return { data: filterSeed(DEMO_LIBRARY), error: null, usingSeed: true };
  }
}

export async function getMiracles({ category, sourceType }: { category?: string; sourceType?: string } = {}) {
  const filterSeed = (rows: typeof DEMO_MIRACLES) => {
    let result = rows;
    if (category) result = result.filter((r) => r.category === category);
    if (sourceType) result = result.filter((r) => r.source_type === sourceType);
    return result;
  };

  if (!isConfigured) {
    return { data: filterSeed(DEMO_MIRACLES), error: null, usingSeed: true };
  }

  try {
    let q = supabase.from("scientific_miracles").select("*").eq("status", "approved");
    if (category) q = q.eq("category", category);
    if (sourceType) q = q.eq("source_type", sourceType);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    const rows = data || [];
    if (rows.length === 0) {
      return { data: filterSeed(DEMO_MIRACLES), error: null, usingSeed: true };
    }
    return { data: rows, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError("getMiracles", err);
    return { data: filterSeed(DEMO_MIRACLES), error: null, usingSeed: true };
  }
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
    { count: sheikhs },
    { data: recentReports },
    { data: lessonRows },
    { data: recentLessons },
    { data: viewRows },
    { data: searchRows },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("library_items").select("*", { count: "exact", head: true }),
    supabase.from("fawaid").select("*", { count: "exact", head: true }),
    supabase.from("qa_questions").select("*", { count: "exact", head: true }),
    supabase.from("error_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("transcriptions").select("*", { count: "exact", head: true }),
    supabase.from("content_views").select("*", { count: "exact", head: true }).gte("viewed_at", startOfDay.toISOString()),
    supabase.from("sheikhs").select("*", { count: "exact", head: true }),
    supabase.from("error_reports").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(8),
    supabase.from("lessons").select("activity_type, is_course, status"),
    supabase.from("lessons").select("id, title, updated_at, activity_type").order("updated_at", { ascending: false }).limit(6),
    supabase.from("content_views").select("content_type, content_id").eq("content_type", "lesson").order("viewed_at", { ascending: false }).limit(300),
    supabase.from("search_queries").select("query").order("searched_at", { ascending: false }).limit(200),
  ]);

  const rows = lessonRows || [];
  const coursesCount = rows.filter((l: any) => l.is_course || l.activity_type === "دورة").length;
  const lecturesCount = rows.filter((l: any) => l.activity_type === "محاضرة").length;
  const lessonsCount = rows.filter((l: any) => l.status === "approved" && !l.is_course && l.activity_type !== "دورة" && l.activity_type !== "محاضرة").length;

  const viewCounts = new Map<string, number>();
  for (const row of viewRows || []) {
    const id = String(row.content_id);
    viewCounts.set(id, (viewCounts.get(id) || 0) + 1);
  }
  const topViewedIds = [...viewCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, views]) => ({ id, views }));

  let topViewedLessons: { id: string; title: string; views: number }[] = [];
  if (topViewedIds.length > 0) {
    const { data: titles } = await supabase
      .from("lessons")
      .select("id, title, external_key")
      .in("id", topViewedIds.map((v) => v.id));
    topViewedLessons = topViewedIds.map((item) => {
      const match = (titles || []).find((t: any) => t.id === item.id);
      return { id: match?.external_key || item.id, title: match?.title || item.id, views: item.views };
    });
  }

  const searchCounts = new Map<string, number>();
  for (const row of searchRows || []) {
    const q = String(row.query || "").trim();
    if (!q) continue;
    searchCounts.set(q, (searchCounts.get(q) || 0) + 1);
  }
  const topSearches = [...searchCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([query, count]) => ({ query, count }));

  let serverOk = false;
  try {
    const res = await fetch("/api/healthz", { signal: AbortSignal.timeout(4000) });
    serverOk = res.ok;
  } catch {
    /* offline */
  }

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
      totalSheikhs: sheikhs || 0,
      coursesCount,
      lecturesCount,
      regularLessonsCount: lessonsCount,
      dbConnected: isSupabaseConfigured(),
      serverOk,
    },
    recentReports: recentReports || [],
    recentLessons: recentLessons || [],
    topViewedLessons,
    topSearches,
  };
}

export async function adminResolveReport(id: string) {
  return await supabase.from("error_reports").update({ status: "resolved" }).eq("id", id);
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

function sheikhStoragePathFromUrl(imageUrl: string): string | null {
  try {
    const marker = "/storage/v1/object/public/sheikhs/";
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(imageUrl.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export async function uploadSheikhImage(file: File, sheikhId?: string) {
  const check = validateSheikhImage(file);
  if (!check.ok) throw new Error(check.error);

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const fileName = safeUploadFileName(
    `${sheikhId || crypto.randomUUID()}-${Date.now()}.${safeExt}`,
    safeExt,
  );
  const { error } = await supabase.storage.from("sheikhs").upload(fileName, file, {
    upsert: true,
    contentType: file.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("sheikhs").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteSheikhImage(imageUrl: string) {
  const path = sheikhStoragePathFromUrl(imageUrl);
  if (!path) return { error: null };
  return await supabase.storage.from("sheikhs").remove([path]);
}

export async function adminGetLessons() {
  const { data, error } = await supabase
    .from("lessons").select("*, sheikhs(name)")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function adminUpsertLesson(data: any) {
  const { id, ...rest } = data;
  delete rest.sheikhs;

  const sanitized = sanitizeFormRecord(rest, {
    title: { max: 500 },
    speaker_name: { max: 200 },
    description: { max: 8000 },
    mosque: { max: 400 },
    city: { max: 120 },
    region: { max: 400 },
    category: { max: 80 },
    schedule: { max: 300 },
    day_of_week: { max: 40 },
    lesson_time: { max: 80 },
    delivery: { max: 80 },
    audience: { max: 80 },
    external_key: { max: 120 },
    activity_type: { max: 40 },
    course_id: { max: 120 },
    live_url: { type: "url" },
    book_url: { type: "url" },
    maps_url: { type: "url" },
    video_url: { type: "url" },
    audio_url: { type: "url" },
    sheikh_image_url: { type: "url", max: 2048 },
    poster_image_url: { type: "url", max: 2048 },
  }) as typeof rest;

  if (!sanitized.end_date) sanitized.end_date = null;
  if (!sanitized.speaker_name) sanitized.speaker_name = null;
  if (!sanitized.region) sanitized.region = null;
  if (!sanitized.day_of_week) sanitized.day_of_week = null;

  const result = id
    ? await supabase.from("lessons").update(sanitized).eq("id", id)
    : await supabase.from("lessons").insert(sanitized);

  return result;
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
  const { id, ...rest } = data;
  delete rest.sheikhs;
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
    return { data: DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"), error: null, usingDemo: true };
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
      error: null,
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
  const { id, ...rest } = data;
  delete rest.qa_categories;
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
  const filterSeed = () => {
    let rows = DEMO_QUIZ_QUESTIONS.filter((q) => q.status !== "draft");
    if (section && section !== "الكل") rows = rows.filter((q) => q.section === section);
    if (level && level !== "الكل") rows = rows.filter((q) => q.level === level);
    return rows;
  };

  if (!isConfigured) {
    return { data: filterSeed(), error: null, usingSeed: true };
  }

  try {
    let q = supabase
      .from("quiz_questions")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (section && section !== "الكل") q = q.eq("section", section);
    if (level && level !== "الكل") q = q.eq("level", level);
    const { data, error } = await q;
    if (error) throw error;
    const rows = data || [];
    if (rows.length === 0) {
      return { data: filterSeed(), error: null, usingSeed: true };
    }
    return { data: rows, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError("getQuizQuestions", err);
    return { data: filterSeed(), error: null, usingSeed: true };
  }
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
  adhkar: any[];
  fiqh_decisions?: any[];
  fatwas?: any[];
  rulings?: any[];
  courses?: any[];
  updates?: any[];
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
  adhkar: [],
  fiqh_decisions: [],
  fatwas: [],
  rulings: [],
  courses: [],
  updates: [],
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
      .select(`id, title, category, description, mosque, schedule, ${SHEIKH_EMBED_MIN}`)
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
      supabase.from("sheikhs").select("id, name, bio, specialties, photo_url").ilike("name", ilikePattern(p)).limit(20)
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

async function searchAdhkarFallback(term: string) {
  const items = filterAdhkar(term).slice(0, 15).map((item) => ({
    id: item.id,
    text: item.text,
    category: ADHKAR_CATEGORIES.find((c) => c.id === item.categoryId)?.name,
    source: item.source,
  }));
  return { data: items, errors: [] as any[] };
}

async function searchEverythingFallback(term: string): Promise<SearchResults> {
  const [lessons, sheikhs, library, qa, miracles, fawaid, adhkar] = await Promise.all([
    searchLessonsFallback(term),
    searchSheikhsFallback(term),
    searchLibraryFallback(term),
    searchQaFallback(term),
    searchMiraclesFallback(term),
    searchFawaidFallback(term),
    searchAdhkarFallback(term),
  ]);

  void [
    ...lessons.errors,
    ...sheikhs.errors,
    ...library.errors,
    ...qa.errors,
    ...miracles.errors,
    ...fawaid.errors,
    ...adhkar.errors,
  ];

  return {
    lessons: lessons.data,
    sheikhs: sheikhs.data,
    library: library.data,
    qa: qa.data,
    miracles: miracles.data,
    fawaid: fawaid.data,
    adhkar: adhkar.data,
    ...searchPlatformSeed(term),
    error: null,
    usingDemo: false,
  };
}

export async function searchEverything(term: string): Promise<SearchResults> {
  const query = term.trim();
  if (!query) return { ...EMPTY_SEARCH };

  if (!isConfigured) {
    const demo = searchDemoContent(query);
    const platform = searchPlatformSeed(query);
    return { ...demo, ...platform, usingDemo: true, error: null };
  }

  try {
    const { data, error } = await supabase.rpc("search_platform", { query });

    if (!error && data) {
      const adhkar = filterAdhkar(query).slice(0, 15).map((item) => ({
        id: item.id,
        text: item.text,
        category: ADHKAR_CATEGORIES.find((c) => c.id === item.categoryId)?.name,
        source: item.source,
      }));
      const platformFallback = searchPlatformSeed(query);
      return {
        lessons: data.lessons || [],
        library: data.library || [],
        miracles: data.miracles || [],
        sheikhs: data.sheikhs || [],
        qa: data.qa || [],
        fawaid: data.fawaid || [],
        adhkar,
        fiqh_decisions: data.fiqh_decisions?.length ? data.fiqh_decisions : platformFallback.fiqh_decisions,
        fatwas: data.fatwas?.length ? data.fatwas : platformFallback.fatwas,
        rulings: data.rulings?.length ? data.rulings : platformFallback.rulings,
        courses: data.courses?.length ? data.courses : platformFallback.courses,
        updates: data.updates?.length ? data.updates : platformFallback.updates,
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
  const platform = searchPlatformSeed(query);
  const merged = { ...fallback, ...platform };
  const total =
    merged.lessons.length +
    merged.library.length +
    merged.miracles.length +
    merged.sheikhs.length +
    merged.qa.length +
    merged.fawaid.length +
    merged.adhkar.length +
    (merged.fiqh_decisions?.length || 0) +
    (merged.fatwas?.length || 0) +
    (merged.rulings?.length || 0) +
    (merged.courses?.length || 0) +
    (merged.updates?.length || 0);

  if (total === 0) {
    const demo = searchDemoContent(query);
    const demoPlatform = searchPlatformSeed(query);
    const demoTotal =
      demo.lessons.length +
      demo.library.length +
      demo.sheikhs.length +
      demo.qa.length +
      demo.fawaid.length +
      demo.adhkar.length +
      demoPlatform.fiqh_decisions.length +
      demoPlatform.fatwas.length +
      demoPlatform.rulings.length +
      demoPlatform.courses.length +
      demoPlatform.updates.length;
    if (demoTotal > 0) {
      return { ...demo, ...demoPlatform, usingDemo: true, error: fallback.error ?? null };
    }
  }

  return merged;
}

export type PrayerTimesRow = {
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

export type IslamicOccasionCacheRow = {
  occasion_id: string;
  next_gregorian_date: string | null;
  days_remaining: number | null;
  hijri_label: string | null;
  synced_at: string;
};

export async function getPrayerTimesFromDb(dateKey: string) {
  if (!isConfigured) return null;

  try {
    const { data, error } = await supabase
      .from("prayer_times")
      .select("date, fajr, sunrise, dhuhr, asr, maghrib, isha")
      .eq("city", "الكويت")
      .eq("governorate", "العاصمة")
      .eq("date", dateKey)
      .maybeSingle();

    if (error) {
      if (isMissingSchemaError(error)) return null;
      logSupabaseError("getPrayerTimesFromDb", error, { dateKey });
      return null;
    }

    return (data as PrayerTimesRow | null) ?? null;
  } catch (err) {
    logSupabaseError("getPrayerTimesFromDb", err, { dateKey });
    return null;
  }
}

export async function getIslamicOccasionsCacheFromDb() {
  const fallback: IslamicOccasionCacheRow[] = [];
  const result = await safeSupabaseQuery(
    "getIslamicOccasionsCacheFromDb",
    () =>
      supabase
        .from("islamic_occasions_cache")
        .select("occasion_id, next_gregorian_date, days_remaining, hijri_label, synced_at")
        .order("days_remaining", { ascending: true }),
    fallback,
  );
  return result.data;
}
