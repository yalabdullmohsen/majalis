#!/usr/bin/env node
/**
 * Prayer Rank System — unit tests (mirrors src/lib/prayer-tracker/scoring.ts)
 */
import assert from "node:assert/strict";

const POINTS = { home: 10, congregation: 20, mosque: 30, firstTime: 15, fullDay: 50 };
const LEVEL_TARGET = 1000;
const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const RANKS = [
  { key: "beginner", score: 0 },
  { key: "regular", score: 35 },
  { key: "excellent", score: 55 },
  { key: "role_model", score: 75 },
  { key: "preceding", score: 90 },
];

function kuwaitDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(date);
}

function emptyDay(date) {
  return Object.fromEntries(
    PRAYER_KEYS.map((key) => [
      key,
      { prayerDate: date, prayerKey: key, status: "pending", place: "home", congregation: false, isFirstTime: false, notes: "", pointsEarned: 0 },
    ]),
  );
}

function computeSessionPoints(session) {
  if (session.status !== "done") return 0;
  let pts = POINTS.home;
  if (session.place === "mosque") pts = POINTS.mosque;
  else if (session.congregation) pts = POINTS.congregation;
  if (session.isFirstTime) pts += POINTS.firstTime;
  return pts;
}

function isFullDay(day) {
  return PRAYER_KEYS.every((k) => day[k]?.status === "done");
}

function computeLevel(totalPoints) {
  return {
    level: Math.floor(totalPoints / LEVEL_TARGET) + 1,
    pointsInLevel: totalPoints % LEVEL_TARGET,
    levelTarget: LEVEL_TARGET,
  };
}

function applySessionUpdate(store, date, key, patch) {
  const day = store[date] || emptyDay(date);
  const prev = day[key];
  const next = { ...prev, ...patch, prayerDate: date, prayerKey: key };
  next.pointsEarned = computeSessionPoints(next);
  return { ...store, [date]: { ...day, [key]: next } };
}

function dayDoneCount(day) {
  return PRAYER_KEYS.filter((k) => day[k]?.status === "done").length;
}

function aggregateStats(store) {
  let totalPrayers = 0;
  let totalMosque = 0;
  let fajrCount = 0;
  let totalPoints = 0;
  let fullDaysCount = 0;
  for (const day of Object.values(store)) {
    if (isFullDay(day)) fullDaysCount += 1;
    for (const key of PRAYER_KEYS) {
      const s = day[key];
      if (!s) continue;
      totalPoints += s.pointsEarned || computeSessionPoints(s);
      if (s.status === "done") {
        totalPrayers += 1;
        if (s.place === "mosque") totalMosque += 1;
        if (key === "fajr") fajrCount += 1;
      }
    }
  }
  totalPoints += fullDaysCount * POINTS.fullDay;
  return { totalPrayers, totalMosque, fajrCount, totalPoints, fullDaysCount, ...computeLevel(totalPoints) };
}

function addDays(dateKey, delta) {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return kuwaitDateKey(d);
}

function computeRankMetrics30(store) {
  const today = kuwaitDateKey();
  const from = addDays(today, -29);
  let prayersDone = 0;
  let mosqueCount = 0;
  let firstTimeCount = 0;
  let fullDays = 0;
  for (const [date, day] of Object.entries(store)) {
    if (date < from || date > today) continue;
    if (isFullDay(day)) fullDays += 1;
    for (const key of PRAYER_KEYS) {
      const s = day[key];
      if (s?.status !== "done") continue;
      prayersDone += 1;
      if (s.place === "mosque") mosqueCount += 1;
      if (s.isFirstTime) firstTimeCount += 1;
    }
  }
  const prayerScore = Math.min(40, (prayersDone / 150) * 40);
  const mosqueScore = Math.min(20, (mosqueCount / 60) * 20);
  const firstTimeScore = Math.min(15, (firstTimeCount / 60) * 15);
  const fullDayScore = Math.min(15, (fullDays / 30) * 15);
  const score = Math.round((prayerScore + mosqueScore + firstTimeScore + fullDayScore) * 10) / 10;
  return { prayersDone, mosqueCount, firstTimeCount, fullDays, score };
}

function resolveRank(metrics) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (metrics.score >= r.score) rank = r;
  }
  return rank;
}

function detectAchievements(store, earned) {
  const stats = aggregateStats(store);
  const newly = [];
  const check = (key, cond) => { if (cond && !earned.has(key)) newly.push(key); };
  check("first_prayer", stats.totalPrayers >= 1);
  check("prayers_100", stats.totalPrayers >= 100);
  return newly;
}

function buildCalendarMonth(store, year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  const days = [];
  for (let d = 1; d <= lastDay; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const day = store[date];
    const done = day ? dayDoneCount(day) : 0;
    let status = "empty";
    if (done === 5) status = "full";
    else if (done > 0) status = "partial";
    days.push({ date, status, done });
  }
  return days;
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

console.log("\nPrayer Rank System Tests\n");

test("computeSessionPoints — home base", () => {
  assert.equal(computeSessionPoints({ status: "done", place: "home", congregation: false, isFirstTime: false }), 10);
});

test("computeSessionPoints — mosque + first time", () => {
  assert.equal(computeSessionPoints({ status: "done", place: "mosque", congregation: false, isFirstTime: true }), 45);
});

test("computeSessionPoints — congregation", () => {
  assert.equal(computeSessionPoints({ status: "done", place: "home", congregation: true, isFirstTime: false }), 20);
});

test("computeLevel — 740 points", () => {
  const l = computeLevel(740);
  assert.equal(l.level, 1);
  assert.equal(l.pointsInLevel, 740);
});

test("applySessionUpdate — persists points", () => {
  const next = applySessionUpdate({}, "2026-06-26", "fajr", { status: "done", place: "mosque", isFirstTime: true });
  assert.equal(next["2026-06-26"].fajr.pointsEarned, 45);
});

test("aggregateStats — counts", () => {
  let store = applySessionUpdate({}, "2026-06-26", "fajr", { status: "done", place: "mosque", isFirstTime: true });
  store = applySessionUpdate(store, "2026-06-26", "dhuhr", { status: "done", place: "home", congregation: true });
  const stats = aggregateStats(store);
  assert.equal(stats.totalPrayers, 2);
  assert.equal(stats.fajrCount, 1);
});

test("resolveRank — beginner empty", () => {
  assert.equal(resolveRank(computeRankMetrics30({})).key, "beginner");
});

test("resolveRank — high performer", () => {
  let store = {};
  for (let i = 0; i < 25; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = kuwaitDateKey(d);
    for (const pk of PRAYER_KEYS) {
      store = applySessionUpdate(store, key, pk, { status: "done", place: "mosque", congregation: true, isFirstTime: true });
    }
  }
  const rank = resolveRank(computeRankMetrics30(store));
  assert.ok(["excellent", "role_model", "preceding"].includes(rank.key));
});

test("detectAchievements — first prayer", () => {
  const store = applySessionUpdate({}, "2026-06-26", "fajr", { status: "done" });
  assert.ok(detectAchievements(store, new Set()).includes("first_prayer"));
});

test("buildCalendarMonth — 30 days in June", () => {
  assert.equal(buildCalendarMonth({}, 2026, 6).length, 30);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
