/**
 * طبقة إدارة (CRUD) لمنظومة المسارات العلمية الموحّدة — لوحة الإدارة فقط.
 *
 * تختلف عن learning-paths-service.ts (القراءة العامة) في أمرين جوهريين:
 *  ١) لا فلترة بـ status='published' — الأدمن يجب أن يرى المسودات والعناصر
 *     التي تحتاج مراجعة أيضًا.
 *  ٢) كتابة مباشرة (insert/update/delete) بدل قراءة فقط، معتمدة كليًا على
 *     RLS (is_admin()) من طرف قاعدة البيانات كخط الدفاع الحقيقي — نفس نمط
 *     بقية أقسام لوحة الإدارة في هذا المشروع (adminUpsertLibraryItem وغيرها).
 */
import { supabase } from "@/lib/supabase";

export type AdminPath = {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  description: string | null;
  level: "beginner" | "intermediate" | "advanced";
  category: string | null;
  icon: string | null;
  sort_order: number;
  status: "draft" | "published" | "archived";
  total_sessions: number;
  what_you_learn: string[];
  legacy_estimated_hours: number | null;
};

export type AdminStage = {
  id: string;
  path_id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  status: "draft" | "published" | "archived";
};

export type AdminCourse = {
  id: string;
  stage_id: string;
  slug: string;
  title: string;
  description: string | null;
  learning_goal: string | null;
  level: "foundational" | "intermediate" | "advanced" | "specialist";
  sort_order: number;
  pass_percentage: number;
  outcomes: string[];
  status: "draft" | "published" | "archived" | "needs_review";
};

export type AdminUnit = {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
};

export type AdminItem = {
  id: string;
  unit_id: string;
  item_type: "book" | "lesson" | "activity" | "assessment";
  title: string;
  description: string | null;
  content_ref_table: "lessons" | "library_items" | null;
  content_ref_id: string | null;
  external_url: string | null;
  session_estimate: number;
  minutes_estimate: number | null;
  weight: number;
  is_required: boolean;
  completion_method: "manual_confirm" | "watch_percent" | "read_scroll" | "assessment_pass" | "activity_submit";
  completion_threshold: number | null;
  sort_order: number;
  status: "draft" | "published" | "needs_review" | "archived";
  is_approved: boolean;
  assessment_id: string | null;
};

export type AdminBook = {
  id: string;
  learning_item_id: string;
  book_title: string;
  book_author: string | null;
  material_role: "أساسية إلزامية" | "شرح أساسي" | "مادة مساندة" | "قراءة إثرائية" | "مرجع متقدم" | "اختيارية";
  scope_description: string | null;
  inclusion_reason: string | null;
  source_name: string | null;
  source_url: string | null;
  license_note: string | null;
};

export type AdminPrerequisite = { id: string; course_id: string; requires_course_id: string };

export type AdminAssessment = {
  id: string;
  scope_type: "course" | "stage" | "path";
  course_id: string | null;
  stage_id: string | null;
  path_id: string | null;
  title: string;
  pass_percentage: number;
  max_attempts: number | null;
  status: "draft" | "published" | "needs_review" | "archived";
};

export type AdminQuestion = {
  id: string;
  assessment_id: string;
  question_type: "mcq" | "true_false" | "ordering" | "matching" | "short_answer" | "essay";
  question_text: string;
  options: unknown;
  correct_answer: unknown;
  explanation: string | null;
  explanation_source: string | null;
  points: number;
  sort_order: number;
  source_bank: string | null;
  is_approved: boolean;
};

type Res<T> = Promise<{ data: T | null; error: { message: string } | null }>;

async function fetchList<T>(table: string, match: Record<string, string>, orderCol = "sort_order"): Res<T[]> {
  let q = supabase.from(table).select("*");
  for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
  const { data, error } = await q.order(orderCol, { ascending: true });
  return { data: (data as T[]) ?? null, error };
}

async function upsertRow<T extends { id?: string }>(table: string, row: T): Res<T> {
  const { id, ...rest } = row as any;
  const payload = id ? { id, ...rest } : rest;
  const { data, error } = await supabase.from(table).upsert(payload).select("*").single();
  return { data: data as T, error };
}

async function deleteRow(table: string, id: string): Res<null> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  return { data: null, error };
}

// ─── المسارات ────────────────────────────────────────────────────────────

export const adminFetchPaths = () => fetchList<AdminPath>("learning_paths", {});
export const adminUpsertPath = (row: Partial<AdminPath>) => upsertRow<Partial<AdminPath>>("learning_paths", row);
export const adminDeletePath = (id: string) => deleteRow("learning_paths", id);

// ─── المراحل ─────────────────────────────────────────────────────────────

export const adminFetchStages = (pathId: string) => fetchList<AdminStage>("path_stages", { path_id: pathId });
export const adminUpsertStage = (row: Partial<AdminStage>) => upsertRow<Partial<AdminStage>>("path_stages", row);
export const adminDeleteStage = (id: string) => deleteRow("path_stages", id);

// ─── المقررات ────────────────────────────────────────────────────────────

export const adminFetchCourses = (stageId: string) => fetchList<AdminCourse>("courses", { stage_id: stageId });
export const adminUpsertCourse = (row: Partial<AdminCourse>) => upsertRow<Partial<AdminCourse>>("courses", row);
export const adminDeleteCourse = (id: string) => deleteRow("courses", id);

/** كل مقررات مسار معيّن (عبر كل مراحله) — لقائمة اختيار المتطلبات السابقة. */
export async function adminFetchAllCoursesInPath(pathId: string): Promise<Array<{ id: string; title: string; stage_title: string }>> {
  const { data: stages } = await supabase.from("path_stages").select("id, title").eq("path_id", pathId);
  const stageIds = (stages ?? []).map((s: any) => s.id);
  if (stageIds.length === 0) return [];
  const { data: courses } = await supabase.from("courses").select("id, title, stage_id").in("stage_id", stageIds);
  const stageTitleMap = new Map((stages ?? []).map((s: any) => [s.id, s.title]));
  return (courses ?? []).map((c: any) => ({ id: c.id, title: c.title, stage_title: stageTitleMap.get(c.stage_id) ?? "" }));
}

// ─── المتطلبات السابقة ───────────────────────────────────────────────────

export const adminFetchPrerequisites = (courseId: string) =>
  fetchList<AdminPrerequisite>("prerequisites", { course_id: courseId }, "created_at");

export async function adminAddPrerequisite(courseId: string, requiresCourseId: string): Res<AdminPrerequisite> {
  const { data, error } = await supabase
    .from("prerequisites")
    .insert({ course_id: courseId, requires_course_id: requiresCourseId })
    .select("*")
    .single();
  return { data: data as AdminPrerequisite, error };
}

export const adminRemovePrerequisite = (id: string) => deleteRow("prerequisites", id);

// ─── الوحدات ─────────────────────────────────────────────────────────────

export const adminFetchUnits = (courseId: string) => fetchList<AdminUnit>("course_units", { course_id: courseId });
export const adminUpsertUnit = (row: Partial<AdminUnit>) => upsertRow<Partial<AdminUnit>>("course_units", row);
export const adminDeleteUnit = (id: string) => deleteRow("course_units", id);

// ─── عناصر التعلّم ───────────────────────────────────────────────────────

export const adminFetchItems = (unitId: string) => fetchList<AdminItem>("learning_items", { unit_id: unitId });
export const adminUpsertItem = (row: Partial<AdminItem>) => upsertRow<Partial<AdminItem>>("learning_items", row);
export const adminDeleteItem = (id: string) => deleteRow("learning_items", id);

// ─── الكتب المرتبطة بعنصر تعلّم ──────────────────────────────────────────

export const adminFetchBooks = (learningItemId: string) =>
  fetchList<AdminBook>("course_books", { learning_item_id: learningItemId }, "created_at");
export const adminUpsertBook = (row: Partial<AdminBook>) => upsertRow<Partial<AdminBook>>("course_books", row);
export const adminDeleteBook = (id: string) => deleteRow("course_books", id);

// ─── التقييمات وأسئلتها ──────────────────────────────────────────────────

export async function adminFetchAssessments(
  scopeType: "course" | "stage" | "path",
  scopeId: string,
): Res<AdminAssessment[]> {
  const col = scopeType === "course" ? "course_id" : scopeType === "stage" ? "stage_id" : "path_id";
  const { data, error } = await supabase.from("assessments").select("*").eq(col, scopeId).order("created_at");
  return { data: (data as AdminAssessment[]) ?? null, error };
}

export const adminUpsertAssessment = (row: Partial<AdminAssessment>) =>
  upsertRow<Partial<AdminAssessment>>("assessments", row);
export const adminDeleteAssessment = (id: string) => deleteRow("assessments", id);

export const adminFetchQuestions = (assessmentId: string) =>
  fetchList<AdminQuestion>("assessment_questions", { assessment_id: assessmentId });
export const adminUpsertQuestion = (row: Partial<AdminQuestion>) =>
  upsertRow<Partial<AdminQuestion>>("assessment_questions", row);
export const adminDeleteQuestion = (id: string) => deleteRow("assessment_questions", id);

// ─── إعادة الترتيب (تبديل sort_order بين عنصرين متجاورين) ───────────────

export async function adminSwapSortOrder(
  table: "path_stages" | "courses" | "course_units" | "learning_items" | "assessment_questions",
  a: { id: string; sort_order: number },
  b: { id: string; sort_order: number },
): Promise<{ error: { message: string } | null }> {
  const { error: e1 } = await supabase.from(table).update({ sort_order: b.sort_order }).eq("id", a.id);
  if (e1) return { error: e1 };
  const { error: e2 } = await supabase.from(table).update({ sort_order: a.sort_order }).eq("id", b.id);
  return { error: e2 };
}

// ─── تحقق النشر ──────────────────────────────────────────────────────────
// لا يسمح بترقية الحالة إلى "منشور" إن كان المحتوى غير مكتمل فعليًا —
// يمنع نشر مقرر بلا محتوى، أو اختبار إلزامي بلا أسئلة معتمدة.

export type PublishValidation = { ok: boolean; errors: string[] };

export async function adminValidateCourseForPublish(courseId: string): Promise<PublishValidation> {
  const errors: string[] = [];
  const { data: units } = await supabase.from("course_units").select("id").eq("course_id", courseId);
  const unitIds = (units ?? []).map((u: any) => u.id);
  if (unitIds.length === 0) {
    errors.push("لا توجد وحدات في هذا المقرر بعد");
    return { ok: false, errors };
  }
  const { data: items } = await supabase
    .from("learning_items")
    .select("id, is_required, item_type, assessment_id")
    .in("unit_id", unitIds);
  const requiredItems = (items ?? []).filter((i: any) => i.is_required);
  if (requiredItems.length === 0) {
    errors.push("لا يوجد عنصر تعلّم إلزامي واحد على الأقل — لا يمكن حساب الاجتياز بلا محتوى إلزامي");
  }
  const requiredAssessmentItems = requiredItems.filter((i: any) => i.item_type === "assessment" && i.assessment_id);
  for (const item of requiredAssessmentItems) {
    const { data: assessment } = await supabase
      .from("assessments")
      .select("id, status")
      .eq("id", (item as any).assessment_id)
      .maybeSingle();
    if (!assessment || assessment.status !== "published") {
      errors.push("يوجد عنصر اختبار إلزامي مرتبط بتقييم غير منشور بعد");
      continue;
    }
    const { count } = await supabase
      .from("assessment_questions")
      .select("id", { count: "exact", head: true })
      .eq("assessment_id", (item as any).assessment_id)
      .eq("is_approved", true);
    if (!count) {
      errors.push("يوجد اختبار إلزامي بلا أي سؤال معتمد (is_approved) — لن يستطيع أي طالب اجتيازه");
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * يعيد احتساب total_sessions لمسار من مجموع session_estimate لكل عناصر
 * التعلّم الإلزامية عبر كل مقرراته — بدل رقم يدوي عرضة للخطأ، بما يخدم مبدأ
 * "جلسات حقيقية لا ساعات وهمية" في محرك الحساب (src/lib/learning-paths/engine.ts).
 */
export async function adminRecomputePathTotalSessions(pathId: string): Promise<{ total: number; error: { message: string } | null }> {
  const { data: stages } = await supabase.from("path_stages").select("id").eq("path_id", pathId);
  const stageIds = (stages ?? []).map((s: any) => s.id);
  if (stageIds.length === 0) return { total: 0, error: null };
  const { data: courses } = await supabase.from("courses").select("id").in("stage_id", stageIds);
  const courseIds = (courses ?? []).map((c: any) => c.id);
  if (courseIds.length === 0) return { total: 0, error: null };
  const { data: units } = await supabase.from("course_units").select("id").in("course_id", courseIds);
  const unitIds = (units ?? []).map((u: any) => u.id);
  if (unitIds.length === 0) return { total: 0, error: null };
  const { data: items } = await supabase
    .from("learning_items")
    .select("session_estimate, is_required")
    .in("unit_id", unitIds)
    .eq("is_required", true);
  const total = (items ?? []).reduce((sum: number, i: any) => sum + Number(i.session_estimate), 0);
  const { error } = await supabase.from("learning_paths").update({ total_sessions: total }).eq("id", pathId);
  return { total, error };
}

export async function adminValidatePathForPublish(pathId: string): Promise<PublishValidation> {
  const errors: string[] = [];
  const { data: stages } = await supabase.from("path_stages").select("id").eq("path_id", pathId);
  const stageIds = (stages ?? []).map((s: any) => s.id);
  if (stageIds.length === 0) {
    errors.push("لا توجد مراحل في هذا المسار بعد");
    return { ok: false, errors };
  }
  const { count } = await supabase
    .from("courses")
    .select("id", { count: "exact", head: true })
    .in("stage_id", stageIds)
    .eq("status", "published");
  if (!count) {
    errors.push("لا يوجد مقرر منشور واحد على الأقل في أي مرحلة من مراحل هذا المسار");
  }
  return { ok: errors.length === 0, errors };
}
