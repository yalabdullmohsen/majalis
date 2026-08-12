#!/usr/bin/env node
// Quick smoke-test for parseTimeToMinutes & formatRelativeTime
// Run: node scripts/verify-lesson-time.mjs

import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── helpers ──────────────────────────────────────────────────────────────────

function cleanTimeText(time) {
  return String(time || "")
    .replace(/\s*بتوقيت\s+الكويت\s*/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PRAYER_ROOTS = [
  [/فجر/u,  5 * 60],
  [/شروق/u, 6 * 60 + 30],
  [/ظهر/u,  12 * 60 + 15],
  [/عصر/u,  15 * 60 + 45],
  [/مغرب/u, 18 * 60 + 30],
  [/عشاء/u, 20 * 60],
];

function parseTimeToMinutes(timeRaw) {
  const time = cleanTimeText(timeRaw);
  if (!time) return null;

  const explicit = time.match(/(\d{1,2})\s*[:٫]\s*(\d{2})/u);
  if (explicit) {
    let hour = Number(explicit[1]);
    const minute = Number(explicit[2]);
    const tail = time.slice((explicit.index ?? 0) + explicit[0].length).trimStart();
    const isPM =
      /^م(?![؀-ۿ])/u.test(tail) ||
      /^مساء/u.test(tail) ||
      /مساء/u.test(time) ||
      /pm/i.test(time);
    const isAM =
      /^ص(?![؀-ۿ])/u.test(tail) ||
      /^صباح/u.test(tail) ||
      /صباح/u.test(time) ||
      /am/i.test(time);
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  const hourOnly = time.match(/(\d{1,2})\s*(م(?:ساء[ًا]?)?|ص(?:باح[ًا]?)?)/u);
  if (hourOnly) {
    let hour = Number(hourOnly[1]);
    if (/^م/u.test(hourOnly[2]) && hour < 12) hour += 12;
    if (/^ص/u.test(hourOnly[2]) && hour === 12) hour = 0;
    return hour * 60;
  }

  for (const [root, minutes] of PRAYER_ROOTS) {
    if (root.test(time)) {
      if (/بعد/u.test(time)) return minutes + 20;
      if (/قبل/u.test(time)) return Math.max(0, minutes - 60);
      return minutes;
    }
  }
  return null;
}

function formatRelativeTime(targetMs, now = Date.now()) {
  const diffMs = targetMs - now;
  if (diffMs <= 0) return "جارٍ الآن";

  const totalMinutes = Math.floor(diffMs / 60_000);
  if (totalMinutes <= 1) return "جارٍ الآن";
  if (totalMinutes === 2) return "بعد دقيقتين";
  if (totalMinutes < 60) {
    if (totalMinutes <= 10) return `بعد ${totalMinutes} دقائق`;
    return `بعد ${totalMinutes} دقيقة`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMin = totalMinutes % 60;
  if (hours < 24) {
    const base =
      hours === 1 ? "ساعة" :
      hours === 2 ? "ساعتين" :
      `${hours} ساعات`;
    if (remainingMin === 0) return `بعد ${base}`;
    const minLabel =
      remainingMin === 1 ? "دقيقة" :
      remainingMin === 2 ? "دقيقتين" :
      remainingMin <= 10 ? `${remainingMin} دقائق` :
      `${remainingMin} دقيقة`;
    return `بعد ${base} و${minLabel}`;
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  if (days === 1) return "غداً";
  if (days === 2) return "بعد يومين";
  if (days <= 6) return `بعد ${days} أيام`;
  if (days <= 13) return "الأسبوع القادم";
  if (days <= 20) return "بعد أسبوعين";

  const months = Math.floor(days / 30);
  if (months >= 1) return months === 1 ? "بعد شهر" : `بعد ${months} أشهر`;
  return `بعد ${days} أيام`;
}

// ── tests ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`      expected: ${expected}`);
    console.error(`      actual:   ${actual}`);
    failed++;
  }
}

console.log("\n=== parseTimeToMinutes ===\n");

// Core AM/PM requirements
assert("4:30م  → 16:30 (990 min)", parseTimeToMinutes("4:30م"), 990);
assert("8:30م  → 20:30 (1230 min)", parseTimeToMinutes("8:30م"), 1230);
assert("4:30ص  → 04:30 (270 min)", parseTimeToMinutes("4:30ص"), 270);
assert("12:00م → 12:00 (noon, 720 min)", parseTimeToMinutes("12:00م"), 720);
assert("12:00ص → 00:00 (midnight, 0 min)", parseTimeToMinutes("12:00ص"), 0);

// With spaces
assert("4:30 م → 990", parseTimeToMinutes("4:30 م"), 990);
assert("8:30 مساءً → 1230", parseTimeToMinutes("8:30 مساءً"), 1230);
assert("4:30 صباحاً → 270", parseTimeToMinutes("4:30 صباحاً"), 270);

// Explicit مساء/صباح anywhere
assert("الساعة 7 مساء → 1140", parseTimeToMinutes("الساعة 7:00 مساء"), 1140);

// Hour-only
assert("8م (hour only) → 1200", parseTimeToMinutes("8م"), 1200);
assert("8ص (hour only) → 480", parseTimeToMinutes("8ص"), 480);

// Prayer-relative
assert("بعد المغرب → 18:50 (1130)", parseTimeToMinutes("بعد المغرب"), 18 * 60 + 30 + 20);
assert("بعد العشاء → 20:20 (1220)", parseTimeToMinutes("بعد العشاء"), 20 * 60 + 20);
assert("بعد الفجر  → 5:20 (320)", parseTimeToMinutes("بعد الفجر"), 5 * 60 + 20);

console.log("\n=== formatRelativeTime ===\n");

const MIN = 60_000;
const HR  = 60 * MIN;
const now = Date.now();

assert("0 ms → جارٍ الآن", formatRelativeTime(now, now), "جارٍ الآن");
assert("-1 min → جارٍ الآن", formatRelativeTime(now - MIN, now), "جارٍ الآن");
assert("2 min → بعد دقيقتين", formatRelativeTime(now + 2 * MIN, now), "بعد دقيقتين");
assert("5 min → بعد 5 دقائق", formatRelativeTime(now + 5 * MIN, now), "بعد 5 دقائق");
assert("30 min → بعد 30 دقيقة", formatRelativeTime(now + 30 * MIN, now), "بعد 30 دقيقة");
assert("1 hr exact → بعد ساعة", formatRelativeTime(now + HR, now), "بعد ساعة");
assert("2 hr exact → بعد ساعتين", formatRelativeTime(now + 2 * HR, now), "بعد ساعتين");
assert("3 hr exact → بعد 3 ساعات", formatRelativeTime(now + 3 * HR, now), "بعد 3 ساعات");

// Combined hours + minutes (key fix)
assert("4 hr 37 min → بعد 4 ساعات و37 دقيقة",
  formatRelativeTime(now + (4 * 60 + 37) * MIN, now), "بعد 4 ساعات و37 دقيقة");
assert("1 hr 30 min → بعد ساعة و30 دقيقة",
  formatRelativeTime(now + (60 + 30) * MIN, now), "بعد ساعة و30 دقيقة");
assert("2 hr 2 min → بعد ساعتين ودقيقتين",
  formatRelativeTime(now + (120 + 2) * MIN, now), "بعد ساعتين ودقيقتين");

assert("1 day → غداً", formatRelativeTime(now + 24 * HR, now), "غداً");
assert("2 days → بعد يومين", formatRelativeTime(now + 2 * 24 * HR, now), "بعد يومين");
assert("5 days → بعد 5 أيام", formatRelativeTime(now + 5 * 24 * HR, now), "بعد 5 أيام");

console.log("\n=== Bug scenario: 11:53 ص + درس 4:30م ===\n");

// Simulate: current Kuwait time = 11:53 AM, lesson at 4:30 PM
// At 11:53 AM → 713 min, lesson at 990 min → diff = 277 min = 4 hr 37 min
const diff = (990 - 713) * MIN;
const label = formatRelativeTime(now + diff, now);
const isCorrect = label.includes("ساعات") || label.includes("ساعة");
assert("11:53 صباحًا + 4:30م → NOT 13 دقيقة (should contain ساعات)",
  isCorrect ? "YES" : `NO: ${label}`, "YES");
console.log(`  Label shown: "${label}"`);

// ── summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(40)}`);
console.log(`  ${passed} passed  |  ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) process.exit(1);
