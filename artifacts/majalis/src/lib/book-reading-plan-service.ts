/**
 * خطط القراءة الذكية — جدولة قراءة كتاب من صفحة 1 حتى النهاية بين تاريخين،
 * بأيام أسبوع محدَّدة، مع حساب التقدّم الفعلي مقابل المتوقَّع وإعادة التوزيع
 * عند التأخر. لا نخزّن نسبة الإنجاز كقيمة جاهزة — تُحسب دومًا من current_page
 * وprogress_log وقت الطلب (نفس مبدأ محرك المسارات العلمية).
 */
import { supabase } from "@/lib/supabase";

export type PlanStatus =
  | "draft" | "not_started" | "in_progress" | "ahead" | "behind"
  | "paused" | "completed" | "cancelled";

export type PaceLevel = "easy" | "medium" | "intensive";

export type DayCode = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

const DAY_CODES: DayCode[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
// getDay(): 0=Sunday..6=Saturday
function dayCodeOf(date: Date): DayCode {
  return DAY_CODES[date.getDay()];
}

export type ProgressEntry = { date: string; pages_read: number };

export type BookReadingPlan = {
  id: string;
  user_id: string;
  book_slug: string;
  book_title: string;
  total_pages: number;
  start_date: string;
  end_date: string;
  reading_days: DayCode[];
  daily_minutes: number;
  pace_level: PaceLevel;
  include_review_days: boolean;
  status: PlanStatus;
  current_page: number;
  progress_log: ProgressEntry[];
  paused_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanMetrics = {
  totalReadingDays: number;
  pagesPerReadingDay: number;
  elapsedReadingDays: number;
  expectedPage: number;
  actualPage: number;
  pagesAheadOrBehind: number; // موجب = متقدم، سالب = متأخر
  remainingPages: number;
  remainingReadingDays: number;
  catchUpPagesPerDay: number | null; // null إن لم تتبقَّ أيام قراءة فعلية
  daysUntilEnd: number;
  computedStatus: PlanStatus;
  completionPct: number;
};

/** يُحصي أيام reading_days الواقعة بين تاريخين (شامل الطرفين). */
function countReadingDaysBetween(start: Date, end: Date, readingDays: DayCode[]): number {
  if (end < start) return 0;
  const set = new Set(readingDays);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (set.has(dayCodeOf(cur))) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** يحسب كل مقاييس الخطة وقت الطلب — لا قيمة مخزَّنة مسبقًا. */
export function computePlanMetrics(plan: BookReadingPlan, today: Date = new Date()): PlanMetrics {
  const start = toDateOnly(new Date(plan.start_date));
  const end = toDateOnly(new Date(plan.end_date));
  const now = toDateOnly(today);

  const totalReadingDays = countReadingDaysBetween(start, end, plan.reading_days) || 1;
  const pagesPerReadingDay = plan.total_pages / totalReadingDays;

  const elapsedEnd = now < start ? new Date(start.getTime() - 86400000) : (now > end ? end : now);
  const elapsedReadingDays = now < start ? 0 : countReadingDaysBetween(start, elapsedEnd, plan.reading_days);

  const expectedPage = Math.min(plan.total_pages, Math.round(pagesPerReadingDay * elapsedReadingDays));
  const actualPage = Math.min(plan.total_pages, plan.current_page);
  const pagesAheadOrBehind = actualPage - expectedPage;

  const remainingPages = Math.max(0, plan.total_pages - actualPage);
  const remainingReadingDays = now > end ? 0 : countReadingDaysBetween(
    now < start ? start : new Date(now.getTime() + 86400000),
    end,
    plan.reading_days,
  );

  const catchUpPagesPerDay = remainingReadingDays > 0
    ? Math.ceil(remainingPages / remainingReadingDays)
    : (remainingPages > 0 ? null : 0);

  const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  const completionPct = plan.total_pages > 0
    ? Math.round((actualPage / plan.total_pages) * 100)
    : 0;

  let computedStatus: PlanStatus = plan.status;
  if (plan.status !== "paused" && plan.status !== "cancelled" && plan.status !== "draft") {
    if (actualPage >= plan.total_pages) computedStatus = "completed";
    else if (now < start) computedStatus = "not_started";
    else if (pagesAheadOrBehind > 0) computedStatus = "ahead";
    else if (pagesAheadOrBehind < 0) computedStatus = "behind";
    else computedStatus = "in_progress";
  }

  return {
    totalReadingDays,
    pagesPerReadingDay: Math.round(pagesPerReadingDay * 10) / 10,
    elapsedReadingDays,
    expectedPage,
    actualPage,
    pagesAheadOrBehind,
    remainingPages,
    remainingReadingDays,
    catchUpPagesPerDay,
    daysUntilEnd,
    computedStatus,
    completionPct,
  };
}

/** تقدير واقعية الخطة قبل إنشائها — يمنع خططًا مستحيلة دون تحذير صريح. */
export function estimatePlanFeasibility(params: {
  totalPages: number;
  startDate: string;
  endDate: string;
  readingDays: DayCode[];
  dailyMinutes: number;
  paceLevel: PaceLevel;
}): { feasible: boolean; pagesPerReadingDay: number; warning: string | null } {
  const start = toDateOnly(new Date(params.startDate));
  const end = toDateOnly(new Date(params.endDate));
  const totalReadingDays = countReadingDaysBetween(start, end, params.readingDays) || 1;
  const pagesPerReadingDay = params.totalPages / totalReadingDays;

  // معدّل قراءة تقريبي: صفحة كل ~2 دقيقة (مكثّف) إلى ~4 دقائق (ميسّر) للقارئ المتوسط.
  const minutesPerPage = params.paceLevel === "intensive" ? 2 : params.paceLevel === "medium" ? 3 : 4;
  const maxPagesPerDayByMinutes = params.dailyMinutes / minutesPerPage;

  if (pagesPerReadingDay > maxPagesPerDayByMinutes * 1.5) {
    return {
      feasible: false,
      pagesPerReadingDay: Math.round(pagesPerReadingDay * 10) / 10,
      warning: `هذه الخطة تحتاج نحو ${Math.round(pagesPerReadingDay)} صفحة في كل يوم قراءة، وهو أكثر بكثير مما يسمح به وقتك اليومي (${params.dailyMinutes} دقيقة) — فكّر بتمديد الفترة أو زيادة الوقت اليومي.`,
    };
  }
  if (pagesPerReadingDay > maxPagesPerDayByMinutes) {
    return {
      feasible: true,
      pagesPerReadingDay: Math.round(pagesPerReadingDay * 10) / 10,
      warning: `الخطة ممكنة لكنها مشدودة — نحو ${Math.round(pagesPerReadingDay)} صفحة/يوم مقابل وقتك المعتاد. توقَّع الحاجة لأيام تعويض.`,
    };
  }
  return { feasible: true, pagesPerReadingDay: Math.round(pagesPerReadingDay * 10) / 10, warning: null };
}

export async function fetchUserPlans(userId: string): Promise<BookReadingPlan[]> {
  const { data } = await supabase
    .from("book_reading_plans")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  return (data ?? []) as BookReadingPlan[];
}

export async function createPlan(userId: string, params: {
  bookSlug: string;
  bookTitle: string;
  totalPages: number;
  startDate: string;
  endDate: string;
  readingDays: DayCode[];
  dailyMinutes: number;
  paceLevel: PaceLevel;
  includeReviewDays: boolean;
}): Promise<BookReadingPlan> {
  const { data, error } = await supabase
    .from("book_reading_plans")
    .insert({
      user_id: userId,
      book_slug: params.bookSlug,
      book_title: params.bookTitle,
      total_pages: params.totalPages,
      start_date: params.startDate,
      end_date: params.endDate,
      reading_days: params.readingDays,
      daily_minutes: params.dailyMinutes,
      pace_level: params.paceLevel,
      include_review_days: params.includeReviewDays,
      status: "not_started",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as BookReadingPlan;
}

/** تسجيل صفحات مُنجَزة اليوم — يحدّث current_page وprogress_log والحالة. */
export async function logReadingProgress(planId: string, pagesReadToday: number, date = new Date().toISOString().slice(0, 10)): Promise<void> {
  const { data: plan } = await supabase.from("book_reading_plans").select("*").eq("id", planId).maybeSingle();
  if (!plan) return;
  const p = plan as BookReadingPlan;
  const log = [...(p.progress_log ?? []).filter((e) => e.date !== date), { date, pages_read: pagesReadToday }];
  const newCurrentPage = Math.min(p.total_pages, Math.max(p.current_page, pagesReadToday));
  const metrics = computePlanMetrics({ ...p, current_page: newCurrentPage, progress_log: log });

  await supabase
    .from("book_reading_plans")
    .update({
      current_page: newCurrentPage,
      progress_log: log,
      status: metrics.computedStatus,
    })
    .eq("id", planId);
}

export async function pausePlan(planId: string): Promise<void> {
  await supabase.from("book_reading_plans").update({ status: "paused", paused_at: new Date().toISOString() }).eq("id", planId);
}

export async function resumePlan(planId: string): Promise<void> {
  await supabase.from("book_reading_plans").update({ status: "in_progress", paused_at: null }).eq("id", planId);
}

export async function cancelPlan(planId: string): Promise<void> {
  await supabase.from("book_reading_plans").update({ status: "cancelled" }).eq("id", planId);
}

/** إعادة توزيع المتبقي: يمدّد end_date حتى يعود المعدّل اليومي لمستوى معقول. */
export async function rescheduleRemaining(planId: string, newEndDate: string): Promise<void> {
  await supabase.from("book_reading_plans").update({ end_date: newEndDate }).eq("id", planId);
}

/** تغيير أيام القراءة دون خسارة التقدّم الحالي (current_page وprogress_log يبقيان). */
export async function updateReadingDays(planId: string, readingDays: DayCode[]): Promise<void> {
  await supabase.from("book_reading_plans").update({ reading_days: readingDays }).eq("id", planId);
}
