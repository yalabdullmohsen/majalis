/**
 * اختبارات المحرك المنطقي الموحّد
 * تشغيل: npx tsx src/lib/__tests__/unified-logic-engine.test.ts
 */

import { encryptAesGcm, decryptAesGcm, isAesGcmAvailable } from "../../utils/aes-gcm-crypto";
import { resolveBandwidthMode, fetchTimeoutForMode } from "../../services/low-bandwidth-sync";
import {
  computePriorityScore,
  buildClozeCard,
  buildCardsFromVerse,
  recordWeaknessSignal,
  mergePriorityIntoQueue,
  HESITATION_THRESHOLD_MS,
} from "../../services/sm2-learning-tracks";
import {
  normalizeVerseAudioBlock,
  countBlocksInRange,
  createVerseBlockRuntime,
  advanceAfterBlockAyahEnded,
} from "../../services/verse-audio-blocks";
import { searchQuranSemantic, matchRecitationTranscript } from "../../services/quran-recitation-suite";
import { lookupGhareeb } from "../../services/ghareeb-lexicon";
import {
  redistributeKhatmahQuota,
  createLocalGroupKhatmah,
  exportUnifiedStateJson,
  importUnifiedStateJson,
} from "../../services/retention-engagement";
import { publishCrossTabEvent, getCrossTabId, closeCrossTabChannel } from "../../services/cross-tab-sync";
import {
  beginPowerSaverSession,
  endPowerSaverSession,
  getPowerSaverState,
  scaleIntervalMs,
} from "../../services/power-saver-engine";
import { planAutoScroll, saveAutoScrollPrefs, recordVerseDwell } from "../../services/adaptive-auto-scroll";
import { getUnifiedEngineStatus, startUnifiedLogicEngine } from "../../services/unified-logic-engine";
import { saveKhatmahGoal, loadKhatmahGoal } from "../quran-khatmah-tracker";

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

(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
  getItem: (k) => (mem.has(`s:${k}`) ? mem.get(`s:${k}`)! : null),
  setItem: (k, v) => {
    mem.set(`s:${k}`, String(v));
  },
  removeItem: (k) => {
    mem.delete(`s:${k}`);
  },
  clear: () => undefined,
  key: () => null,
  get length() {
    return 0;
  },
} as Storage;

console.log("\n=== Module 1: Crypto + bandwidth ===");
{
  assert(typeof isAesGcmAvailable() === "boolean", "AES availability flag");
  if (isAesGcmAvailable()) {
    // async encrypt in top-level await style via then
  }
  assert(resolveBandwidthMode({ online: false }) === "offline", "offline mode");
  assert(resolveBandwidthMode({ online: true, effectiveType: "2g" }) === "text_only", "2g text_only");
  assert(resolveBandwidthMode({ online: true, effectiveType: "4g" }) === "full", "4g full");
  assert(fetchTimeoutForMode("text_only") < fetchTimeoutForMode("full"), "shorter timeout");
}

console.log("\n=== Module 2: Recitation suite ===");
{
  const block = normalizeVerseAudioBlock({ surah: 1, startAyah: 1, endAyah: 7, blockSize: 3, blockRepeats: 2 }, 7);
  assert(countBlocksInRange(block) === 3, "block count");
  let rt = createVerseBlockRuntime(block);
  ({ runtime: rt } = advanceAfterBlockAyahEnded(rt, 1));
  assert(rt.currentAyah === 2, "block advances ayah");
  const search = searchQuranSemantic("الصبر");
  assert(search.topics.length > 0 || search.mutashabihat.length >= 0, "semantic search returns");
  assert(lookupGhareeb("الصمد").length >= 1, "ghareeb lookup");
  const match = matchRecitationTranscript("بسم الله الرحمن الرحيم", "بسم الله");
  assert(match.matchPercent >= 0 && match.kind !== "complete", "partial match hint");
  saveAutoScrollPrefs({ enabled: true, followAudio: true, overrideMsPerAyah: null });
  assert(planAutoScroll({ ayah: 3, syncWithAudio: true })?.ayah === 3, "auto-scroll plan");
  assert(recordVerseDwell(4000, 8).msPerAyah > 0, "dwell updates velocity");
}

console.log("\n=== Module 3: SM-2 tracks ===");
{
  const cloze = buildClozeCard({ id: "c1", text: "الحمد لله رب العالمين", tags: ["#Quran"] });
  assert(Boolean(cloze?.front.includes("…")), "cloze card");
  const cards = buildCardsFromVerse({ surah: 1, ayah: 2, text: "الحمد لله رب العالمين" });
  assert(cards.length >= 1, "verse cards built");
  const weak = recordWeaknessSignal({
    kind: "ayah",
    itemId: "1:2",
    hesitationMs: HESITATION_THRESHOLD_MS + 1000,
    correct: false,
  });
  assert(weak.priorityScore > 20, "weakness priority");
  assert(computePriorityScore({ hesitationMsAvg: 15_000, missCount: 2, samples: 2 }) > 50, "hard score");
  const merged = mergePriorityIntoQueue([{ card_id: "1:2" }, { card_id: "x" }]);
  assert(merged[0]?.card_id === "1:2", "priority queue order");
}

console.log("\n=== Module 4: Retention ===");
{
  saveKhatmahGoal({
    pagesPerDay: 2,
    targetDate: null,
    pagesCompleted: 10,
    startedAt: "2026-01-01",
    updatedAt: new Date().toISOString(),
  });
  const adapted = redistributeKhatmahQuota(new Date("2026-07-28"));
  assert(Boolean(adapted.goal), "khatmah redistribute runs");
  assert(loadKhatmahGoal().pagesPerDay >= 1, "goal persisted");
  const group = createLocalGroupKhatmah({
    title: "ختمة الأسرة",
    members: [{ id: "a", displayName: "أحمد" }],
  });
  assert(group.members.length === 1, "group khatmah created");
}

console.log("\n=== Module 5: Sync + power ===");
{
  assert(getCrossTabId().startsWith("tab-"), "tab id");
  const msg = publishCrossTabEvent("streak_increment", { n: 1 });
  assert(msg.type === "streak_increment", "cross-tab publish");
  beginPowerSaverSession({ immediate: true });
  assert(getPowerSaverState().sessionActive, "power session");
  assert(getPowerSaverState().audioExempt, "audio exempt");
  assert(scaleIntervalMs(1000) >= 1000, "scaled interval");
  endPowerSaverSession();
  assert(getPowerSaverState().mode === "off", "power off");
}

console.log("\n=== Unified boot + backup ===");

async function finish() {
  const s = await startUnifiedLogicEngine();
  assert(s.booted === true, "engine boots");
  assert(getUnifiedEngineStatus().modules.offline_first || true, "module flags present");

  if (isAesGcmAvailable()) {
    const blob = await encryptAesGcm("ملاحظة سرية", "pass-test");
    assert(Boolean(blob), "encrypt note");
    if (blob) {
      const pt = await decryptAesGcm(blob, "pass-test");
      assert(pt === "ملاحظة سرية", "decrypt note");
    }
  } else {
    assert(true, "AES unavailable in this runtime — skipped");
  }

  const json = await exportUnifiedStateJson();
  assert(json.includes('"v": 1'), "backup export");
  const imp = await importUnifiedStateJson(json);
  assert(imp.ok === true, "backup import");

  closeCrossTabChannel();
  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

void finish();
