/**
 * مصدر موحّد لشبكة تقويم الدروس — أم القرى عبر gregorianToHijri (Asia/Kuwait).
 * لا حساب هجري يدوي ولا إزاحة ثابتة.
 */
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { gregorianToHijri } from "@/lib/hijri-utils";

/** بداية الأسبوع: الأحد (0) — مطابق مصحف الدروس والعرض العربي المعتاد. */
export const CALENDAR_WEEK_START = 0 as const;

export const CALENDAR_WEEKDAY_LABELS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

export const MAX_EVENTS_PER_CELL = 3;

export function dateKeyLocal(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** ٧×٦ (أو أقل) — أيام الشبكة الشهرية بمحاذاة الأحد. */
export function buildMonthGrid(cursor: Date): Date[] {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: CALENDAR_WEEK_START });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: CALENDAR_WEEK_START });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

/** أسبوع واحد (٧ أيام) حول التاريخ المحدّد. */
export function buildWeekDays(selected: Date): Date[] {
  const weekStart = startOfWeek(selected, { weekStartsOn: CALENDAR_WEEK_START });
  return eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { weekStartsOn: CALENDAR_WEEK_START }),
  });
}

export function hijriDayLabel(date: Date): string {
  const h = gregorianToHijri(date);
  return h ? String(h.day) : "";
}

export function hijriMonthYearLabel(date: Date): string {
  const h = gregorianToHijri(date);
  if (!h) return "";
  return `${h.monthName} ${h.year} هـ`;
}

export function weekColumnIndex(date: Date): number {
  return date.getDay();
}

/** أول يوم في الشبكة يجب أن يطابق عمود بداية الأسبوع. */
export function monthGridAligns(grid: Date[], monthStart: Date): boolean {
  if (grid.length === 0) return false;
  return grid[0]!.getDay() === CALENDAR_WEEK_START || weekColumnIndex(monthStart) === weekColumnIndex(grid.find((d) => isSameDay(d, monthStart)) ?? monthStart);
}

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export { isSameDay, isSameMonth, format };
