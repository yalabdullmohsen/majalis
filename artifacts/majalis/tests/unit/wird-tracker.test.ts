/**
 * Unit — Daily Wird tracker (streak + progress pct) with mocked dates/storage.
 * Run: npx tsx tests/unit/wird-tracker.test.ts
 */
import assert from "node:assert/strict";

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  get length() {
    return mem.size;
  },
} as Storage;

const {
  saveWirdGoal,
  recordWirdProgress,
  getWirdProgressSnapshot,
  refreshWirdDayBoundary,
} = await import("../../src/lib/wird-engine");
const { saveDailyWirdState } = await import("../../src/lib/quran-api");

let passed = 0;
let failed = 0;
function check(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.log(`  ✗ ${msg}`);
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

mem.clear();
console.log("═══ Daily Wird Tracker ═══");

{
  saveWirdGoal({ type: "pages", target: 4, reminderEnabled: false });
  saveDailyWirdState({
    pagesPerDay: 4,
    currentSurah: 1,
    currentAyah: 1,
    completedToday: 0,
    lastDate: todayKey(),
    monthlyTotal: 0,
    streak: 0,
    weeklyLogs: {},
    totalPagesEver: 0,
  });

  const after1 = recordWirdProgress({ pages: 1 });
  check(after1.completedToday === 1, "تسجيل صفحة واحدة");
  const snap1 = getWirdProgressSnapshot();
  check(Math.abs(snap1.pct - 0.25) < 0.001, `نسبة التقدم 25% (حصلت: ${snap1.pct})`);

  recordWirdProgress({ pages: 3 });
  const snapDone = getWirdProgressSnapshot();
  check(snapDone.pct === 1, "إكمال الهدف ⇒ 100%");
  check(snapDone.state.streak >= 1, "السلسلة تبدأ عند إكمال الهدف");
}

{
  mem.clear();
  saveWirdGoal({ type: "pages", target: 2, reminderEnabled: false });
  const y = yesterdayKey();
  const t = todayKey();
  saveDailyWirdState({
    pagesPerDay: 2,
    currentSurah: 1,
    currentAyah: 1,
    completedToday: 0,
    lastDate: t,
    monthlyTotal: 10,
    streak: 6,
    weeklyLogs: { [y]: 2 },
    totalPagesEver: 10,
  });
  recordWirdProgress({ pages: 2 });
  const snap = getWirdProgressSnapshot();
  check(snap.state.streak === 7, `سلسلة 7 أيام بعد إكمال اليوم (حصلت: ${snap.state.streak})`);
  check(snap.streakLabel.includes("7") || snap.streakLabel.includes("٧"), "تسمية السلسلة تعرض العدد");
}

{
  mem.clear();
  saveWirdGoal({ type: "hizb", target: 1, reminderEnabled: false });
  saveDailyWirdState({
    pagesPerDay: 2,
    currentSurah: 1,
    currentAyah: 1,
    completedToday: 0,
    lastDate: todayKey(),
    monthlyTotal: 0,
    streak: 0,
    weeklyLogs: {},
    totalPagesEver: 0,
  });
  // حزب ≈ 10 صفحات
  recordWirdProgress({ pages: 5 });
  const snap = getWirdProgressSnapshot();
  check(Math.abs(snap.pct - 0.5) < 0.05, `هدف حزب: 5 صفحات ≈ 50% (حصلت: ${snap.pct})`);
  check(snap.unitLabel === "حزب", "وحدة العرض حزب");
}

{
  mem.clear();
  saveWirdGoal({ type: "minutes", target: 20, reminderEnabled: false });
  saveDailyWirdState({
    pagesPerDay: 2,
    currentSurah: 1,
    currentAyah: 1,
    completedToday: 0,
    lastDate: todayKey(),
    monthlyTotal: 0,
    streak: 0,
    weeklyLogs: {},
    totalPagesEver: 0,
  });
  recordWirdProgress({ minutes: 10 });
  const snap = getWirdProgressSnapshot();
  check(Math.abs(snap.pct - 0.5) < 0.001, "هدف دقائق: 10/20 = 50%");
}

{
  // حدود اليوم: انتقال تاريخ يصفّر completedToday دون فقدان السجل
  mem.clear();
  const y = yesterdayKey();
  saveWirdGoal({ type: "pages", target: 2 });
  saveDailyWirdState({
    pagesPerDay: 2,
    currentSurah: 2,
    currentAyah: 1,
    completedToday: 2,
    lastDate: y,
    monthlyTotal: 2,
    streak: 1,
    weeklyLogs: { [y]: 2 },
    totalPagesEver: 2,
  });
  const refreshed = refreshWirdDayBoundary();
  check(refreshed.completedToday === 0, "يوم جديد ⇒ completedToday = 0");
  check(refreshed.lastDate === todayKey(), "lastDate يُحدَّث لليوم");
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
