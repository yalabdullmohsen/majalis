#!/usr/bin/env node
/**
 * Regression tests for lesson time integrity.
 * Run: node scripts/test-lesson-time-integrity.mjs
 */
import {
  parseTimeToMinutes,
  formatLessonTimeDisplay,
  classifyPrayerRank,
  isPmMarker,
  isAmMarker,
  normalizeLessonTimeFields,
  auditLessonRow,
} from "../lib/lesson-time-core.mjs";

let passed = 0;
let failed = 0;

function ok(label) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function bad(label, detail) {
  failed += 1;
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
}

console.log("\nLesson time integrity tests\n");

// Root cause: Arabic م PM marker
{
  const mins = parseTimeToMinutes("6:00 م");
  if (mins === 18 * 60) ok("6:00 م → 18:00 (PM fix)");
  else bad("6:00 م → 18:00", `got ${mins}`);
}

{
  const mins = parseTimeToMinutes("7:20 م");
  if (mins === 19 * 60 + 20) ok("7:20 م → 19:20");
  else bad("7:20 م → 19:20", `got ${mins}`);
}

{
  const mins = parseTimeToMinutes("8:50 م");
  if (mins === 20 * 60 + 50) ok("8:50 م → 20:50");
  else bad("8:50 م → 20:50", `got ${mins}`);
}

{
  const mins = parseTimeToMinutes("10:00 صباحًا");
  if (mins === 10 * 60) ok("10:00 صباحًا → 10:00");
  else bad("10:00 صباحًا", `got ${mins}`);
}

{
  const mins = parseTimeToMinutes("6:00 مساءً إلى صلاة العشاء");
  if (mins === 18 * 60) ok("6:00 مساءً → 18:00");
  else bad("6:00 مساءً", `got ${mins}`);
}

{
  const mins = parseTimeToMinutes("بعد صلاة المغرب");
  if (mins != null && mins >= 18 * 60) ok("بعد صلاة المغرب → evening");
  else bad("بعد صلاة المغرب", `got ${mins}`);
}

// Display formatting — no English PM
{
  const display = formatLessonTimeDisplay("6:00 م");
  if (display.includes("مساء") && !display.includes("PM")) ok("display uses مساءً not PM");
  else bad("Arabic display", display);
}

{
  const display = formatLessonTimeDisplay("7:30 م");
  if (/^[٠-٩]/.test(display) || display.includes("٧")) ok("Arabic numerals in display");
  else bad("Arabic numerals", display);
}

// isPmMarker / isAmMarker
{
  if (isPmMarker("6:00 م") && !isAmMarker("6:00 م")) ok("isPmMarker detects م");
  else bad("isPmMarker");
}

{
  if (isAmMarker("10:00 صباحًا") && !isPmMarker("10:00 صباحًا")) ok("isAmMarker detects صباح");
  else bad("isAmMarker");
}

// Prayer classification
{
  const rank = classifyPrayerRank("بعد صلاة المغرب");
  if (rank === "بعد المغرب") ok("prayer rank from text: بعد المغرب");
  else bad("prayer rank text", rank);
}

{
  const rank = classifyPrayerRank("6:00 م", 18 * 60);
  if (rank === "بعد المغرب" || rank === "قبل المغرب" || rank === "بعد العشاء") ok("prayer rank from evening time");
  else bad("prayer rank evening", rank);
}

{
  const rank = classifyPrayerRank("بعد صلاة الفجر");
  if (rank === "بعد الفجر") ok("prayer rank: بعد الفجر");
  else bad("prayer rank fajr", rank);
}

// Normalization on import
{
  const norm = normalizeLessonTimeFields({ lesson_time: "6:00 م" });
  if (norm.start_time === "18:00") ok("normalize sets start_time 18:00");
  else bad("normalize start_time", norm.start_time);
}

{
  const audit = auditLessonRow({ title: "test", lesson_time: "6:00 م", day_of_week: "الاثنين" });
  if (audit.normalized.start_time === "18:00" && audit.issues.includes("shorthand_am_pm")) {
    ok("audit normalizes PM shorthand");
  } else bad("audit PM shorthand", JSON.stringify(audit.issues));
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
