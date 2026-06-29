import { supabase } from "@/lib/supabase";
import { fetchUserLearningStats, fetchUserCertificates } from "@/lib/digital-learning-service";
import type {
  AcademicProfileStats,
  ContentNote,
  LearningPlan,
  LibraryContentType,
  LibraryFolder,
  LibraryItem,
} from "./types";
import { DEFAULT_FOLDERS } from "./types";

async function requireUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function audit(userId: string, action: string, entityType: string, entityId?: string, snapshot: Record<string, unknown> = {}) {
  try {
    await supabase.from("user_learning_audit").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      snapshot,
    });
  } catch {
    /* audit optional until migration applied */
  }
}

export async function logUserActivity(
  activityType: string,
  contentType?: string,
  contentId?: string,
  metadata: Record<string, unknown> = {},
) {
  const userId = await requireUserId();
  if (!userId) return;
  try {
    await supabase.from("user_activity_log").insert({
      user_id: userId,
      activity_type: activityType,
      content_type: contentType ?? null,
      content_id: contentId ?? null,
      metadata,
    });
    await updateStreak(userId);
  } catch {
    /* tables may not exist yet */
  }
}

async function updateStreak(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: row } = await supabase.from("user_streaks").select("*").eq("user_id", userId).maybeSingle();
  if (!row) {
    await supabase.from("user_streaks").upsert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    });
    return;
  }
  const last = row.last_active_date as string | null;
  if (last === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  const next = last === yStr ? (row.current_streak || 0) + 1 : 1;
  await supabase.from("user_streaks").update({
    current_streak: next,
    longest_streak: Math.max(next, row.longest_streak || 0),
    last_active_date: today,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
}

export async function ensureDefaultFolders(userId: string): Promise<LibraryFolder[]> {
  const { data: existing } = await supabase
    .from("user_library_folders")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");

  if (existing?.length) return existing as LibraryFolder[];

  const rows = DEFAULT_FOLDERS.map((f, i) => ({
    user_id: userId,
    name: f.name,
    slug: f.slug,
    icon: f.icon,
    sort_order: i,
    is_system: true,
  }));

  const { data } = await supabase.from("user_library_folders").insert(rows).select("*");
  return (data || []) as LibraryFolder[];
}

export async function fetchLibraryFolders(): Promise<LibraryFolder[]> {
  const userId = await requireUserId();
  if (!userId) return [];
  try {
    return await ensureDefaultFolders(userId);
  } catch {
    return [];
  }
}

export async function createLibraryFolder(name: string): Promise<LibraryFolder | null> {
  const userId = await requireUserId();
  if (!userId || !name.trim()) return null;
  const slug = name.trim().replace(/\s+/g, "-").slice(0, 40) + "-" + Date.now().toString(36);
  const { data } = await supabase
    .from("user_library_folders")
    .insert({ user_id: userId, name: name.trim(), slug, sort_order: 99, is_system: false })
    .select("*")
    .single();
  if (data) await audit(userId, "create", "folder", data.id, { name });
  return data as LibraryFolder | null;
}

export async function fetchLibraryItems(folderId?: string | null): Promise<LibraryItem[]> {
  const userId = await requireUserId();
  if (!userId) return [];
  let q = supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (folderId) q = q.eq("folder_id", folderId);
  const { data } = await q;
  return (data || []) as LibraryItem[];
}

export async function saveToLibrary(item: {
  content_type: LibraryContentType | string;
  content_id: string;
  title?: string;
  content_url?: string;
  folder_id?: string | null;
  note?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const userId = await requireUserId();
  if (!userId) return false;

  const folders = await ensureDefaultFolders(userId);
  const favFolder = folders.find((f) => f.slug === "favorites");

  const payload = {
    user_id: userId,
    content_type: item.content_type,
    content_id: String(item.content_id),
    title: item.title ?? null,
    content_url: item.content_url ?? null,
    folder_id: item.folder_id ?? favFolder?.id ?? null,
    note: item.note ?? null,
    metadata: item.metadata ?? {},
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("bookmarks").upsert(payload, {
    onConflict: "user_id,content_type,content_id",
  });

  if (!error) {
    await audit(userId, "save", "library_item", item.content_id, { type: item.content_type });
    await logUserActivity("library_save", item.content_type, item.content_id);
  }
  return !error;
}

export async function removeFromLibrary(contentType: string, contentId: string): Promise<boolean> {
  const userId = await requireUserId();
  if (!userId) return false;
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .match({ user_id: userId, content_type: contentType, content_id: String(contentId) });
  if (!error) await audit(userId, "delete", "library_item", contentId, { type: contentType });
  return !error;
}

export async function moveLibraryItem(bookmarkId: string, folderId: string | null): Promise<boolean> {
  const userId = await requireUserId();
  if (!userId) return false;
  const { error } = await supabase
    .from("bookmarks")
    .update({ folder_id: folderId, updated_at: new Date().toISOString() })
    .eq("id", bookmarkId)
    .eq("user_id", userId);
  return !error;
}

export async function isInLibrary(contentType: string, contentId: string): Promise<boolean> {
  const userId = await requireUserId();
  if (!userId) return false;
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("content_type", contentType)
    .eq("content_id", String(contentId))
    .maybeSingle();
  return Boolean(data);
}

export async function searchLibrary(query: string, items?: LibraryItem[]): Promise<LibraryItem[]> {
  const list = items ?? (await fetchLibraryItems());
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((it) =>
    [it.title, it.note, it.content_type, it.content_id, JSON.stringify(it.metadata || "")]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

export async function fetchContentNote(contentType: string, contentId: string): Promise<ContentNote | null> {
  const userId = await requireUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from("user_content_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("content_type", contentType)
    .eq("content_id", String(contentId))
    .maybeSingle();
  return data as ContentNote | null;
}

export async function fetchAllNotes(search?: string): Promise<ContentNote[]> {
  const userId = await requireUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("user_content_notes")
    .select("*")
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  const notes = (data || []) as ContentNote[];
  if (!search?.trim()) return notes;
  const q = search.trim().toLowerCase();
  return notes.filter((n) =>
    [n.title, n.body, ...(n.tags || []), ...(n.highlights || [])].join(" ").toLowerCase().includes(q),
  );
}

export async function saveContentNote(note: {
  content_type: string;
  content_id: string;
  title?: string;
  body: string;
  highlights?: string[];
  tags?: string[];
  is_pinned?: boolean;
}): Promise<ContentNote | null> {
  const userId = await requireUserId();
  if (!userId) return null;

  const existing = await fetchContentNote(note.content_type, note.content_id);
  const payload = {
    user_id: userId,
    content_type: note.content_type,
    content_id: String(note.content_id),
    title: note.title ?? null,
    body: note.body,
    highlights: note.highlights ?? [],
    tags: note.tags ?? [],
    is_pinned: note.is_pinned ?? false,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing?.id) {
    const { data } = await supabase.from("user_content_notes").update(payload).eq("id", existing.id).select("*").single();
    result = data;
  } else {
    const { data } = await supabase.from("user_content_notes").insert(payload).select("*").single();
    result = data;
  }

  if (result) {
    await audit(userId, existing ? "update" : "create", "note", result.id);
    await logUserActivity("note_save", note.content_type, note.content_id);
  }
  return result as ContentNote | null;
}

export async function deleteContentNote(noteId: string): Promise<boolean> {
  const userId = await requireUserId();
  if (!userId) return false;
  const { error } = await supabase.from("user_content_notes").delete().eq("id", noteId).eq("user_id", userId);
  return !error;
}

export async function fetchLearningPlan(): Promise<LearningPlan | null> {
  const userId = await requireUserId();
  if (!userId) return null;
  const { data } = await supabase.from("user_learning_plans").select("*").eq("user_id", userId).maybeSingle();
  return data as LearningPlan | null;
}

export async function saveLearningPlan(plan: Partial<LearningPlan> & { onboarding_done?: boolean }): Promise<LearningPlan | null> {
  const userId = await requireUserId();
  if (!userId) return null;

  const existing = await fetchLearningPlan();
  const payload = {
    user_id: userId,
    level: plan.level ?? existing?.level ?? "beginner",
    interests: plan.interests ?? existing?.interests ?? [],
    daily_minutes: plan.daily_minutes ?? existing?.daily_minutes ?? 30,
    goal: plan.goal ?? existing?.goal ?? "study",
    plan_data: plan.plan_data ?? existing?.plan_data ?? {},
    weekly_goals: plan.weekly_goals ?? existing?.weekly_goals ?? [],
    monthly_goals: plan.monthly_goals ?? existing?.monthly_goals ?? [],
    progress: plan.progress ?? existing?.progress ?? {},
    reminders_enabled: plan.reminders_enabled ?? existing?.reminders_enabled ?? true,
    onboarding_done: plan.onboarding_done ?? existing?.onboarding_done ?? false,
    updated_at: new Date().toISOString(),
  };

  const { data } = await supabase
    .from("user_learning_plans")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (data) {
    await audit(userId, "upsert", "learning_plan", data.id);
    await logUserActivity("plan_update");
  }
  return data as LearningPlan | null;
}

export function buildAutoPlan(input: {
  level: string;
  interests: string[];
  daily_minutes: number;
  goal: string;
}) {
  const weekly = [
    { id: "w1", label: "إكمال 2 درس", type: "lesson", target: 2, done: 0 },
    { id: "w2", label: "قراءة فصل من كتاب", type: "book", target: 1, done: 0 },
    { id: "w3", label: "10 أسئلة مراجعة", type: "qa", target: 10, done: 0 },
  ];
  const monthly = [
    { id: "m1", label: "إنهاء متن واحد", type: "mutoon", target: 1, done: 0 },
    { id: "m2", label: "قراءة بحث علمي", type: "research", target: 1, done: 0 },
  ];
  const items = [
    ...input.interests.slice(0, 3).map((subject, i) => ({
      id: `lesson-${i}`,
      type: "lesson",
      title: `درس في ${subject}`,
      subject,
      url: `/lessons?search=${encodeURIComponent(subject)}`,
    })),
    { id: "book-1", type: "book", title: "كتاب من المكتبة", url: "/library" },
    { id: "qa-1", type: "qa", title: "مراجعة سؤال وجواب", url: "/question-answer" },
    { id: "research-1", type: "research", title: "بحث علمي", url: "/research" },
  ];
  return {
    plan_data: { items, generated_at: new Date().toISOString(), input },
    weekly_goals: weekly,
    monthly_goals: monthly,
  };
}

export async function submitContentReport(report: {
  content_type: string;
  content_id?: string;
  report_type: string;
  description?: string;
  page_url?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("error_reports").insert({
    user_id: user?.id ?? null,
    content_type: report.content_type,
    content_id: report.content_id ? String(report.content_id) : null,
    report_type: report.report_type,
    description: report.description ?? "",
    page_url: report.page_url ?? (typeof window !== "undefined" ? window.location.href : null),
    metadata: report.metadata ?? {},
    status: "pending",
  });
  if (!error && user?.id) await audit(user.id, "submit", "report", report.content_id, { type: report.report_type });
  return !error;
}

export async function fetchAcademicProfile(): Promise<AcademicProfileStats | null> {
  const userId = await requireUserId();
  if (!userId) return null;

  const [library, notes, streakRow, profileRow, dlStats, certs] = await Promise.all([
    fetchLibraryItems(),
    fetchAllNotes(),
    supabase.from("user_streaks").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("points, level, full_name").eq("id", userId).maybeSingle(),
    fetchUserLearningStats().catch(() => null),
    fetchUserCertificates().catch(() => []),
  ]);

  const byType = (t: string) => library.filter((i) => i.content_type === t).length;
  const lastActivity = library[0]?.updated_at || library[0]?.created_at;

  const subjectCounts: Record<string, number> = {};
  for (const item of library) {
    const sub = (item.metadata?.subject as string) || item.content_type;
    subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
  }
  const top_subjects = Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const scholarCounts: Record<string, number> = {};
  for (const item of library) {
    const s = item.metadata?.sheikh as string;
    if (s) scholarCounts[s] = (scholarCounts[s] || 0) + 1;
  }
  const top_scholars = Object.entries(scholarCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    completed_lessons: dlStats?.completed_lessons ?? byType("lesson"),
    study_hours: Math.round(((dlStats?.completed_lessons ?? byType("lesson")) * 0.75 + library.length * 0.25) * 10) / 10,
    books_read: dlStats?.books_read ?? byType("book"),
    mutoon_studied: byType("mutoon"),
    research_read: byType("research"),
    questions_answered: dlStats?.quiz_attempts ?? 0,
    qa_success_rate: dlStats?.completion_pct ?? 0,
    last_activity: lastActivity,
    top_subjects,
    top_scholars,
    achievements: dlStats?.achievements ?? [],
    certificates: certs.map((c) => ({ code: c.certificate_code, title: c.title, issued_at: c.issued_at })),
    current_streak: streakRow.data?.current_streak ?? 0,
    longest_streak: streakRow.data?.longest_streak ?? 0,
    scientific_level: profileRow.data?.level ?? 1,
    library_total: library.length,
    notes_total: notes.length,
  };
}

/** Admin aggregate stats */
export async function adminPersonalLearningStats() {
  const [folders, bookmarks, notes, plans, reports, activity] = await Promise.all([
    supabase.from("user_library_folders").select("*", { count: "exact", head: true }),
    supabase.from("bookmarks").select("*", { count: "exact", head: true }),
    supabase.from("user_content_notes").select("*", { count: "exact", head: true }),
    supabase.from("user_learning_plans").select("*", { count: "exact", head: true }),
    supabase.from("error_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("user_activity_log").select("*", { count: "exact", head: true }),
  ]);

  const { data: topSaved } = await supabase
    .from("bookmarks")
    .select("content_type")
    .limit(500);

  const typeCounts: Record<string, number> = {};
  for (const row of topSaved || []) {
    typeCounts[row.content_type] = (typeCounts[row.content_type] || 0) + 1;
  }

  return {
    folders: folders.count ?? 0,
    bookmarks: bookmarks.count ?? 0,
    notes: notes.count ?? 0,
    plans: plans.count ?? 0,
    pending_reports: reports.count ?? 0,
    activity_events: activity.count ?? 0,
    top_saved_types: Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([type, count]) => ({ type, count })),
  };
}

export async function adminGetContentReports(limit = 50) {
  return supabase
    .from("error_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
}

export async function adminUpdateReportStatus(id: string, status: "pending" | "reviewed" | "resolved") {
  return supabase.from("error_reports").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
}
