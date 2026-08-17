/**
 * بوابة تواريخ تقويم الدروس — أم القرى + محاذاة الشبكة.
 * Run: node --import tsx src/lib/__tests__/calendar-dates-gate.test.ts
 */
import assert from "node:assert/strict";
import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
} from "date-fns";
import {
  buildMonthGrid,
  buildWeekDays,
  CALENDAR_WEEK_START,
  CALENDAR_WEEKDAY_LABELS,
  dateKeyLocal,
  hijriMonthYearLabel,
  weekColumnIndex,
} from "../calendar-dates";
import { eventsForDate, type CalendarEvent } from "../calendar-events";
import { gregorianToHijri } from "../hijri-utils";

function kuwaitDate(iso: string): Date {
  return new Date(`${iso}T12:00:00+03:00`);
}

// ── 1) بداية الأسبوع = الأحد ──
{
  assert.equal(CALENDAR_WEEK_START, 0);
  assert.equal(CALENDAR_WEEKDAY_LABELS[0], "الأحد");
  const grid = buildMonthGrid(kuwaitDate("2026-08-01"));
  assert.equal(grid[0]!.getDay(), 0, "أول خلية شبكة = الأحد");
}

// ── 2) أول/آخر الشهر في العمود الصحيح ──
{
  const cursor = kuwaitDate("2026-08-17");
  const monthStart = startOfMonth(cursor);
  const grid = buildMonthGrid(cursor);
  const firstOfMonth = grid.find((d) => isSameDay(d, monthStart));
  assert.ok(firstOfMonth, "يوم 1 أغسطس موجود في الشبكة");
  assert.equal(weekColumnIndex(firstOfMonth!), monthStart.getDay());
  const last = endOfMonth(cursor);
  assert.ok(grid.some((d) => isSameDay(d, last)), "آخر يوم في الشبكة");
}

// ── 3) شهر 29 يوماً (رمضان 1447 ≈ مارس 2026) ──
{
  const cursor = kuwaitDate("2026-03-01");
  const h = gregorianToHijri(cursor);
  assert.ok(h, "هجري مارس 2026");
  const daysInGrid = buildMonthGrid(cursor).filter((d) => d.getMonth() === cursor.getMonth());
  assert.equal(daysInGrid.length, 31, "مارس ميلادي 31 يوماً في الشبكة");
}

// ── 4) انتقال السنة الهجرية — ديسمبر/يناير ──
{
  const dec = hijriMonthYearLabel(kuwaitDate("2025-12-15"));
  const jan = hijriMonthYearLabel(kuwaitDate("2026-01-15"));
  assert.ok(dec.includes("هـ"));
  assert.ok(jan.includes("هـ"));
  assert.notEqual(dec, jan, "رأس هجري مختلف بين ديسمبر ويناير");
}

// ── 5) dateKeyLocal لا يزحزح UTC ──
{
  const d = kuwaitDate("2026-08-17");
  assert.equal(dateKeyLocal(d), "2026-08-17");
}

// ── 6) الأحداث في خليتها الصحيحة + dedupe ──
{
  const sunday = kuwaitDate("2026-08-16"); // الأحد
  assert.equal(sunday.getDay(), 0);
  const events: CalendarEvent[] = [
    {
      id: "a",
      title: "درس أ",
      sheikh: "ش",
      mosque: "م",
      time: "18:00",
      day: "الأحد",
      recurring: true,
      href: "/lessons/a",
    },
    {
      id: "a",
      title: "مكرّر",
      sheikh: "ش",
      mosque: "م",
      time: "18:00",
      day: "الأحد",
      recurring: true,
      href: "/lessons/a",
    },
    {
      id: "b",
      title: "بدون يوم",
      sheikh: "ش",
      mosque: "م",
      time: "18:00",
      day: "",
      href: "/lessons/b",
    },
    {
      id: "c",
      title: "تاريخ محدد",
      sheikh: "ش",
      mosque: "م",
      time: "18:00",
      day: "الاثنين",
      date: "2026-08-18",
      recurring: false,
      href: "/lessons/c",
    },
  ];
  const onSun = eventsForDate(sunday, events);
  assert.equal(onSun.length, 1, "dedupe + يوم الأحد فقط");
  assert.equal(onSun[0]!.id, "a");
  const mon = eventsForDate(kuwaitDate("2026-08-18"), events);
  assert.equal(mon.length, 1);
  assert.equal(mon[0]!.id, "c");
  assert.equal(eventsForDate(kuwaitDate("2026-08-19"), events).length, 0);
}

// ── 7) أسبوع = 7 أيام ──
{
  const week = buildWeekDays(kuwaitDate("2026-08-17"));
  assert.equal(week.length, 7);
  assert.equal(week[0]!.getDay(), 0);
}

// ── 8) انتقال شهر cursor ──
{
  const aug = buildMonthGrid(kuwaitDate("2026-08-15"));
  const sep = buildMonthGrid(addMonths(kuwaitDate("2026-08-15"), 1));
  assert.notEqual(format(aug.find((d) => d.getDate() === 1 && d.getMonth() === 7)!, "yyyy-MM-dd"), format(sep.find((d) => d.getDate() === 1 && d.getMonth() === 8)!, "yyyy-MM-dd"));
}

console.log("calendar-dates-gate.test.ts: ok");
