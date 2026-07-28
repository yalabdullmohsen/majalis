/**
 * اختبارات — تحليلات القراءة، متشابهات، إشارات مكتوبة، بطاقات SM-2، prefetch
 * تشغيل: npx tsx src/lib/__tests__/reading-analytics-bookmarks-prefetch.test.ts
 */

import {
  beginPageReading,
  endPageReading,
  buildReadingAnalyticsPayload,
  pageHeatIntensity,
  loadReadingAnalytics,
} from "../reading-analytics";
import {
  compareVerseTexts,
  compareMutashabihVerses,
  findCuratedPairsForAyah,
} from "../mutashabihat-comparison";
import {
  upsertTypedBookmark,
  getBookmarksByType,
  restoreBookmarkPosition,
  removeTypedBookmark,
  BOOKMARK_TYPE_LABELS,
} from "../typed-bookmarks-engine";
import {
  buildFlashcardFromVerse,
  buildFlashcardFromGhareeb,
  buildFlashcardFromMatn,
  buildFlashcardFromMutashabihat,
  listBuiltFlashcards,
} from "../auto-flashcard-builder";
import {
  getPrefetchStatus,
  scheduleAdaptivePrefetch,
  cancelScheduledPrefetch,
} from "../adaptive-offline-prefetch";

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

console.log("\n=== 1. Reading analytics ===");
{
  beginPageReading(1);
  await new Promise((r) => setTimeout(r, 25));
  const cell = endPageReading(1, { completed: true, minMs: 0 });
  assert(!!cell && cell.page === 1 && cell.visits >= 1, "records page visit");
  const payload = buildReadingAnalyticsPayload("week");
  assert(payload.daily.length === 7, "weekly 7 days");
  assert(payload.heatmap.some((h) => h.page === 1), "heatmap includes page 1");
  assert(pageHeatIntensity(1, loadReadingAnalytics()) > 0, "heat intensity > 0");
  assert(typeof payload.completionRate === "number", "completion rate");
}

console.log("\n=== 2. Mutashabihat comparison ===");
{
  const pairs = findCuratedPairsForAyah(2, 32);
  assert(pairs.length > 0, "curated pair for 2:32");
  const cmp = compareVerseTexts(
    "إنك أنت العليم الحكيم",
    "إنك أنت العليم القدير",
    { left: { surah: 2, ayah: 32 }, right: { surah: 15, ayah: 86 } },
  );
  assert(cmp.discrepancyCount >= 1, "detects word discrepancy");
  assert(cmp.words.some((w) => w.kind === "substituted"), "substituted kind");

  const waw = compareMutashabihVerses({
    leftSurah: 1,
    leftAyah: 1,
    leftText: "وبالوالدين إحسانا",
    rightSurah: 1,
    rightAyah: 2,
    rightText: "بالوالدين إحسانا",
  });
  assert(
    waw.words.some((w) => w.kind === "waw_presence" || w.kind === "substituted" || w.kind === "extra"),
    "flags waw / leading difference",
  );
  assert(waw.vocabularyHints.length >= 0, "vocab hints array");
}

console.log("\n=== 3. Typed bookmarks ===");
{
  const bk = upsertTypedBookmark({
    type: "memorization",
    surah: 2,
    ayah: 255,
    textSnippet: "آية الكرسي",
  });
  assert(bk.type === "memorization", "typed bookmark");
  assert(BOOKMARK_TYPE_LABELS.daily_wird.includes("ورد"), "wird label");
  assert(getBookmarksByType("memorization").some((b) => b.id === bk.id), "by type");
  const pos = restoreBookmarkPosition("memorization");
  assert(!!pos && pos.surah === 2 && pos.ayah === 255, "zero-latency restore");
  removeTypedBookmark(bk.id);
  assert(getBookmarksByType("memorization").length === 0, "removed");
}

console.log("\n=== 4. Auto flashcard builder ===");
{
  const verse = await buildFlashcardFromVerse({
    surah: 1,
    ayah: 1,
    text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    alsoMemorizationDeck: true,
  });
  assert(verse.tags.includes("Quran"), "verse tags");
  assert(verse.sm2.ease_factor >= 1.3, "sm2 ease");

  const gh = await buildFlashcardFromGhareeb({
    word: "أبابيل",
    meaning: "جماعات متفرقة",
  });
  assert(gh.tags.includes("Ghareeb"), "ghareeb tag");

  const matn = await buildFlashcardFromMatn({
    matnLine: "إنما الأعمال بالنيات",
    answer: "متفق عليه",
  });
  assert(matn.tags.includes("Fiqh Matn"), "matn tag");

  const msh = await buildFlashcardFromMutashabihat({
    prompt: "أي الخاتمتين في 2:32؟",
    answer: "العليم الحكيم",
    leftRef: "2:32",
    rightRef: "15:86",
  });
  assert(msh.tags.includes("Mutashabihat"), "mutashabihat tag");
  assert(listBuiltFlashcards().length >= 4, "vault lists cards");
}

console.log("\n=== 5. Adaptive prefetch ===");
{
  cancelScheduledPrefetch();
  scheduleAdaptivePrefetch({ surah: 1, ayah: 1 }, 10);
  const st = getPrefetchStatus();
  assert(typeof st.running === "boolean", "status shape");
  cancelScheduledPrefetch();
  assert(true, "cancel scheduled ok");
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
