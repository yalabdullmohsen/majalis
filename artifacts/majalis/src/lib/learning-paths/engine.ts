/**
 * محرك الجلسات والتقدم — منطق نقي مُختبَر بمعزل تام.
 *
 * المبدأ الحاكم: لا نخزّن نسبة تقدم كقيمة جاهزة أبدًا — نخزّن أحداث الإنجاز
 * الفعلية (CompletionEvent[]) ونحسب كل شيء (الحالة، النسبة، الاجتياز) من هذه
 * الأحداث وقت الطلب. الجلسات (لا الساعات) هي عملة عرض الجهد المطلوب.
 */
import type {
  CompletionEvent,
  Course,
  CourseAssessmentResult,
  ItemState,
  LearningItem,
  Prerequisite,
  ScheduledSession,
  StudyPace,
} from "./types";

// ── حالة العنصر من أحداثه ────────────────────────────────────────────────

/** يُرتِّب الأحداث زمنيًا ويحسب الحالة الحالية للعنصر. */
export function resolveItemState(events: CompletionEvent[]): ItemState {
  const sorted = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  if (sorted.length === 0) return { status: "not_started", latestEvidenceValue: null, completedAt: null };

  let status: ItemState["status"] = "not_started";
  let latestEvidenceValue: number | null = null;
  let completedAt: string | null = null;

  for (const e of sorted) {
    if (e.evidenceValue !== null) latestEvidenceValue = e.evidenceValue;
    if (e.eventType === "started" || e.eventType === "progress_update") {
      if (status === "not_started") status = "in_progress";
    } else if (e.eventType === "completed") {
      status = "completed";
      completedAt = e.occurredAt;
    } else if (e.eventType === "reopened") {
      status = "in_progress";
      completedAt = null;
    }
  }
  return { status, latestEvidenceValue, completedAt };
}

/** هل العنصر مُنجَز فعليًا وفق آلية احتسابه الخاصة (لا بمجرد فتح الصفحة)؟ */
export function isItemComplete(item: LearningItem, events: CompletionEvent[]): boolean {
  const state = resolveItemState(events.filter((e) => e.learningItemId === item.id));

  switch (item.completionMethod) {
    case "manual_confirm":
    case "activity_submit":
    case "assessment_pass":
      return state.status === "completed";
    case "watch_percent":
    case "read_scroll": {
      const threshold = item.completionThreshold ?? 80;
      return (state.latestEvidenceValue ?? 0) >= threshold || state.status === "completed";
    }
    default:
      return false;
  }
}

// ── الجلسات ──────────────────────────────────────────────────────────────

/** إجمالي الجلسات التقديرية لمجموعة عناصر (المقرر/المرحلة/المسار). */
export function computeTotalSessions(items: LearningItem[], requiredOnly = false): number {
  const scoped = requiredOnly ? items.filter((i) => i.isRequired) : items;
  return scoped.reduce((sum, i) => sum + i.sessionEstimate, 0);
}

/** الجلسات المتبقية (غير المُنجَزة) من عناصر إلزامية. */
export function computeRemainingSessions(items: LearningItem[], events: CompletionEvent[]): number {
  return items
    .filter((i) => i.isRequired && !isItemComplete(i, events))
    .reduce((sum, i) => sum + i.sessionEstimate, 0);
}

/** مدى زمني صادق بالأسابيع بدل رقم وهمي واحد — مبني على وتيرة المستخدم. */
export function estimateWeeksRange(totalSessions: number, weeklySessions: number): { minWeeks: number; maxWeeks: number } {
  if (weeklySessions <= 0 || totalSessions <= 0) return { minWeeks: 0, maxWeeks: 0 };
  const exact = totalSessions / weeklySessions;
  const minWeeks = Math.max(1, Math.floor(exact * 0.85));
  const maxWeeks = Math.max(minWeeks, Math.ceil(exact * 1.15));
  return { minWeeks, maxWeeks };
}

// ── التقدّم بالأوزان ──────────────────────────────────────────────────────

/**
 * تقدّم المقرر = مجموع أوزان العناصر الإلزامية المُنجَزة ÷ مجموع أوزان كل
 * العناصر الإلزامية. عناصر بلا وزن إلزامي فيها = تقدّم صفر إن لم توجد عناصر.
 */
export function computeCourseProgress(items: LearningItem[], events: CompletionEvent[]): number {
  const required = items.filter((i) => i.isRequired);
  const totalWeight = required.reduce((s, i) => s + i.weight, 0);
  if (totalWeight <= 0) return 0;
  const doneWeight = required.filter((i) => isItemComplete(i, events)).reduce((s, i) => s + i.weight, 0);
  return Math.round((doneWeight / totalWeight) * 10000) / 100; // نسبة مئوية بدقة منزلتين
}

/**
 * المقرر لا يكتمل أبدًا برسوب أو غياب اختباره الإلزامي، حتى لو بلغ عرض
 * المحتوى 100% — بوابة الاجتياز صريحة ومنفصلة عن نسبة عرض المحتوى.
 */
export function isCourseComplete(
  items: LearningItem[],
  events: CompletionEvent[],
  requiredAssessmentResult: CourseAssessmentResult,
): boolean {
  const required = items.filter((i) => i.isRequired && i.itemType !== "assessment");
  const contentDone = required.every((i) => isItemComplete(i, events));
  if (!contentDone) return false;

  const hasRequiredAssessment = items.some((i) => i.isRequired && i.itemType === "assessment");
  if (!hasRequiredAssessment) return true;
  return requiredAssessmentResult?.passed === true;
}

// ── القفل والمتطلبات السابقة ──────────────────────────────────────────────

export function isCourseUnlocked(
  courseId: string,
  prerequisites: Prerequisite[],
  completedCourseIds: Set<string>,
): boolean {
  const requires = prerequisites.filter((p) => p.courseId === courseId).map((p) => p.requiresCourseId);
  return requires.every((reqId) => completedCourseIds.has(reqId));
}

/** يكشف الدورات في رسم بياني للمتطلبات (طبقة تطبيق موازية لمشغّل قاعدة البيانات). */
export function hasCircularPrerequisite(prerequisites: Prerequisite[]): boolean {
  const graph = new Map<string, string[]>();
  for (const p of prerequisites) {
    if (!graph.has(p.courseId)) graph.set(p.courseId, []);
    graph.get(p.courseId)!.push(p.requiresCourseId);
  }
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();

  function dfs(node: string): boolean {
    color.set(node, GRAY);
    for (const next of graph.get(node) ?? []) {
      const c = color.get(next) ?? WHITE;
      if (c === GRAY) return true;
      if (c === WHITE && dfs(next)) return true;
    }
    color.set(node, BLACK);
    return false;
  }

  for (const node of graph.keys()) {
    if ((color.get(node) ?? WHITE) === WHITE && dfs(node)) return true;
  }
  return false;
}

// ── خطتي الدراسية ────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** يوزّع العناصر الإلزامية غير المُنجَزة على أيام المستخدم المفضّلة ابتداءً من startDate. */
export function buildSchedule(
  items: LearningItem[],
  events: CompletionEvent[],
  pace: StudyPace,
  startDate: string,
): ScheduledSession[] {
  const remaining = items.filter((i) => i.isRequired && !isItemComplete(i, events));
  if (remaining.length === 0) return [];

  const days = pace.preferredDays.length > 0 ? [...pace.preferredDays].sort() : [0, 1, 2, 3, 4, 5, 6];
  const sessionsPerItemSlot = 1; // مبسّط: عنصر واحد لكل "فتحة" يوم؛ التوزيع الدقيق بالجلسات الكسرية طبقة عرض لاحقة
  const schedule: ScheduledSession[] = [];

  let cursor = new Date(`${startDate}T00:00:00Z`);
  let itemIdx = 0;
  let safety = 0;
  const maxDays = 730; // حارس أمان يمنع حلقة لا نهائية

  while (itemIdx < remaining.length && safety < maxDays) {
    const dow = cursor.getUTCDay();
    if (days.includes(dow)) {
      const item = remaining[itemIdx];
      schedule.push({ learningItemId: item.id, scheduledDate: toDateOnly(cursor) });
      itemIdx += sessionsPerItemSlot;
    }
    cursor = new Date(cursor.getTime() + DAY_MS);
    safety += 1;
  }
  return schedule;
}

/** إعادة جدولة: نفس المنطق لكن من "اليوم" فصاعدًا للعناصر المتبقية فقط — بضغطة واحدة. */
export function rescheduleFromToday(
  items: LearningItem[],
  events: CompletionEvent[],
  pace: StudyPace,
  today: string,
): ScheduledSession[] {
  return buildSchedule(items, events, pace, today);
}

// ── الشهادة ──────────────────────────────────────────────────────────────

export function canIssueCertificate(
  courses: Course[],
  courseCompletionMap: Map<string, boolean>,
  pathAssessmentResult: CourseAssessmentResult,
  requiresPathAssessment: boolean,
): boolean {
  const allCoursesComplete = courses.every((c) => courseCompletionMap.get(c.id) === true);
  if (!allCoursesComplete) return false;
  if (!requiresPathAssessment) return true;
  return pathAssessmentResult?.passed === true;
}

export function generateCertificateCode(pathSlug: string, userIdShort: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase();
  return `MJ-${pathSlug.slice(0, 10).toUpperCase()}-${userIdShort.slice(0, 6).toUpperCase()}-${stamp}${rand}`;
}
