/**
 * اختبارات — وحدات التركيز/المتشابهات/الأذكار/التفاسير/الاختبار/الختمة الجماعية
 * تشغيل: npx tsx src/lib/__tests__/quran-edu-logic-modules.test.ts
 */

import {
  enableFocusOnAyah,
  resolveAyahFocusRole,
  clearFocusMode,
} from "../quran-focus-mode";
import { detectMutashabihatCuratedOnly } from "../mutashabihat-detector";
import {
  loadSmartAzkarCounter,
  incrementSmartAzkar,
  isAzkarTargetReached,
  AZKAR_VIBRATE_PATTERNS,
} from "../azkar-haptic-engine";
import { lookupGhareeb, findGhareebInText } from "../ghareeb-quran-dictionary";
import {
  generateWordFillQuestion,
  generateFlashcardMcq,
  isAutoQuizAnswerCorrect,
  generateAutoQuizSet,
} from "../auto-quiz-generator";
import {
  createGroupKhatmah,
  markJuzComplete,
  groupCompletionRatio,
  computeFamilyStreak,
  exportGroupKhatmahJson,
  importGroupKhatmahJson,
  TOTAL_JUZ,
  allocateJuzAmongMembers,
} from "../group-khatmah-manager";
import type { FlashCard } from "../flashcard-service";

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

try {
  Object.defineProperty(globalThis, "navigator", {
    value: { vibrate: () => true },
    configurable: true,
  });
} catch {
  try {
    (globalThis as unknown as { navigator: { vibrate: () => boolean } }).navigator.vibrate = () => true;
  } catch {
    /* ignore */
  }
}

console.log("\n=== 1. Focus mode ===");
{
  clearFocusMode();
  const st = enableFocusOnAyah(2, 255, 1);
  assert(st.enabled && st.focus?.ayah === 255, "focus enabled on 2:255");
  const focus = resolveAyahFocusRole(2, 255, st);
  const near = resolveAyahFocusRole(2, 254, st);
  const dim = resolveAyahFocusRole(2, 250, st);
  assert(focus.isFocused && focus.role === "focus", "focus role");
  assert(near.role === "near", "near role");
  assert(dim.isDimmed && dim.role === "dimmed", "dimmed role");
}

console.log("\n=== 1b. Mutashabihat curated ===");
{
  // msh-001 includes 2:32
  const det = detectMutashabihatCuratedOnly(2, 32);
  assert(det.curatedPairs.length > 0, "finds curated pair for 2:32");
  assert(det.items.some((i) => i.surah === 15 && i.ayah === 86), "lists similar 15:86");
}

console.log("\n=== 2. Smart azkar + haptic patterns ===");
{
  assert(typeof AZKAR_VIBRATE_PATTERNS.tap === "number", "tap pattern");
  assert(Array.isArray(AZKAR_VIBRATE_PATTERNS.complete), "complete pattern array");
  let c = loadSmartAzkarCounter("test-dhikr", 3, "سبحان الله");
  c = incrementSmartAzkar(c, 1);
  c = incrementSmartAzkar(c, 1);
  assert(c.count === 2, "count=2");
  c = incrementSmartAzkar(c, 1);
  assert(isAzkarTargetReached(c), "target reached at 3");
}

console.log("\n=== 3. Ghareeb dictionary ===");
{
  const hits = lookupGhareeb("برزخ");
  assert(hits.length > 0 && hits[0].word.includes("برزخ"), "lookup برزخ");
  const inText = findGhareebInText("وجعلنا من بينهم برزخا");
  assert(inText.some((e) => e.id === "barzakh"), "find in verse text");
}

console.log("\n=== 4. Word-fill + flashcard MCQ ===");
{
  const wf = generateWordFillQuestion("الحمد لله رب العالمين الرحمن الرحيم", {
    sourceKind: "quran",
    rng: () => 0.42,
  });
  assert(!!wf && wf.blankedText.includes("……"), "word-fill blanks a word");
  assert(!!wf && wf.options.includes(wf.answer), "answer in options");
  assert(!!wf && isAutoQuizAnswerCorrect(wf, wf.answer), "correct answer check");

  const cards: FlashCard[] = [
    { id: "a", card_type: "hadith", card_id: "1", front: "أول واجب؟", back: "التوحيد" },
    { id: "b", card_type: "hadith", card_id: "2", front: "أركان الإسلام؟", back: "خمسة" },
    { id: "c", card_type: "lesson", card_id: "3", front: "أفضل الذكر؟", back: "لا إله إلا الله" },
    { id: "d", card_type: "lesson", card_id: "4", front: "سيد الاستغفار؟", back: "اللهم أنت ربي" },
  ];
  const mcq = generateFlashcardMcq(cards[0], cards, () => 0.3);
  assert(!!mcq && mcq.options.length === 4, "mcq has 4 options");
  assert(!!mcq && mcq.answer === "التوحيد", "mcq answer");

  const set = generateAutoQuizSet({
    texts: [{ text: "سبحان الله وبحمده سبحان الله العظيم", sourceKind: "adhkar" }],
    flashcards: cards,
    limit: 5,
  });
  assert(set.length >= 1, "auto quiz set non-empty");
}

console.log("\n=== 5. Group khatmah + family streak ===");
{
  const alloc = allocateJuzAmongMembers(["أحمد", "فاطمة", "خالد"]);
  assert(alloc.length === 3, "3 members");
  assert(alloc.reduce((n, m) => n + m.juzAssigned.length, 0) === TOTAL_JUZ, "30 juz allocated");
  const g = createGroupKhatmah({ memberNames: ["أحمد", "فاطمة"], title: "ختمة العائلة" });
  assert(g.members.length === 2, "group created");
  const m0 = g.members[0];
  const juz = m0.juzAssigned[0];
  const g2 = markJuzComplete(g, m0.id, juz, true);
  assert(g2.members[0].juzCompleted.includes(juz), "juz marked complete");
  assert(groupCompletionRatio(g2) > 0, "completion > 0");
  const streak = computeFamilyStreak(g2);
  assert(streak.familyActiveDays.length >= 1, "family active day recorded");
  const json = exportGroupKhatmahJson(g2);
  const imported = importGroupKhatmahJson(json);
  assert(!!imported && imported.id === g2.id, "round-trip JSON share");
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
