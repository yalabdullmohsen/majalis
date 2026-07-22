import { requestFetch } from "@/lib/request-manager";
import { getSupabaseClient, bootstrapSupabaseFromServer } from "./supabase-bootstrap";
import { arabicMatchAny, arabicSearchPatterns, ilikePattern } from "./arabic-search";
import { loadSeedData } from "./seed-loader";
import {
  filterLibraryCatalog,
  getLibraryBookById,
  mergeLibraryWithCatalog,
  normalizeLibraryRow,
  searchLibraryCatalog,
  sortLibraryItems,
} from "./library-service";
import { safeSupabaseQuery, isMissingSchemaError } from "./safe-supabase";
import { normalizeActivityType } from "./activity-label";
import { isBootstrapOwnerEmail, isOwnerProfile, hasUnrestrictedAdminAccess, resolveUserEmail } from "./owner-config";

/** Columns that exist on the live `sheikhs` table (no image_url / avatar_url). */
const SHEIKH_EMBED = "sheikhs(id, name, city, photo_url)";
const SHEIKH_EMBED_MIN = "sheikhs(name, photo_url)";
import { writeAuditLog } from "@/lib/cms/audit-log";
import { validateSheikhImage, safeUploadFileName } from "./file-validation";
import { sanitizeFormRecord } from "./sanitize";
import { isSupabaseConfigured, formatSupabaseError, logSupabaseError } from "./supabase-config";
import { allowSeedFallback } from "@/lib/cms/production-config";

export { bootstrapSupabaseFromServer };


const isConfigured = isSupabaseConfigured();

export { isSupabaseConfigured, formatSupabaseError };

/** Lazy proxy — picks up runtime config after bootstrapSupabaseFromServer() */
export const supabase = new Proxy({} as ReturnType<typeof getSupabaseClient>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") return (value as (...args: unknown[]) => unknown).bind(client);
    return value;
  },
});

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

/**
 * مزوّد Google غير مُفعَّل حاليًا في إعدادات Supabase Auth (لوحة التحكم →
 * Authentication → Providers → Google) — تحقّق حي (2026-07-17): الضغط على
 * الزر يُعيد فعليًا "Unsupported provider: provider is not enabled" من
 * Supabase مباشرة. هذا إعداد لوحة تحكم لا كود، ويحتاج Client ID/Secret من
 * Google Cloud Console (URI الإعادة المُعتمَد: <مشروع Supabase>/auth/v1/callback)
 * لا أملك صلاحية الوصول لهما. الزر مخفي في LoginPage/RegisterPage حتى
 * يُفعَّل — أعد GOOGLE_OAUTH_ENABLED إلى true فور تفعيله من لوحة التحكم.
 */
export const GOOGLE_OAUTH_ENABLED = false;

export async function signInWithGoogle(redirectTo?: string) {
  const redirect = redirectTo || `${window.location.origin}/auth/callback`;
  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirect,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
}

/**
 * مسارات الأدمن تحتاج تحقّقًا فعليًا من الخادم (auth.getUser() يراسل
 * خادم المصادقة ليتأكد أن الجلسة لم تُلغَ/تُحظر منذ آخر تحديث توكن محلي)
 * — صلاحيات حسّاسة (حوكمة/إدارة) لا تحتمل نافذة ثقة بجلسة محلية قديمة.
 * باقي المسارات العامة لا تحتاج هذا الضمان، وgetUser() كان السبب الفعلي
 * المتبقي لبطء 9-11 ثانية على iOS (رُصد حيًّا 2026-07-22؛ توازي profile/
 * governance أعلاه لم يكفِ لأن الاستدعاء الأول نفسه — لا الاثنان
 * التاليان — هو عنق الزجاجة). getSession() يقرأ الجلسة محليًا بلا شبكة.
 */
function isAdminRoute(): boolean {
  if (typeof window === "undefined") return true; // خادم/SSR: الأكثر أمانًا افتراضيًا
  return window.location.pathname.startsWith("/admin");
}

export async function getCurrentUser() {
  if (!isConfigured) return null;

  try {
    const user = isAdminRoute()
      ? (await supabase.auth.getUser()).data.user
      : (await supabase.auth.getSession()).data.session?.user ?? null;
    if (!user) return null;

    // profiles وgovernance_user_roles لا يعتمد أحدهما على الآخر (كلاهما
    // يحتاج user.id فقط) — كانا يُنتظران بالتتابع فيتراكم زمن الشبكة
    // (رُصد فعليًا: getCurrentUser يصل أحيانًا 9-11 ثانية). التوازي هنا
    // يقصّ أسوأ حالة تقريبًا للنصف دون أي تغيير في RLS/الصلاحيات.
    const [profileResult, governanceResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("governance_user_roles")
        .select("role_id")
        .eq("user_id", user.id)
        .maybeSingle()
        .then((r) => r, () => ({ data: null, error: null })), // RLS قد تمنع حتى تُطبَّق migration
    ]);

    let profile = profileResult.data;
    if (profileResult.error) {
      logSupabaseError("getCurrentUser.profile", profileResult.error);
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

    const LEGACY_MAP: Record<string, string> = {
      admin: "super_admin",
      sheikh: "scientific_reviewer",
      user: "read_only",
    };

    const governanceRole: string | undefined = governanceResult.data?.role_id || undefined;

    const resolvedGovernanceRole = governanceRole || LEGACY_MAP[profile?.role || "user"] || "read_only";
    const ownerAccess = hasUnrestrictedAdminAccess({
      email: resolveUserEmail(user),
      profile,
      governanceRole: resolvedGovernanceRole,
    });
    const effectiveGovernanceRole = ownerAccess ? "super_admin" : resolvedGovernanceRole;

    return {
      ...user,
      profile: {
        ...profile,
        governance_role: effectiveGovernanceRole,
        is_owner: profile?.is_owner === true || isBootstrapOwnerEmail(resolveUserEmail(user)),
        is_super_admin: profile?.is_super_admin === true || ownerAccess,
        is_admin: profile?.is_admin === true || ownerAccess,
        status: profile?.status || "active",
      },
      governance_role: effectiveGovernanceRole,
      is_owner: isOwnerProfile(profile) || isBootstrapOwnerEmail(resolveUserEmail(user)),
    };
  } catch (err) {
    logSupabaseError("getCurrentUser", err);
    return null;
  }
}

export async function getSheikhs() {
  const { DEMO_SHEIKHS } = await loadSeedData();
  return safeSupabaseQuery(
    "getSheikhs",
    // حدّ أمان ضد نموّ الجدول — المستدعون يحتاجون القائمة كاملة (بحث بالاسم/عرض)
    // والعدد الحالي ~١٠٥، فالحدّ لا يقتطع شيئًا اليوم.
    () => supabase.from("sheikhs").select("*").order("name").limit(300),
    DEMO_SHEIKHS,
  );
}

export async function getSheikhById(id: string) {
  if (!isConfigured) {
    const { DEMO_SHEIKHS, DEMO_LESSONS } = await loadSeedData();
    const sheikh = DEMO_SHEIKHS.find((s: any) => s.id === id) || null;
    const lessons = DEMO_LESSONS.filter((l: any) => l.sheikhs?.name === sheikh?.name);
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
    const { DEMO_SHEIKHS, DEMO_LESSONS } = await loadSeedData();
    const sheikh = DEMO_SHEIKHS.find((s: any) => s.id === id) || DEMO_SHEIKHS[0] || null;
    const lessons = DEMO_LESSONS.filter((l: any) => l.sheikhs?.name === sheikh?.name);
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
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError("fetchApprovedLessonsFromDb", err);
    return { data: [], error: err, usingSeed: true };
  }
}

export async function getLessons({ category, city, search }: { category?: string; city?: string; search?: string } = {}) {
  const { LESSONS_SEED } = await loadSeedData();
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
  const { findSeedLessonById, DEMO_LESSONS } = await loadSeedData();
  const fallback = findSeedLessonById(id) || DEMO_LESSONS.find((l: any) => l.id === id) || null;

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

    // external_key may have been stored with ":" but ID in URLs uses "-" (sanitized)
    const colonId = id.replace(/-/g, ":");
    const byExternalKey = await supabase
      .from("lessons")
      .select(`*, ${SHEIKH_EMBED}`)
      .or(`external_key.eq.${id},external_key.eq.${colonId}`)
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

/** أدخل/حدّث جميع صفوف LESSONS_SEED في جدول lessons — يتطلب صلاحيات المدير. */
export async function upsertSeedLessonsToDb(): Promise<{ ok: boolean; synced: number; error?: string }> {
  if (!isConfigured) return { ok: false, synced: 0, error: "supabase_not_configured" };
  const { LESSONS_SEED } = await loadSeedData();
  const rows = LESSONS_SEED.map((row: any) => ({
    external_key: row.external_key,
    title: row.title,
    speaker_name: row.speaker_name,
    poster_image_url: row.poster_image_url || null,
    category: row.category,
    city: row.city,
    region: row.region,
    mosque: row.mosque,
    day_of_week: row.day_of_week,
    lesson_time: row.lesson_time,
    schedule: row.schedule,
    description: row.description || null,
    audience: row.audience,
    delivery: row.delivery,
    status: "approved" as const,
    keywords: row.keywords || [],
    live_url: row.live_url || null,
    book_url: row.book_url || null,
    maps_url: row.maps_url || null,
    start_date: row.start_date || null,
    end_date: row.end_date || null,
    is_recurring: row.is_recurring,
    activity_type: row.activity_type,
    is_course: row.is_course,
    course_id: row.course_id || null,
    session_count: row.session_count || null,
    linked_titles: row.linked_titles || [],
  }));

  try {
    const { data, error } = await supabase
      .from("lessons")
      .upsert(rows, { onConflict: "external_key", ignoreDuplicates: false })
      .select("id");
    if (error) {
      logSupabaseError("upsertSeedLessonsToDb", error);
      return { ok: false, synced: 0, error: error.message };
    }
    return { ok: true, synced: data?.length ?? 0 };
  } catch (err: any) {
    logSupabaseError("upsertSeedLessonsToDb", err);
    return { ok: false, synced: 0, error: err?.message };
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
  const { DEMO_FAWAID } = await loadSeedData();
  return safeSupabaseQuery(
    "getApprovedFawaid",
    // FawaidPage تُصفّي بالفئة وتبحث محليًا في القائمة كاملة، لذا حدّ ١٠٠ كان
    // ليُخفي ~٨٠٪ من الفوائد (البذرة وحدها ٥١٠). الحدّ هنا حارس ضد الجموح فقط.
    // الإصلاح الجذري = ترقيم صفحات من الخادم داخل FawaidPage.
    () => supabase.from("fawaid").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(1000),
    DEMO_FAWAID,
  );
}

export async function getVerifiedHadith(options: { limit?: number; collection?: string; chapter?: string; authenticityClass?: "sahih" | "daif" | "mawdu" } = {}) {
  // مفتاح فريد يشمل كل معاملات الفلترة: RequestManager يُوحِّد (dedupe) الطلبات
  // المتزامنة بنفس المفتاح — نطاق ثابت هنا كان يجعل نداءات getVerifiedHadith
  // المتزامنة بفلاتر مختلفة (كما في HadithIndexPage: sahih/daif/mawdu معًا عبر
  // Promise.all) تتشارك نتيجة أول نداء فقط، فتعرض صفحة فهرس الأحاديث نفس
  // العدد (والنتائج) للأقسام الثلاثة كلها (عطل حقيقي، 2026-07-17).
  const scope = `getVerifiedHadith:${options.authenticityClass ?? "any"}:${options.collection ?? ""}:${options.chapter ?? ""}:${options.limit ?? 500}`;
  return safeSupabaseQuery(
    scope,
    () => {
      let q = supabase
        .from("verified_hadith_items")
        .select("id, title, text, narrator, source_name, grade, authenticity_class, collection, chapter, explanation, keywords, hadith_number, metadata, created_at")
        .eq("verification_status", "verified")
        .order("collection", { ascending: true })
        .order("hadith_number", { ascending: true })
        .limit(options.limit ?? 500);
      if (options.collection) q = q.eq("collection", options.collection);
      if (options.chapter) q = q.eq("chapter", options.chapter);
      if (options.authenticityClass) q = q.eq("authenticity_class", options.authenticityClass);
      return q;
    },
    [],
  );
}

export async function getAkpStories(options: { limit?: number; category?: string } = {}) {
  // نفس إصلاح getVerifiedHadith أعلاه: مفتاح يشمل الفلاتر لتفادي تصادم
  // dedupe عند نداءات متزامنة بفئات مختلفة.
  return safeSupabaseQuery(
    `getAkpStories:${options.category ?? "any"}:${options.limit ?? 100}`,
    () => {
      let q = supabase
        .from("akp_stories")
        .select("id, title, body, source_name, category, topic, summary, created_at")
        .eq("verification_status", "verified")
        .order("created_at", { ascending: false })
        .limit(options.limit ?? 100);
      if (options.category) q = q.eq("category", options.category);
      return q;
    },
    [],
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
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function moderateFawaid(id: string, status: string) {
  return await supabase.from("fawaid").update({ status }).eq("id", id);
}

export async function getLibrary({ type, category }: { type?: string; category?: string } = {}) {
  const catalogFiltered = filterLibraryCatalog({
    category: category && category !== "الكل" ? category : undefined,
    type: type && type !== "الكل" ? type : undefined,
  });

  if (!isConfigured) {
    return { data: catalogFiltered, error: null, usingSeed: true };
  }

  try {
    let q = supabase.from("library_items").select("*").eq("status", "approved");
    if (type) q = q.eq("type", type);
    if (category) q = q.eq("category", category);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data || []).map((row) => normalizeLibraryRow(row));
    if (allowSeedFallback() && rows.length === 0) {
      return { data: catalogFiltered, error: null, usingSeed: true };
    }
    const merged = sortLibraryItems(mergeLibraryWithCatalog(rows));
    let result = merged;
    if (category && category !== "الكل") result = result.filter((row) => row.category === category);
    if (type && type !== "الكل") result = result.filter((row) => row.type === type);
    return { data: result, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError("getLibrary", err);
    return { data: allowSeedFallback() ? catalogFiltered : [], error: null, usingSeed: allowSeedFallback() };
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getLibraryItemById(id: string) {
  if (!id) return { data: null, error: null };

  // library_items.id عمود uuid — كتب الفهرس الثابت (library-catalog.ts) تستخدم
  // slugs نصية مثل "book-bukhari" لا UUID، فالاستعلام يفشل دائمًا بـ400 (نوع
  // بيانات غير صالح) لكل كتاب ثابت. تخطّي الاستعلام كليًا لهذه الحالة يزيل طلب
  // شبكة وضجيج طرفية مضمونَي الفشل، ويحافظ على نفس سلوك السقوط لمصدر الفهرس.
  if (isConfigured && UUID_RE.test(id)) {
    try {
      const { data, error } = await supabase
        .from("library_items")
        .select("*")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      if (!error && data) {
        return { data: normalizeLibraryRow(data), error: null };
      }
    } catch (err) {
      logSupabaseError("getLibraryItemById", err);
    }
  }

  const catalog = getLibraryBookById(id);
  return { data: catalog, error: catalog ? null : new Error("not found") };
}

export async function getMiracles({ category, sourceType }: { category?: string; sourceType?: string } = {}) {
  const filterSeed = async () => {
    const { filterMiraclesSeed } = await loadSeedData();
    return filterMiraclesSeed({ category, sourceType } as any);
  };

  if (!isConfigured) {
    return { data: await filterSeed(), error: null, usingSeed: true };
  }

  try {
    let q = supabase.from("scientific_miracles").select("*").eq("status", "approved");
    if (category) q = q.eq("category", category);
    if (sourceType) q = q.eq("source_type", sourceType);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    const rows = data || [];
    if (rows.length === 0) {
      return { data: await filterSeed(), error: null, usingSeed: true };
    }
    return { data: rows, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError("getMiracles", err);
    return { data: await filterSeed(), error: null, usingSeed: true };
  }
}

export async function getMyAchievements(userId: string) {
  const { data } = await supabase
    .from("achievements").select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })
    .limit(100);
  return data || [];
}

// ─── Admin CRUD ────────────────────────────────────────────────────────────────

export async function adminGetStats() {
  // كل الأرقام تُحسب عبر count/head — بلا جلب صفوف الجداول كاملة.
  const [
    sheikhs,
    lessonsTotal,
    lessonsApproved,
    lessonsPending,
    library,
    miracles,
    fawaidTotal,
    pendingFawaid,
    qaTotal,
    qaPublished,
    quizPublished,
  ] = await Promise.all([
    supabase.from("sheikhs").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("lessons").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("library_items").select("*", { count: "exact", head: true }),
    supabase.from("scientific_miracles").select("*", { count: "exact", head: true }),
    supabase.from("fawaid").select("*", { count: "exact", head: true }),
    supabase.from("fawaid").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("qa_questions").select("*", { count: "exact", head: true }),
    supabase.from("qa_questions").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("quiz_questions").select("*", { count: "exact", head: true }).eq("is_published", true),
  ]);
  return {
    sheikhsCount: sheikhs.count ?? 0,
    lessonsTotal: lessonsTotal.count ?? 0,
    lessonsApproved: lessonsApproved.count ?? 0,
    lessonsPending: lessonsPending.count ?? 0,
    libraryCount: library.count ?? 0,
    miraclesCount: miracles.count ?? 0,
    fawaidTotal: fawaidTotal.count ?? 0,
    pendingFawaidCount: pendingFawaid.count ?? 0,
    qaTotal: qaTotal.count ?? 0,
    qaPublished: qaPublished.count ?? 0,
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
    { count: hadith },
    { count: stories },
    { count: miracles },
    { count: rulings },
    { count: fiqhItems },
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
    supabase.from("verified_hadith_items").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
    supabase.from("akp_stories").select("*", { count: "exact", head: true }),
    supabase.from("scientific_miracles").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("sharia_rulings").select("*", { count: "exact", head: true }),
    supabase.from("fiqh_council_items").select("*", { count: "exact", head: true }),
    supabase.from("error_reports").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(8),
    supabase.from("lessons").select("activity_type, is_course, status"),
    supabase.from("lessons").select("id, title, updated_at, activity_type").order("updated_at", { ascending: false }).limit(6),
    supabase.from("content_views").select("content_type, content_id").eq("content_type", "lesson").order("viewed_at", { ascending: false }).limit(300),
    supabase.from("search_queries").select("query").order("searched_at", { ascending: false }).limit(200),
  ]);

  const rows = lessonRows || [];
  const coursesCount = rows.filter((l: any) => l.is_course || l.activity_type === "دورة").length;
  const lecturesCount = rows.filter((l: any) => normalizeActivityType(l.activity_type) === "درس" && !l.is_course).length;
  const lessonsCount = rows.filter((l: any) => l.status === "approved" && !l.is_course && l.activity_type !== "دورة").length;

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
    const res = await requestFetch("/api/healthz", { signal: AbortSignal.timeout(4000) });
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
      totalHadith: hadith || 0,
      totalStories: stories || 0,
      totalMiracles: miracles || 0,
      totalRulings: rulings || 0,
      totalFiqhItems: fiqhItems || 0,
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
  return adminFetchAll("sheikhs", "*", "name", true);
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

// ── Helper: جلب جميع الصفوف من جدول بدون حد PostgREST (1000 صف افتراضياً) ──
async function adminFetchAll(
  table: string,
  selectStr: string,
  orderCol = "created_at",
  ascending = false,
): Promise<{ data: any[]; error: any }> {
  const PAGE = 500;
  let all: any[] = [];
  let page = 0;
  while (true) {
    const from = page * PAGE;
    const to = from + PAGE - 1;
    const { data, error, count } = await (supabase as any)
      .from(table)
      .select(selectStr, { count: "exact" })
      .order(orderCol, { ascending })
      .range(from, to);
    if (error) return { data: all, error };
    all = all.concat(data ?? []);
    if (all.length >= (count ?? 0) || (data?.length ?? 0) < PAGE) break;
    page++;
  }
  return { data: all, error: null };
}

export async function adminGetLessons(page = 0, pageSize = 500) {
  const from = page * pageSize;
  const to   = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("lessons")
    .select("*, sheikhs(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  return { data: data || [], error, count: count ?? 0 };
}

export async function adminGetAllLessons() {
  const PAGE = 500;
  let all: any[] = [];
  let page = 0;
  while (true) {
    const { data, error, count } = await adminGetLessons(page, PAGE);
    if (error) return { data: all, error };
    all = all.concat(data);
    if (all.length >= (count ?? 0) || data.length < PAGE) break;
    page++;
  }
  return { data: all, error: null };
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

  if (!result.error) {
    void writeAuditLog({
      action: id ? "update" : "create",
      table_name: "lessons",
      record_id: id,
      content_kind: sanitized.is_course ? "course" : sanitized.activity_type === "محاضرة" ? "lecture" : "lesson",
      metadata: { external_key: sanitized.external_key, title: sanitized.title },
    });
  }

  return result;
}

export async function adminDeleteLesson(id: string) {
  return await supabase.from("lessons").delete().eq("id", id).select("id");
}

export async function adminGetLibrary() {
  return adminFetchAll("library_items", "*, sheikhs(name)");
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
  return adminFetchAll("scientific_miracles", "*");
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
  return adminFetchAll("fawaid", "*");
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
  return adminFetchAll("profiles", "*");
}

export async function adminUpdateUserRole(userId: string, role: string) {
  return await supabase.from("profiles").update({ role }).eq("id", userId);
}

// ─── الأسئلة والأجوبة الدينية ───────────────────────────────────────────────────

export async function getQaCategories() {
  if (!isConfigured) {
    const { DEMO_QA_CATEGORIES } = await loadSeedData();
    return { data: DEMO_QA_CATEGORIES.filter((c: any) => c.id !== "all"), error: null, usingDemo: true };
  }

  const { data, error } = await supabase
    .from("qa_categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    logSupabaseError("getQaCategories", error);
    const { DEMO_QA_CATEGORIES } = await loadSeedData();
    return { data: DEMO_QA_CATEGORIES.filter((c: any) => c.id !== "all"), error: null, usingDemo: true };
  }

  return { data: data || [], error: null, usingDemo: false };
}

export async function getQaQuestions({ categoryId, search }: { categoryId?: string; search?: string } = {}) {
  if (!isConfigured) {
    const { filterDemoQa } = await loadSeedData();
    return {
      data: allowSeedFallback() ? filterDemoQa({ categoryId, search }) : [],
      error: null,
      usingDemo: allowSeedFallback(),
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
    const { filterDemoQa } = await loadSeedData();
    return {
      data: allowSeedFallback() ? filterDemoQa({ categoryId, search }) : [],
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
  return adminFetchAll("qa_questions", "*, qa_categories(name, slug)");
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

const USED_QUIZ_IDS_KEY = "majalis_used_quiz_v1";

export function getLocalUsedQuizIds(): Set<string> {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(USED_QUIZ_IDS_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markLocalQuizIdUsed(id: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const current = getLocalUsedQuizIds();
    current.add(id);
    localStorage.setItem(USED_QUIZ_IDS_KEY, JSON.stringify([...current]));
  } catch { /* localStorage write failed silently */ }
}

export async function markQuizQuestionUsed(id: string): Promise<void> {
  if (!id) return;
  markLocalQuizIdUsed(id);
  // Only update Supabase for UUID-format IDs (not local seed IDs)
  if (!isConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return;
  try {
    await supabase
      .from("quiz_questions")
      .update({ is_used: true, updated_at: new Date().toISOString() })
      .eq("id", id);
  } catch { /* silent */ }
}

export function resetAllUsedQuizIds(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(USED_QUIZ_IDS_KEY);
  }
}

export async function getQuizQuestions({ section, level }: { section?: string; level?: string } = {}) {
  const localUsedIds = getLocalUsedQuizIds();

  const filterSeed = async () => {
    const { DEMO_QUIZ_QUESTIONS } = await loadSeedData();
    let rows = DEMO_QUIZ_QUESTIONS.filter(
      (q: any) => q.status !== "draft" && !localUsedIds.has(q.id ?? ""),
    );
    if (section && section !== "الكل") rows = rows.filter((q: any) => q.section === section);
    if (level && level !== "الكل") rows = rows.filter((q: any) => q.level === level);
    return rows;
  };

  if (!isConfigured) {
    return { data: await filterSeed(), error: null, usingSeed: true };
  }

  try {
    let q = supabase
      .from("quiz_questions")
      .select("id, section, category, level, question, answer, hint, is_used, is_published")
      .eq("is_published", true)
      .or("is_used.is.null,is_used.eq.false")
      .order("created_at", { ascending: false });
    if (section && section !== "الكل") q = q.eq("section", section);
    if (level && level !== "الكل") q = q.eq("level", level);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data || []).filter((r: any) => !localUsedIds.has(String(r.id)));
    if (rows.length === 0) {
      return { data: await filterSeed(), error: null, usingSeed: true };
    }
    return { data: rows, error: null, usingSeed: false };
  } catch (err) {
    logSupabaseError("getQuizQuestions", err);
    return { data: await filterSeed(), error: null, usingSeed: true };
  }
}

export async function adminGetQuizQuestions() {
  return adminFetchAll("quiz_questions", "*");
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

export async function adminSetQuizQuestionStatus(id: string, isPublished: boolean) {
  return await supabase
    .from("quiz_questions")
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq("id", id);
}

/** رفع أسئلة الـ Seed إلى Supabase — يستخدم INSERT ON CONFLICT DO NOTHING لأمان كامل. */
export async function upsertQuizSeedToDb(): Promise<{ ok: boolean; synced: number; error?: string }> {
  if (!isConfigured) return { ok: false, synced: 0, error: "supabase_not_configured" };
  const { DEMO_QUIZ_QUESTIONS } = await loadSeedData();
  const rows = DEMO_QUIZ_QUESTIONS.filter((q: any) => q.status !== "draft").map((q: any) => ({
    section: q.section,
    category: q.category || q.section,
    // اكتُشف 2026-07-18: quiz_questions.level مقيَّد بـCHECK constraint حي
    // يقبل فقط 'أساسي'|'متوسط'|'متقدم'|'صعب' (عربي) — الترميز السابق هنا
    // ('beginner'/'intermediate'/'advanced') كان يُسقِط أي مزامنة فوراً
    // بمخالفة القيد، وهو السبب الفعلي وراء بقاء الجدول الحي عند 15 صفاً
    // اختبارياً قديماً فقط رغم نمو quiz-seed.ts إلى 943 عبر جلسات كثيرة
    // (أُصلح الانحراف يدوياً عبر supabase/quiz_questions_widen_section_
    // constraint_v1.sql + scripts/gen-quiz-sync-sql.mjs، لكن هذا الإصلاح
    // هنا ضروري كي يعمل الزر الإداري بشكل صحيح لأي إضافة مستقبلية).
    level: q.level === "سهل" ? "أساسي" : q.level,
    question: q.question,
    answer: q.answer,
    is_published: true,
    is_used: false,
  }));
  try {
    // upsert بدل insert: يتخطى تكرار question (قيد UNIQUE حي على العمود)
    // بدل فشل الدفعة كاملةً عند أول تعارض — يطابق النية الموثَّقة أصلاً.
    const { error } = await supabase
      .from("quiz_questions")
      .upsert(rows, { onConflict: "question", ignoreDuplicates: true });
    if (error) throw error;
    return { ok: true, synced: rows.length };
  } catch (err) {
    logSupabaseError("upsertQuizSeedToDb", err);
    return { ok: false, synced: 0, error: formatSupabaseError(err) };
  }
}

/** إعادة تعيين is_used=false لجميع الأسئلة في Supabase + localStorage. */
export async function adminResetAllQuizIsUsed(): Promise<{ ok: boolean; error?: string }> {
  if (!isConfigured) return { ok: false, error: "supabase_not_configured" };
  try {
    // gt('created_at', '2000-01-01') = all rows (workaround: no .update().all() in Supabase JS)
    const { error } = await supabase
      .from("quiz_questions")
      .update({ is_used: false })
      .gt("created_at", "2000-01-01");
    if (error) throw error;
    resetAllUsedQuizIds(); // clear localStorage too
    return { ok: true };
  } catch (err) {
    logSupabaseError("adminResetAllQuizIsUsed", err);
    return { ok: false, error: formatSupabaseError(err) };
  }
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
  rulings?: any[];
  courses?: any[];
  updates?: any[];
  hadith?: any[];
  stories?: any[];
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
  rulings: [],
  courses: [],
  updates: [],
  hadith: [],
  stories: [],
};

function mergeUniqueById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

/**
 * أعمدة قاعدة البيانات مخزَّنة بنصّها الأصلي (غير مطبَّعة)، بينما استعلام المستخدم
 * قد يصل مطبَّعًا («الصلاه» بدل «الصلاة»). لذلك كل بحث ilike يجب أن يمرّ عبر
 * arabicSearchPatterns() التي توسّع صيغ الهمزات/التاء المربوطة/الألف المقصورة
 * والمرادفات — استعمال ilikePattern(term) الخام يُرجع صفر نتائج.
 *
 * توسعة الأنماط قد تُنتج عشرات الصيغ لعبارة متعددة الكلمات، لذا تُجمَّع في دفعات
 * ضمن شرط or() واحد بدل استعلام مستقل لكل نمط (عدد الطلبات ينخفض ~10×،
 * ويبقى طول الـURL بعيدًا عن حدود PostgREST).
 */
const PATTERNS_PER_QUERY = 10;

function searchPatternChunks(term: string): string[][] {
  const patterns = arabicSearchPatterns(term);
  const chunks: string[][] = [];
  for (let i = 0; i < patterns.length; i += PATTERNS_PER_QUERY) {
    chunks.push(patterns.slice(i, i + PATTERNS_PER_QUERY));
  }
  return chunks;
}

/** يبني شرط `or()` واحدًا: كل نمط × كل عمود. */
function orIlikeFilter(columns: string[], patterns: string[]): string {
  return patterns
    .flatMap((p) => {
      const like = ilikePattern(p);
      return columns.map((column) => `${column}.ilike.${like}`);
    })
    .join(",");
}

async function searchLessonsFallback(term: string) {
  const queries = searchPatternChunks(term).map((chunk) =>
    supabase
      .from("lessons")
      .select(`id, title, category, description, mosque, schedule, ${SHEIKH_EMBED_MIN}`)
      .eq("status", "approved")
      .or(orIlikeFilter(["title", "description", "category", "mosque", "city"], chunk))
      .limit(40),
  );

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
  const responses = await Promise.all(
    searchPatternChunks(term).map((chunk) =>
      supabase
        .from("sheikhs")
        .select("id, name, bio, specialties, photo_url")
        .or(orIlikeFilter(["name"], chunk))
        .limit(20)
    )
  );
  const rows = mergeUniqueById(responses.flatMap((r) => r.data || [])).filter((s: any) =>
    arabicMatchAny([s.name, s.bio, ...(s.specialties || [])], term)
  );
  return { data: rows, errors: responses.map((r) => r.error).filter(Boolean) };
}

async function searchLibraryFallback(term: string) {
  const responses = await Promise.all(
    searchPatternChunks(term).map((chunk) =>
      supabase
        .from("library_items")
        .select("id, title, type, description, category")
        .eq("status", "approved")
        .or(orIlikeFilter(["title", "description", "category"], chunk))
        .limit(20)
    )
  );
  const rows = mergeUniqueById(responses.flatMap((r) => r.data || [])).filter((it: any) =>
    arabicMatchAny([it.title, it.description, it.category, it.type, it.author, it.author_name], term)
  );
  if (rows.length > 0) {
    return { data: rows, errors: responses.map((r) => r.error).filter(Boolean) };
  }
  return {
    data: searchLibraryCatalog(term).map((book) => ({
      id: book.id,
      title: book.title,
      type: book.type,
      description: book.description,
      category: book.category,
      author: book.author,
    })),
    errors: responses.map((r) => r.error).filter(Boolean),
  };
}

async function searchQaFallback(term: string) {
  const responses = await Promise.all(
    searchPatternChunks(term).map((chunk) =>
      supabase
        .from("qa_questions")
        .select("id, question, answer, qa_categories(name)")
        .eq("status", "published")
        .or(orIlikeFilter(["question", "answer"], chunk))
        .limit(20)
    )
  );
  const rows = mergeUniqueById(responses.flatMap((r) => r.data || [])).filter((x: any) =>
    arabicMatchAny([x.question, x.answer, x.qa_categories?.name], term)
  );
  return { data: rows, errors: responses.map((r) => r.error).filter(Boolean) };
}

async function searchMiraclesFallback(term: string) {
  if (!isConfigured) {
    const { searchMiraclesSeed } = await loadSeedData();
    return {
      data: searchMiraclesSeed(term).map((m: any) => ({ id: m.id, title: m.title, category: m.category, body: m.body })),
      errors: [] as any[],
    };
  }
  const responses = await Promise.all(
    searchPatternChunks(term).map((chunk) =>
      supabase
        .from("scientific_miracles")
        .select("id, title, category, body")
        .eq("status", "approved")
        .or(orIlikeFilter(["title", "body"], chunk))
        .limit(15)
    )
  );
  const errors = responses.map((r) => r.error).filter(Boolean);
  for (const error of errors) logSupabaseError("searchMiraclesFallback", error, { term });

  const rows = mergeUniqueById(responses.flatMap((r) => r.data || []));
  const dbRows = rows.filter((m: any) => arabicMatchAny([m.title, m.body, m.category], term));
  if (dbRows.length > 0) {
    return { data: dbRows.slice(0, 15), errors };
  }
  const { searchMiraclesSeed } = await loadSeedData();
  return {
    data: searchMiraclesSeed(term).map((m: any) => ({ id: m.id, title: m.title, category: m.category, body: m.body })),
    errors,
  };
}

async function searchFawaidFallback(term: string) {
  const responses = await Promise.all(
    searchPatternChunks(term).map((chunk) =>
      supabase
        .from("fawaid")
        .select("id, text, author_name")
        .eq("status", "approved")
        .or(orIlikeFilter(["text", "author_name"], chunk))
        .limit(15)
    )
  );
  const errors = responses.map((r) => r.error).filter(Boolean);
  for (const error of errors) logSupabaseError("searchFawaidFallback", error, { term });

  const rows = mergeUniqueById(responses.flatMap((r) => r.data || []));
  return {
    data: rows.filter((f: any) => arabicMatchAny([f.text, f.author_name], term)).slice(0, 15),
    errors,
  };
}

async function searchAdhkarFallback(term: string) {
  const { filterAdhkar, ADHKAR_CATEGORIES } = await loadSeedData();
  const items = filterAdhkar(term).slice(0, 15).map((item: any) => ({
    id: item.id,
    text: item.text,
    category: ADHKAR_CATEGORIES.find((c: any) => c.id === item.categoryId)?.name,
    source: item.source,
  }));
  return { data: items, errors: [] as any[] };
}

async function searchHadithFallback(term: string) {
  if (!isConfigured) return { data: [] as any[], errors: [] as any[] };
  const responses = await Promise.all(
    searchPatternChunks(term).map((chunk) =>
      supabase
        .from("verified_hadith_items")
        .select("id, title, text, narrator, collection, grade")
        .eq("status", "published")
        .or(orIlikeFilter(["title", "text", "narrator"], chunk))
        .limit(10)
    )
  );
  const errors = responses.map((r) => r.error).filter(Boolean);
  for (const error of errors) logSupabaseError("searchHadithFallback", error, { term });

  const rows = mergeUniqueById(responses.flatMap((r) => r.data || []));
  return {
    data: rows.filter((h: any) => arabicMatchAny([h.title, h.text, h.narrator, h.collection], term)).slice(0, 10),
    errors,
  };
}

async function searchStoriesFallback(term: string) {
  if (!isConfigured) return { data: [] as any[], errors: [] as any[] };
  const responses = await Promise.all(
    searchPatternChunks(term).map((chunk) =>
      supabase
        .from("akp_stories")
        .select("id, title, topic, summary, category, source_name")
        .eq("status", "published")
        .or(orIlikeFilter(["title", "topic", "summary"], chunk))
        .limit(10)
    )
  );
  const errors = responses.map((r) => r.error).filter(Boolean);
  for (const error of errors) logSupabaseError("searchStoriesFallback", error, { term });

  const rows = mergeUniqueById(responses.flatMap((r) => r.data || []));
  return {
    data: rows.filter((s: any) => arabicMatchAny([s.title, s.topic, s.summary, s.category], term)).slice(0, 10),
    errors,
  };
}

async function searchEverythingFallback(term: string): Promise<SearchResults> {
  const [lessons, sheikhs, library, qa, miracles, fawaid, adhkar, hadith, stories] = await Promise.all([
    searchLessonsFallback(term),
    searchSheikhsFallback(term),
    searchLibraryFallback(term),
    searchQaFallback(term),
    searchMiraclesFallback(term),
    searchFawaidFallback(term),
    searchAdhkarFallback(term),
    searchHadithFallback(term),
    searchStoriesFallback(term),
  ]);

  return {
    lessons: lessons.data,
    sheikhs: sheikhs.data,
    library: library.data,
    qa: qa.data,
    miracles: miracles.data,
    fawaid: fawaid.data,
    adhkar: adhkar.data,
    hadith: hadith.data,
    stories: stories.data,
    ...(await loadSeedData()).searchPlatformSeed(term),
    error: null,
    usingDemo: false,
  };
}

export async function searchEverything(term: string): Promise<SearchResults> {
  const query = term.trim();
  if (!query) return { ...EMPTY_SEARCH };

  if (!isConfigured) {
    const seeds = await loadSeedData();
    const demo = seeds.searchDemoContent(query);
    const platform = seeds.searchPlatformSeed(query);
    return { ...demo, ...platform, usingDemo: true, error: null };
  }

  // ملاحظة: كانت هذه الدالة تحاول أولاً استدعاء RPC باسم "search_platform"
  // قبل اللجوء للبحث المباشر عبر الجداول — تحقَّقنا (2026-07-16) عبر استعلام
  // مباشر لقاعدة بيانات الإنتاج (pg_proc) أن هذه الدالة **غير موجودة إطلاقًا**
  // ولم تكن موجودة على الأرجح منذ فترة، فكل استدعاء بحث كان يهدر جولة شبكة
  // كاملة تفشل دائمًا (خطأ "function does not exist") قبل السقوط تلقائيًا
  // لمسار البحث المباشر أدناه (searchEverythingFallback) — وهو المسار الذي
  // يُستخدَم فعليًا في كل بحث حتى الآن، ويدعم أصلاً تطبيعًا وتفاوتًا عربيًا
  // (همزات، مرادفات، تشابه تحريري) عبر arabicSearchPatterns/searchPatternChunks
  // في كل دالة searchXFallback. أُزيل استدعاء الـRPC الميت لتفادي هذه الجولة
  // الضائعة وضجيج السجلات على كل بحث في التطبيق.
  const seeds = await loadSeedData();
  const fallback = await searchEverythingFallback(query);
  const platform = seeds.searchPlatformSeed(query);
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
    (merged.rulings?.length || 0) +
    (merged.courses?.length || 0) +
    (merged.updates?.length || 0);

  if (total === 0) {
    const demo = seeds.searchDemoContent(query);
    const demoPlatform = seeds.searchPlatformSeed(query);
    const demoTotal =
      demo.lessons.length +
      demo.library.length +
      demo.sheikhs.length +
      demo.qa.length +
      demo.fawaid.length +
      demo.adhkar.length +
      demoPlatform.fiqh_decisions.length +
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

// ─── Knowledge Relationships ───────────────────────────────────────────────

export type KnowledgeRelType =
  | "شيخ_تلميذ"
  | "مؤلف_كتاب"
  | "شرح_لكتاب"
  | "فتوى_في_باب"
  | "درس_عن_كتاب"
  | "مرتبط";

// ملاحظة: "fatwa" أُزيل من هذا الاتحاد (2026-07-18) — قسم /fatwa حُذف
// بالكامل من التطبيق (commit 3a995462)، وجدول fatwas في DB فارغ تماماً
// (0 صف)، ولا صف واحد في knowledge_relationships استخدم هذا النوع قط
// (تحقّقتُ مباشرة قبل الحذف). فتاوى المجمع الفقهي المؤسسية لا تُدار عبر
// هذا النظام أصلاً.
export type KnowledgeSourceType = "scholar" | "lesson" | "book" | "fawaid" | "question";

export type KnowledgeRelationship = {
  id: string;
  source_type: KnowledgeSourceType;
  source_id: string;
  target_type: KnowledgeSourceType;
  target_id: string;
  relationship_type: KnowledgeRelType;
  label: string | null;
  is_verified: boolean;
  source_reference: string | null;
  created_at: string;
  updated_at: string;
};

export async function getKnowledgeRelationships(opts?: {
  sourceType?: KnowledgeSourceType;
  sourceId?: string;
  targetType?: KnowledgeSourceType;
  targetId?: string;
  verifiedOnly?: boolean;
  limit?: number;
}): Promise<KnowledgeRelationship[]> {
  if (!isConfigured) return [];
  try {
    let q = supabase
      .from("knowledge_relationships")
      .select("id,source_type,source_id,target_type,target_id,relationship_type,label,is_verified,source_reference,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (opts?.sourceType) q = q.eq("source_type", opts.sourceType);
    if (opts?.sourceId)   q = q.eq("source_id",   opts.sourceId);
    if (opts?.targetType) q = q.eq("target_type", opts.targetType);
    if (opts?.targetId)   q = q.eq("target_id",   opts.targetId);
    if (opts?.verifiedOnly) q = q.eq("is_verified", true);
    if (opts?.limit) q = q.limit(opts.limit);

    const { data, error } = await q;
    if (error) {
      if (isMissingSchemaError(error)) return [];
      logSupabaseError("getKnowledgeRelationships", error, opts ?? {});
      return [];
    }
    return (data as KnowledgeRelationship[]) ?? [];
  } catch (err) {
    logSupabaseError("getKnowledgeRelationships", err, opts ?? {});
    return [];
  }
}

export async function getRelatedItems(
  sourceType: KnowledgeSourceType,
  sourceId: string,
): Promise<KnowledgeRelationship[]> {
  if (!isConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("knowledge_relationships")
      .select("id,source_type,source_id,target_type,target_id,relationship_type,label,is_verified,source_reference,created_at,updated_at")
      .or(
        `and(source_type.eq.${sourceType},source_id.eq.${sourceId}),and(target_type.eq.${sourceType},target_id.eq.${sourceId})`,
      )
      .eq("is_verified", true)
      .limit(20);

    if (error) {
      if (isMissingSchemaError(error)) return [];
      logSupabaseError("getRelatedItems", error, { sourceType, sourceId });
      return [];
    }
    return (data as KnowledgeRelationship[]) ?? [];
  } catch (err) {
    logSupabaseError("getRelatedItems", err, { sourceType, sourceId });
    return [];
  }
}

export async function upsertKnowledgeRelationship(
  rel: Omit<KnowledgeRelationship, "id" | "created_at" | "updated_at">,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isConfigured) return { ok: false, error: "Supabase not configured" };
  try {
    const { data, error } = await supabase
      .from("knowledge_relationships")
      .upsert(rel, { onConflict: "source_type,source_id,target_type,target_id,relationship_type" })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: (data as { id: string }).id };
  } catch (err: unknown) {
    return { ok: false, error: String(err) };
  }
}

export async function setKnowledgeRelVerified(id: string, verified: boolean): Promise<boolean> {
  if (!isConfigured) return false;
  try {
    const { error } = await supabase
      .from("knowledge_relationships")
      .update({ is_verified: verified })
      .eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteKnowledgeRelationship(id: string): Promise<boolean> {
  if (!isConfigured) return false;
  try {
    const { error } = await supabase
      .from("knowledge_relationships")
      .delete()
      .eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

export async function getAllKnowledgeRelationshipsAdmin(limit = 200): Promise<KnowledgeRelationship[]> {
  if (!isConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("knowledge_relationships")
      .select("id,source_type,source_id,target_type,target_id,relationship_type,label,is_verified,source_reference,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingSchemaError(error)) return [];
      logSupabaseError("getAllKnowledgeRelationshipsAdmin", error, {});
      return [];
    }
    return (data as KnowledgeRelationship[]) ?? [];
  } catch (err) {
    logSupabaseError("getAllKnowledgeRelationshipsAdmin", err, {});
    return [];
  }
}
