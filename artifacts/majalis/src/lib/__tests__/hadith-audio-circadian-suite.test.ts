/**
 * اختبارات — توثيق الحديث، كتل الصوت، إيقاع القراءة، نطاق ضيق، ضعف الاسترجاع
 * تشغيل: npx tsx src/lib/__tests__/hadith-audio-circadian-suite.test.ts
 */

import {
  annotateAdhkarItem,
  annotateMatnText,
  lookupHadithAuth,
  parseAuthenticityGrade,
  parsePrimarySource,
  warmHadithAuthIndex,
} from "../hadith-auth-engine";
import {
  advanceAfterBlockAyahEnded,
  blockBoundsAt,
  countBlocksInRange,
  createVerseBlockRuntime,
  normalizeVerseAudioBlock,
} from "../verse-audio-block-manager";
import {
  blueFilterForPhase,
  resolveCircadianPhase,
  suggestModeForPhase,
  syncCircadianLighting,
} from "../circadian-reading-schedule";
import {
  detectNetworkBandwidthState,
  fetchTimeoutForMode,
  resolveBandwidthMode,
  shouldSuppressNetworkErrorOverlay,
} from "../low-bandwidth-sync";
import {
  computePriorityScore,
  getPriorityRecallItems,
  HESITATION_THRESHOLD_MS,
  mergePriorityIntoQueue,
  recordWeaknessSignal,
} from "../weakness-recall-engine";
import type { AdhkarItem } from "../adhkar-seed";

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
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
} as Storage;

try {
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true },
    configurable: true,
  });
} catch {
  /* navigator may be read-only in this runtime */
}

console.log("\n=== 1. Hadith auth engine ===");
{
  assert(parseAuthenticityGrade("صحيح") === "sahih", "parse sahih");
  assert(parseAuthenticityGrade("حسن — الألباني") === "hasan", "parse hasan");
  assert(parseAuthenticityGrade("ضعيف") === "daif", "parse daif");
  assert(parsePrimarySource("رواه البخاري") === "bukhari", "parse bukhari");
  assert(parsePrimarySource("رواه مسلم") === "muslim", "parse muslim");
  assert(parsePrimarySource("متفق عليه") === "bukhari", "muttafaq → bukhari primary");

  const sample: AdhkarItem = {
    id: "t-1",
    categoryId: "adh-morning",
    text: "سبحان الله",
    count: 1,
    source: "رواه مسلم",
    grade: "صحيح",
    keywords: [],
  };
  const ann = annotateAdhkarItem(sample);
  assert(ann.grade === "sahih" && ann.primarySource === "muslim", "annotate adhkar");
  assert(ann.confidence > 0.5, "confidence high when grade+source known");

  const matn = annotateMatnText("m1", "حديث …", { grade: "حسن", source: "الترمذي" });
  assert(matn.grade === "hasan" && matn.primarySource === "tirmidhi", "annotate matn");

  const n = warmHadithAuthIndex();
  assert(n > 10, "warm adhkar auth index");
  const hit = lookupHadithAuth({ id: "adh-1" });
  assert(hit.matchedBy === "id" && Boolean(hit.record), "lookup by adhkar id");
}

console.log("\n=== 2. Verse audio blocks ===");
{
  const block = normalizeVerseAudioBlock(
    { surah: 2, startAyah: 1, endAyah: 7, blockSize: 3, blockRepeats: 2 },
    286,
  );
  assert(block.blockSize === 3, "block size normalized");
  assert(countBlocksInRange(block) === 3, "7 ayahs / 3 → 3 blocks");
  assert(blockBoundsAt(block, 0)?.end === 3, "first block 1–3");
  assert(blockBoundsAt(block, 2)?.end === 7, "last block ends at 7");

  let rt = createVerseBlockRuntime(block);
  assert(rt.currentAyah === 1 && rt.active, "runtime starts at start ayah");

  // Finish ayahs 1,2,3 → first pass of block 0 done → should repeat block
  ({ runtime: rt } = advanceAfterBlockAyahEnded(rt, 1));
  ({ runtime: rt } = advanceAfterBlockAyahEnded(rt, 2));
  const afterPass = advanceAfterBlockAyahEnded(rt, 3);
  assert(afterPass.next.action === "play", "after block pass → play again");
  if (afterPass.next.action === "play") {
    assert(afterPass.next.ayah === 1, "repeat starts at block start");
    assert(afterPass.runtime.blockRepeatDone === 1, "block repeat incremented");
  }
}

console.log("\n=== 3. Circadian lighting ===");
{
  assert(resolveCircadianPhase(new Date("2026-07-27T23:30:00")) === "late_night", "late night");
  assert(resolveCircadianPhase(new Date("2026-07-27T04:30:00")) === "pre_dawn", "pre-dawn");
  assert(resolveCircadianPhase(new Date("2026-07-27T12:00:00")) === "day", "day");
  assert(suggestModeForPhase("late_night") === "eye-care", "late night → eye-care");
  assert(suggestModeForPhase("pre_dawn") === "oled-eye-care", "pre-dawn → oled-eye-care");
  assert(blueFilterForPhase("late_night") > 0.5, "blue filter active at night");
  const lit = syncCircadianLighting({
    now: new Date("2026-07-27T23:00:00"),
    apply: false,
  });
  assert(lit.phase === "late_night" && lit.contrastBoost > 0, "sync without DOM apply");
}

console.log("\n=== 4. Low-bandwidth sync ===");
{
  assert(resolveBandwidthMode({ online: false }) === "offline", "offline mode");
  assert(
    resolveBandwidthMode({ online: true, effectiveType: "2g", prefs: { enabled: true, forceTextOnly: false } }) ===
      "text_only",
    "2g → text_only",
  );
  assert(
    resolveBandwidthMode({ online: true, effectiveType: "3g", prefs: { enabled: true, forceTextOnly: false } }) ===
      "text_only",
    "3g → text_only",
  );
  assert(
    resolveBandwidthMode({ online: true, effectiveType: "4g", prefs: { enabled: true, forceTextOnly: false } }) ===
      "full",
    "4g → full",
  );
  assert(fetchTimeoutForMode("text_only") < fetchTimeoutForMode("full"), "shorter timeout on slow");
  const state = detectNetworkBandwidthState({ enabled: true, forceTextOnly: true });
  assert(state.mode === "text_only", "force text only");
  assert(shouldSuppressNetworkErrorOverlay(state) === true, "suppress overlays in text_only");
}

console.log("\n=== 5. Weakness recall ===");
{
  mem.clear();
  const entry = recordWeaknessSignal({
    kind: "verse_recall",
    itemId: "2:255",
    hesitationMs: HESITATION_THRESHOLD_MS + 2000,
    correct: false,
  });
  assert(entry.priorityScore > 30, "hesitation+miss raises priority");
  assert(computePriorityScore({ hesitationMsAvg: 15_000, missCount: 2, samples: 3 }) > 60, "hard hesitation score");
  recordWeaknessSignal({
    kind: "flashcard",
    itemId: "card-9",
    cardType: "hadith",
    hesitationMs: 2000,
    quality: "again",
  });
  const top = getPriorityRecallItems(5);
  assert(top.length >= 2, "priority list populated");
  const merged = mergePriorityIntoQueue([
    { card_id: "other", card_type: "hadith" },
    { card_id: "card-9", card_type: "hadith" },
    { card_id: "2:255", card_type: "quran_ayah" },
  ]);
  assert(merged[0]?.card_id === "2:255" || merged[0]?.card_id === "card-9", "weak items float to front");
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
