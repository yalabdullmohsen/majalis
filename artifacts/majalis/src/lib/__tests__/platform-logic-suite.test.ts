/**
 * اختبارات وحدة — مجموعة منطق المنصة القرآنية (8 وحدات خلفية)
 * تشغيل: npx tsx src/lib/__tests__/platform-logic-suite.test.ts
 */

import { buildSmartRecommendations } from "../smart-content-recommendations";
import {
  detectSearchIntent,
  expandSemanticQuery,
  semanticSearchDocuments,
} from "../semantic-search-engine";
import { searchQuranTopics } from "../quran-topics-index";
import { buildWeeklyProgressAnalytics, exportWeeklyProgressJson } from "../weekly-progress-analytics";
import { buildDailySmartSchedule } from "../smart-local-notifications";
import {
  advanceAfterAyahEnded,
  createLoopRuntime,
  normalizeLoopConfig,
} from "../ayah-loop-controller";
import {
  predictKhatmahCompletion,
  loadKhatmahGoal,
  saveKhatmahGoal,
  QURAN_TOTAL_PAGES,
} from "../quran-khatmah-tracker";
import { saveAudioResumeState, loadAudioResumeState } from "../quran-audio-resume";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

// localStorage / indexedDB stubs for node
const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
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

console.log("\n=== 1. Smart recommendations ===");
{
  const recs = buildSmartRecommendations({
    title: "فضل الصبر عند الابتلاء",
    text: "الصبر مفتاح الفرج",
    now: new Date(2026, 0, 1, 6, 0),
  });
  assert(recs.length > 0, "returns recommendations");
  assert(recs.some((r) => r.kind === "adhkar"), "includes time-aware adhkar");
  assert(recs.every((r) => typeof r.href === "string" && r.href.startsWith("/")), "hrefs are absolute paths");
}

console.log("\n=== 2. Semantic search + synonyms ===");
{
  const expanded = expandSemanticQuery("قيام الليل");
  assert(
    expanded.some((t) => t.includes("صلاة") || t.includes("تهجد") || t.includes("قيام")),
    "قيام الليل expands to related night-prayer terms",
  );
  assert(detectSearchIntent("حديث البخاري") === "hadith", "intent: hadith");
  assert(detectSearchIntent("أذكار الصباح") === "adhkar", "intent: adhkar");

  const docs = [
    { id: "1", title: "صلاة الليل وفضلها", href: "/a", body: "التهجد" },
    { id: "2", title: "الزكاة", href: "/b", body: "مال" },
  ];
  const hits = semanticSearchDocuments("قيام الليل", docs, 10);
  assert(hits.some((h) => h.id === "1" || h.source === "topic"), "matches night prayer doc or topic");
}

console.log("\n=== 7. Quran topics index ===");
{
  const sabr = searchQuranTopics("الصبر", 3);
  assert(sabr.length > 0, "الصبر finds topic");
  assert(sabr[0].verses.length > 0, "topic has verses");
  const birr = searchQuranTopics("البر بالوالدين", 3);
  assert(birr.length > 0, "البر بالوالدين finds topic");
}

console.log("\n=== 3. Weekly analytics ===");
{
  const payload = buildWeeklyProgressAnalytics("local", new Date("2026-07-20T12:00:00"));
  assert(payload.daily.length === 7, "7 day metrics");
  assert(typeof payload.completionRate === "number", "completionRate number");
  const json = exportWeeklyProgressJson("local");
  assert(json.includes("weekStart"), "exportable JSON");
}

console.log("\n=== 4. Smart local schedule ===");
{
  // prefs disabled → empty
  mem.set(
    "majalis_notif_prefs_v1",
    JSON.stringify({
      enabled: true,
      flashcardsReminder: true,
      resumeReminder: true,
      prayerReminder: true,
      quranDailyReminder: true,
      adhkarReminder: true,
      dhikrPhraseReminder: true,
      reminderHour: 8,
      reminderMinute: 0,
    }),
  );
  const items = buildDailySmartSchedule({ khatmahBehind: true });
  assert(items.some((i) => i.kind === "adhkar"), "schedules adhkar");
  assert(items.some((i) => i.kind === "dhikr"), "schedules dhikr phrases");
  assert(items.filter((i) => i.kind === "dhikr").length === 7, "seven dhikr phrases");
  assert(items.some((i) => i.title === "الحمد لله"), "includes alhamdulillah");
  assert(items.some((i) => i.kind === "prayer"), "schedules prayer");
  assert(items.some((i) => i.kind === "quran"), "schedules quran daily reminder");
  assert(items.some((i) => i.kind === "khatmah"), "schedules khatmah when behind");
  assert(items.every((i, idx) => idx === 0 || items[idx - 1].minuteOfDay <= i.minuteOfDay), "sorted by minute");
  const quran = items.find((i) => i.kind === "quran");
  assert(quran?.minuteOfDay === 17 * 60, "quran reminder at 17:00");
}

console.log("\n=== 5. Ayah loop controller ===");
{
  const cfg = normalizeLoopConfig({ startAyah: 1, endAyah: 3, repeatCount: 2, delayMs: 500 }, 7);
  assert(cfg.endAyah === 3 && cfg.delayMs === 500, "normalizes config");
  let rt = createLoopRuntime(cfg);
  let step = advanceAfterAyahEnded(rt, 1);
  assert(step.next.action === "play" && step.next.ayah === 2, "1→2");
  rt = step.runtime;
  step = advanceAfterAyahEnded(rt, 2);
  assert(step.next.action === "play" && step.next.ayah === 3, "2→3");
  rt = step.runtime;
  step = advanceAfterAyahEnded(rt, 3);
  assert(step.next.action === "play" && step.next.ayah === 1, "end of pass → restart");
  rt = step.runtime;
  // finish second pass
  step = advanceAfterAyahEnded(rt, 1);
  rt = step.runtime;
  step = advanceAfterAyahEnded(rt, 2);
  rt = step.runtime;
  step = advanceAfterAyahEnded(rt, 3);
  assert(step.next.action === "done", "completes after N passes");
}

console.log("\n=== 6. Audio resume persistence ===");
{
  saveAudioResumeState({ surah: 2, ayah: 255, currentTime: 12.5, reciterId: "x", updatedAt: Date.now() });
  const loaded = loadAudioResumeState();
  assert(loaded?.surah === 2 && loaded?.ayah === 255, "loads surah/ayah");
  assert(loaded?.currentTime === 12.5, "loads timestamp");
}

console.log("\n=== 8. Khatmah predictor ===");
{
  const goal = saveKhatmahGoal({
    ...loadKhatmahGoal(),
    pagesPerDay: 4,
    pagesCompleted: 40,
    startedAt: "2026-07-01",
    updatedAt: "2026-07-20",
    targetDate: null,
  });
  const pred = predictKhatmahCompletion(goal, new Date("2026-07-20T12:00:00"));
  assert(pred.pagesRemaining === QURAN_TOTAL_PAGES - 40, "pages remaining");
  assert(pred.estimatedDaysRemaining != null && pred.estimatedDaysRemaining > 0, "ETA days");
  assert(typeof pred.behindSchedule === "boolean", "behindSchedule flag");
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
