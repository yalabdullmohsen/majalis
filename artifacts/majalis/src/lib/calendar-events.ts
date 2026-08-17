import { format } from "date-fns";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { resolveLessonDetailsHref } from "@/lib/unified-lesson-card";
import { dateKeyLocal, dedupeById } from "@/lib/calendar-dates";

export type CalendarEvent = {
  id: string;
  title: string;
  sheikh: string;
  mosque: string;
  time: string;
  day: string;
  date?: string;
  recurring?: boolean;
  description?: string;
  href: string;
};

const DAY_MAP: Record<string, number> = {
  الأحد: 0,
  الاثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

export function eventsFromLessons(lessons: KuwaitLessonRecord[]): CalendarEvent[] {
  const mapped = lessons.map((l) => ({
    id: l.id,
    title: l.title,
    sheikh: l.sheikhName,
    mosque: l.mosque,
    time: l.time,
    day: l.day,
    date: l.startDate || undefined,
    description: l.note,
    href: resolveLessonDetailsHref(l) || "/lessons",
    recurring: l.recurring !== false && !l.startDate,
  }));
  return dedupeById(mapped);
}

/** أحداث يوم محدّد — يتجاهل ما بلا تاريخ وليس متكرّراً. */
export function eventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  const weekday = date.getDay();
  const dateStr = dateKeyLocal(date);
  const matched = events.filter((e) => {
    if (!e.day && !e.date) return false;
    if (e.date && e.recurring === false) {
      return e.date === dateStr;
    }
    if (e.recurring !== false && e.day) {
      return DAY_MAP[e.day] === weekday;
    }
    return false;
  });
  return dedupeById(matched);
}

export function eventCountForDate(date: Date, events: CalendarEvent[]): number {
  return eventsForDate(date, events).length;
}

export { format, dateKeyLocal };
