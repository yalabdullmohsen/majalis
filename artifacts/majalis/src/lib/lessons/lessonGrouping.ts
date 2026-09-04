/**
 * تجميع الدورات متعددة المجالس — الجلسات المنفردة تبقى بطاقات مستقلة.
 * إن غاب courseId: تجميع بعنوان الدورة الأساسي + المكان عند تعدّد المشايخ.
 */
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { cleanLessonDisplayTitle } from "@/lib/kuwait-lessons";
import { formatSheikhName } from "@/lib/sheikh-name";
import {
  extractCourseBaseTitle,
  getLessonDeliveryMode,
  normalizeLessonPlace,
} from "./lessonNormalize";

export type LessonCourseGroup = {
  id: string;
  title: string;
  sheikhs: string[];
  sessionCount: number;
  sessions: KuwaitLessonRecord[];
  nearestNextOccurrenceMs: number;
  mosque: string;
  region: string;
  category: string;
  deliveryMode: ReturnType<typeof getLessonDeliveryMode>;
  hasWomenSection: boolean;
  statusLabel?: string;
};

export type LessonScheduleSingle = {
  kind: "lesson";
  lesson: KuwaitLessonRecord;
};

export type LessonScheduleCourse = {
  kind: "course";
  course: LessonCourseGroup;
};

export type LessonScheduleEntry = LessonScheduleSingle | LessonScheduleCourse;

function uniqueSheikhs(sessions: KuwaitLessonRecord[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sessions) {
    const name = formatSheikhName(s.sheikhName) || s.sheikhName;
    const key = name.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function buildCourseGroup(id: string, sessions: KuwaitLessonRecord[]): LessonCourseGroup {
  const sorted = [...sessions].sort((a, b) => a.nextOccurrenceMs - b.nextOccurrenceMs);
  const primary = sorted[0]!;
  const title =
    extractCourseBaseTitle(cleanLessonDisplayTitle(primary.title, primary.linkedLessons)) ||
    primary.title;
  const nearest = sorted.reduce((min, s) => Math.min(min, s.nextOccurrenceMs), sorted[0]!.nextOccurrenceMs);

  return {
    id,
    title,
    sheikhs: uniqueSheikhs(sorted),
    sessionCount: primary.sessionCount || sorted.length,
    sessions: sorted,
    nearestNextOccurrenceMs: nearest,
    mosque: primary.mosque,
    region: primary.region,
    category: primary.category,
    deliveryMode: getLessonDeliveryMode(primary),
    hasWomenSection: sorted.some((s) => s.womenAttendance === "متاح"),
  };
}

function titlePlaceKey(lesson: KuwaitLessonRecord): string {
  const title =
    extractCourseBaseTitle(cleanLessonDisplayTitle(lesson.title, lesson.linkedLessons)) ||
    lesson.title;
  const place = normalizeLessonPlace(lesson);
  return `${title}|${place}`;
}

/** تجميع الدورات متعددة المجالس — الجلسات المنفردة تبقى بطاقات مستقلة */
export function groupLessonsForSchedule(lessons: KuwaitLessonRecord[]): LessonScheduleEntry[] {
  const byCourseId = new Map<string, KuwaitLessonRecord[]>();
  const singles: KuwaitLessonRecord[] = [];

  for (const lesson of lessons) {
    if (lesson.courseId) {
      const list = byCourseId.get(lesson.courseId) || [];
      list.push(lesson);
      byCourseId.set(lesson.courseId, list);
    } else {
      singles.push(lesson);
    }
  }

  const entries: LessonScheduleEntry[] = [];

  for (const [courseId, sessions] of byCourseId) {
    if (sessions.length > 1 || (sessions[0]?.sessionCount && sessions[0].sessionCount > 1)) {
      entries.push({ kind: "course", course: buildCourseGroup(courseId, sessions) });
    } else {
      singles.push(...sessions);
    }
  }

  // بلا courseId: إن اشترك العنوان+المكان واختلف المشايخ → بطاقة دورة واحدة
  const byTitlePlace = new Map<string, KuwaitLessonRecord[]>();
  const leftover: KuwaitLessonRecord[] = [];
  for (const lesson of singles) {
    const key = titlePlaceKey(lesson);
    const list = byTitlePlace.get(key) || [];
    list.push(lesson);
    byTitlePlace.set(key, list);
  }
  for (const [key, sessions] of byTitlePlace) {
    const sheikhs = uniqueSheikhs(sessions);
    if (sessions.length > 1 && sheikhs.length > 1) {
      entries.push({ kind: "course", course: buildCourseGroup(`title:${key}`, sessions) });
    } else {
      leftover.push(...sessions);
    }
  }

  for (const lesson of leftover) {
    entries.push({ kind: "lesson", lesson });
  }

  return entries.sort((a, b) => {
    const aMs = a.kind === "course" ? a.course.nearestNextOccurrenceMs : a.lesson.nextOccurrenceMs;
    const bMs = b.kind === "course" ? b.course.nearestNextOccurrenceMs : b.lesson.nextOccurrenceMs;
    return aMs - bMs;
  });
}

/** دورات يجب تجميع مجالسها (للتدقيق) */
export function findCoursesNeedingGrouping(lessons: KuwaitLessonRecord[]): Array<{
  courseId: string;
  title: string;
  sessionIds: string[];
}> {
  const byCourse = new Map<string, KuwaitLessonRecord[]>();
  for (const l of lessons) {
    if (!l.courseId) continue;
    const list = byCourse.get(l.courseId) || [];
    list.push(l);
    byCourse.set(l.courseId, list);
  }
  const out: Array<{ courseId: string; title: string; sessionIds: string[] }> = [];
  for (const [courseId, sessions] of byCourse) {
    if (sessions.length > 1) {
      out.push({
        courseId,
        title: extractCourseBaseTitle(sessions[0]!.title),
        sessionIds: sessions.map((s) => s.id),
      });
    }
  }
  return out;
}
