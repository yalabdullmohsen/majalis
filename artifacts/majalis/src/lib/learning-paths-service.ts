/**
 * طبقة بيانات منظومة المسارات العلمية الموحّدة — تستهلك الجداول الجديدة
 * (learning_paths المُوسَّعة + path_stages + courses + course_units +
 * learning_items + course_books + path_enrollments + item_completion_events)
 * وتُغذّي محرك src/lib/learning-paths/engine.ts بالبيانات الخام اللازمة.
 */
import { supabase } from "@/lib/supabase";
import type { CompletionEvent, LearningItem, Prerequisite } from "@/lib/learning-paths/types";
import { isItemComplete } from "@/lib/learning-paths/engine";

export type PathSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: "beginner" | "intermediate" | "advanced";
  category: string | null;
  totalSessions: number;
  stagesCount: number;
  coursesCount: number;
  whatYouLearn: string[];
};

export type CourseListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: string;
  pathSlug: string;
  pathTitle: string;
};

/** كل المقررات المنشورة عبر جميع المسارات العلمية، لعرضها في فهرس الدورات الموحّد. */
export async function fetchAllCourses(): Promise<CourseListItem[]> {
  const { data: paths } = await supabase
    .from("learning_paths")
    .select("id, slug, title")
    .eq("status", "published");
  if (!paths?.length) return [];
  const pathById = new Map(paths.map((p) => [p.id, p]));

  const { data: stages } = await supabase
    .from("path_stages")
    .select("id, path_id")
    .eq("status", "published")
    .in("path_id", paths.map((p) => p.id));
  const stageIds = (stages ?? []).map((s) => s.id);
  if (!stageIds.length) return [];
  const stageToPath = new Map((stages ?? []).map((s) => [s.id, s.path_id]));

  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, description, level, stage_id, sort_order")
    .eq("status", "published")
    .in("stage_id", stageIds)
    .order("sort_order");

  return (courses ?? []).flatMap((c) => {
    const pathId = stageToPath.get(c.stage_id);
    const path = pathId ? pathById.get(pathId) : undefined;
    if (!path) return [];
    return [{
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      level: c.level,
      pathSlug: path.slug,
      pathTitle: path.title,
    }];
  });
}

export async function fetchPathList(): Promise<PathSummary[]> {
  const { data: paths, error } = await supabase
    .from("learning_paths")
    .select("id, slug, title, description, level, category, total_sessions, what_you_learn, status")
    .eq("status", "published")
    .order("sort_order");
  if (error || !paths) return [];

  const { data: stages } = await supabase.from("path_stages").select("id, path_id").eq("status", "published");
  const stageIds = (stages ?? []).map((s) => s.id);
  const { data: courses } = stageIds.length
    ? await supabase.from("courses").select("id, stage_id").eq("status", "published").in("stage_id", stageIds)
    : { data: [] as { id: string; stage_id: string }[] };

  const stagesByPath = new Map<string, number>();
  for (const s of stages ?? []) stagesByPath.set(s.path_id, (stagesByPath.get(s.path_id) ?? 0) + 1);

  const stageToPath = new Map((stages ?? []).map((s) => [s.id, s.path_id]));
  const coursesByPath = new Map<string, number>();
  for (const c of courses ?? []) {
    const pathId = stageToPath.get(c.stage_id);
    if (!pathId) continue;
    coursesByPath.set(pathId, (coursesByPath.get(pathId) ?? 0) + 1);
  }

  return paths.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    level: p.level,
    category: p.category,
    totalSessions: p.total_sessions ?? 0,
    stagesCount: stagesByPath.get(p.id) ?? 0,
    coursesCount: coursesByPath.get(p.id) ?? 0,
    whatYouLearn: Array.isArray(p.what_you_learn) ? p.what_you_learn : [],
  }));
}

export type PathDetail = PathSummary & {
  stages: StageDetail[];
};

export type StageDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  courses: CourseDetail[];
};

export type CourseDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  learningGoal: string | null;
  level: string;
  status: string;
  passPercentage: number;
  outcomes: string[];
  totalSessions: number;
  items: LearningItem[];
  books: CourseBookDetail[];
  requiresCourseIds: string[];
};

export type CourseBookDetail = {
  id: string;
  learningItemId: string;
  bookTitle: string;
  bookAuthor: string | null;
  materialRole: string;
  scopeDescription: string | null;
  inclusionReason: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
};

export async function fetchPathDetail(slug: string): Promise<PathDetail | null> {
  const { data: path, error } = await supabase
    .from("learning_paths")
    .select("id, slug, title, description, level, category, total_sessions, what_you_learn, status")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !path) return null;

  const { data: stages } = await supabase
    .from("path_stages")
    .select("id, slug, title, description, status, sort_order")
    .eq("path_id", path.id)
    .eq("status", "published")
    .order("sort_order");

  const stageIds = (stages ?? []).map((s) => s.id);
  const { data: courses } = stageIds.length
    ? await supabase
        .from("courses")
        .select("id, stage_id, slug, title, description, learning_goal, level, status, pass_percentage, outcomes, sort_order")
        .in("stage_id", stageIds)
        .order("sort_order")
    : { data: [] as any[] };

  const publishedCourses = (courses ?? []).filter((c) => c.status === "published");
  const courseIds = publishedCourses.map((c) => c.id);

  const { data: units } = courseIds.length
    ? await supabase.from("course_units").select("id, course_id, sort_order").in("course_id", courseIds).order("sort_order")
    : { data: [] as any[] };
  const unitIds = (units ?? []).map((u) => u.id);
  const unitToCourse = new Map((units ?? []).map((u) => [u.id, u.course_id]));

  const { data: itemRows } = unitIds.length
    ? await supabase
        .from("learning_items")
        .select("id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, status, sort_order, assessment_id")
        .in("unit_id", unitIds)
        .eq("status", "published")
        .order("sort_order")
    : { data: [] as any[] };

  const itemIds = (itemRows ?? []).map((i) => i.id);
  const { data: bookRows } = itemIds.length
    ? await supabase
        .from("course_books")
        .select("id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url")
        .in("learning_item_id", itemIds)
    : { data: [] as any[] };

  const { data: prereqRows } = courseIds.length
    ? await supabase.from("prerequisites").select("course_id, requires_course_id").in("course_id", courseIds)
    : { data: [] as any[] };

  const itemsByCourse = new Map<string, LearningItem[]>();
  for (const row of itemRows ?? []) {
    const courseId = unitToCourse.get(row.unit_id);
    if (!courseId) continue;
    const list = itemsByCourse.get(courseId) ?? [];
    list.push({
      id: row.id,
      unitId: row.unit_id,
      itemType: row.item_type,
      title: row.title,
      sessionEstimate: Number(row.session_estimate),
      minutesEstimate: row.minutes_estimate,
      weight: Number(row.weight),
      isRequired: row.is_required,
      completionMethod: row.completion_method,
      completionThreshold: row.completion_threshold,
      assessmentId: row.assessment_id,
    });
    itemsByCourse.set(courseId, list);
  }

  const booksByItem = new Map<string, CourseBookDetail[]>();
  for (const b of bookRows ?? []) {
    const list = booksByItem.get(b.learning_item_id) ?? [];
    list.push({
      id: b.id,
      learningItemId: b.learning_item_id,
      bookTitle: b.book_title,
      bookAuthor: b.book_author,
      materialRole: b.material_role,
      scopeDescription: b.scope_description,
      inclusionReason: b.inclusion_reason,
      sourceName: b.source_name,
      sourceUrl: b.source_url,
    });
    booksByItem.set(b.learning_item_id, list);
  }

  const coursesByStage = new Map<string, CourseDetail[]>();
  for (const c of publishedCourses) {
    const items = itemsByCourse.get(c.id) ?? [];
    const books = items.flatMap((i) => booksByItem.get(i.id) ?? []);
    const requiresCourseIds = (prereqRows ?? []).filter((p) => p.course_id === c.id).map((p) => p.requires_course_id);
    const detail: CourseDetail = {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      learningGoal: c.learning_goal,
      level: c.level,
      status: c.status,
      passPercentage: c.pass_percentage,
      outcomes: Array.isArray(c.outcomes) ? c.outcomes : [],
      totalSessions: items.filter((i) => i.isRequired).reduce((s, i) => s + i.sessionEstimate, 0),
      items,
      books,
      requiresCourseIds,
    };
    const list = coursesByStage.get(c.stage_id) ?? [];
    list.push(detail);
    coursesByStage.set(c.stage_id, list);
  }

  const stageDetails: StageDetail[] = (stages ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    status: s.status,
    courses: coursesByStage.get(s.id) ?? [],
  }));

  return {
    id: path.id,
    slug: path.slug,
    title: path.title,
    description: path.description,
    level: path.level,
    category: path.category,
    totalSessions: path.total_sessions ?? 0,
    stagesCount: stageDetails.length,
    coursesCount: stageDetails.reduce((s, st) => s + st.courses.length, 0),
    whatYouLearn: Array.isArray(path.what_you_learn) ? path.what_you_learn : [],
    stages: stageDetails,
  };
}

// ── تسجيل وتقدّم المستخدم ────────────────────────────────────────────────

export async function fetchEnrollment(userId: string, pathId: string) {
  const { data } = await supabase
    .from("path_enrollments")
    .select("id, enrolled_at, completed_at, weekly_session_target")
    .eq("user_id", userId)
    .eq("path_id", pathId)
    .maybeSingle();
  return data;
}

export async function enrollInPath(userId: string, pathId: string): Promise<void> {
  await supabase.from("path_enrollments").upsert(
    { user_id: userId, path_id: pathId },
    { onConflict: "user_id,path_id", ignoreDuplicates: true },
  );
}

export async function fetchCompletionEvents(userId: string, learningItemIds: string[]): Promise<CompletionEvent[]> {
  if (learningItemIds.length === 0) return [];
  const { data } = await supabase
    .from("item_completion_events")
    .select("learning_item_id, event_type, evidence_value, occurred_at")
    .eq("user_id", userId)
    .in("learning_item_id", learningItemIds)
    .order("occurred_at");
  return (data ?? []).map((r) => ({
    learningItemId: r.learning_item_id,
    eventType: r.event_type,
    evidenceValue: r.evidence_value,
    occurredAt: r.occurred_at,
  }));
}

export async function logCompletionEvent(
  userId: string,
  learningItemId: string,
  eventType: CompletionEvent["eventType"],
  evidenceType: LearningItem["completionMethod"],
  evidenceValue: number | null = null,
): Promise<void> {
  await supabase.from("item_completion_events").insert({
    user_id: userId,
    learning_item_id: learningItemId,
    event_type: eventType,
    evidence_type: evidenceType,
    evidence_value: evidenceValue,
  });
}

export async function fetchAllCoursePrerequisites(courseIds: string[]): Promise<Prerequisite[]> {
  if (courseIds.length === 0) return [];
  const { data } = await supabase.from("prerequisites").select("course_id, requires_course_id").in("course_id", courseIds);
  return (data ?? []).map((r) => ({ courseId: r.course_id, requiresCourseId: r.requires_course_id }));
}

// ── لوحة المتعلّم (/my-learning) ────────────────────────────────────────

export type UserEnrollmentProgress = {
  pathSlug: string;
  pathTitle: string;
  progressPct: number;
};

/** مسارات المستخدم المسجَّل بها مع نسبة تقدّم فعلية (محسوبة من أحداث الإنجاز، لا مخزَّنة). */
export async function fetchUserEnrollmentsWithProgress(userId: string): Promise<UserEnrollmentProgress[]> {
  const { data: enrollments } = await supabase
    .from("path_enrollments")
    .select("path_id")
    .eq("user_id", userId);
  if (!enrollments?.length) return [];
  const pathIds = enrollments.map((e) => e.path_id);

  const { data: paths } = await supabase.from("learning_paths").select("id, slug, title").in("id", pathIds);
  if (!paths?.length) return [];

  const { data: stages } = await supabase.from("path_stages").select("id, path_id").in("path_id", pathIds);
  const stageIds = (stages ?? []).map((s) => s.id);
  const stageToPath = new Map((stages ?? []).map((s) => [s.id, s.path_id]));

  const { data: courses } = stageIds.length
    ? await supabase.from("courses").select("id, stage_id").in("stage_id", stageIds)
    : { data: [] as { id: string; stage_id: string }[] };
  const courseIds = (courses ?? []).map((c) => c.id);
  const courseToPath = new Map((courses ?? []).map((c) => [c.id, stageToPath.get(c.stage_id)]));

  const { data: units } = courseIds.length
    ? await supabase.from("course_units").select("id, course_id").in("course_id", courseIds)
    : { data: [] as { id: string; course_id: string }[] };
  const unitIds = (units ?? []).map((u) => u.id);
  const unitToPath = new Map((units ?? []).map((u) => [u.id, courseToPath.get(u.course_id)]));

  const { data: items } = unitIds.length
    ? await supabase
        .from("learning_items")
        .select("id, unit_id, is_required, completion_method, completion_threshold")
        .in("unit_id", unitIds)
        .eq("status", "published")
        .eq("is_required", true)
    : { data: [] as { id: string; unit_id: string; is_required: boolean; completion_method: string; completion_threshold: number | null }[] };

  const itemIds = (items ?? []).map((i) => i.id);
  const events = await fetchCompletionEvents(userId, itemIds);
  const eventsByItem = new Map<string, CompletionEvent[]>();
  for (const ev of events) {
    const list = eventsByItem.get(ev.learningItemId) ?? [];
    list.push(ev);
    eventsByItem.set(ev.learningItemId, list);
  }

  const requiredByPath = new Map<string, number>();
  const completeByPath = new Map<string, number>();
  for (const it of items ?? []) {
    const pathId = unitToPath.get(it.unit_id);
    if (!pathId) continue;
    requiredByPath.set(pathId, (requiredByPath.get(pathId) ?? 0) + 1);
    const asItem = {
      id: it.id,
      completionMethod: it.completion_method,
      completionThreshold: it.completion_threshold,
    } as LearningItem;
    if (isItemComplete(asItem, eventsByItem.get(it.id) ?? [])) {
      completeByPath.set(pathId, (completeByPath.get(pathId) ?? 0) + 1);
    }
  }

  return paths.map((p) => {
    const total = requiredByPath.get(p.id) ?? 0;
    const done = completeByPath.get(p.id) ?? 0;
    return {
      pathSlug: p.slug,
      pathTitle: p.title,
      progressPct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
}

export type UserCertificateSummary = {
  certificate_code: string;
  title: string;
  path_slug?: string;
  issued_at: string;
};

export async function fetchUserCertificatesList(userId: string): Promise<UserCertificateSummary[]> {
  const { data: certs } = await supabase
    .from("certificates")
    .select("certificate_code, path_title_snapshot, path_id, issued_at, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("issued_at", { ascending: false });
  if (!certs?.length) return [];

  const pathIds = [...new Set(certs.map((c) => c.path_id).filter(Boolean))];
  const { data: paths } = pathIds.length
    ? await supabase.from("learning_paths").select("id, slug").in("id", pathIds)
    : { data: [] as { id: string; slug: string }[] };
  const slugById = new Map((paths ?? []).map((p) => [p.id, p.slug]));

  return certs.map((c) => ({
    certificate_code: c.certificate_code,
    title: c.path_title_snapshot,
    path_slug: c.path_id ? slugById.get(c.path_id) : undefined,
    issued_at: c.issued_at,
  }));
}

// ── الشهادة ──────────────────────────────────────────────────────────────

export async function fetchExistingCertificate(userId: string, pathId: string) {
  const { data } = await supabase
    .from("certificates")
    .select("certificate_code, issued_at")
    .eq("user_id", userId)
    .eq("path_id", pathId)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

/**
 * إصدار شهادة — يُستدعى فقط بعد التحقق من canIssueCertificate() في طبقة
 * الواجهة (المصدر الحقيقي للشرط هو محرك src/lib/learning-paths/engine.ts،
 * لا هذه الدالة). RLS على جدول certificates تسمح للمستخدم بإدراج شهادته
 * الخاصة فقط (auth.uid() = user_id)، وUNIQUE(user_id, path_id) يمنع إصدار
 * أكثر من شهادة لنفس المسار.
 */
export async function issueCertificate(
  userId: string,
  path: { id: string; title: string; level: string },
  totalSessionsCompleted: number,
): Promise<{ certificateCode: string } | null> {
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  const { data: authUser } = await supabase.auth.getUser();
  const holderName = profile?.full_name || authUser?.user?.email || "طالب علم";

  const code = `MJ-${path.id.slice(0, 8).toUpperCase()}-${userId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await supabase
    .from("certificates")
    .insert({
      user_id: userId,
      path_id: path.id,
      certificate_code: code,
      holder_name: holderName,
      path_title_snapshot: path.title,
      level: path.level,
      sessions_completed: totalSessionsCompleted,
    })
    .select("certificate_code")
    .single();

  if (error || !data) return null;
  return { certificateCode: data.certificate_code };
}

export async function verifyCertificate(code: string) {
  const { data } = await supabase
    .from("certificates")
    .select("certificate_code, holder_name, path_title_snapshot, level, sessions_completed, issued_at, status")
    .eq("certificate_code", code)
    .eq("status", "active")
    .maybeSingle();
  return data;
}
