/**
 * Part 5 — Final polish: safe-json, LRU normalize, unload persist, fetch pool.
 * Run: npx tsx src/lib/__tests__/final-polish-persistence.test.ts
 */

import { safeJsonParse, readLocalJson, writeLocalJson, isPlainObject, isStringArray } from "../safe-json";
import { LruStringCache, dedupePromise, clearDedupePool } from "../lru-cache";
import {
  normalizeArabic,
  clearNormalizeArabicCache,
  getNormalizeArabicCacheSize,
} from "../../shared/arabic-normalize";
import { flushUnloadPersist, registerUnloadPersist, persistLocalSync } from "../unload-persist";
import { recordUserActivity, getUserStreak, USER_STREAK_LS_KEY } from "../user-streak";
import { saveAudioResumeState, loadAudioResumeState, stageAudioResumeState, flushAudioResumeState } from "../quran-audio-resume";

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

(globalThis as unknown as { window: Window }).window = {
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => true,
} as unknown as Window;
(globalThis as unknown as { document: Document }).document = {
  visibilityState: "visible",
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
} as unknown as Document;

console.log("\n=== 1. safeJsonParse / schema guards ===");
{
  const ok = safeJsonParse('{"a":1}', { a: 0 }, (v): v is { a: number } => isPlainObject(v) && typeof (v as { a: unknown }).a === "number");
  assert(ok.ok && ok.value.a === 1, "parses valid object with guard");

  const bad = safeJsonParse("{not-json", { a: 0 });
  assert(!bad.ok && bad.value.a === 0, "corrupt JSON returns fallback");

  mem.set("corrupt-key", "{broken");
  const wiped = readLocalJson("corrupt-key", [] as string[], isStringArray);
  assert(Array.isArray(wiped) && wiped.length === 0, "corrupt LS wiped to fallback");
  assert(mem.get("corrupt-key") === undefined, "corrupt LS key removed");

  assert(writeLocalJson("ok-key", { x: 1 }), "writeLocalJson succeeds");
  assert(readLocalJson("ok-key", { x: 0 }, isPlainObject as (v: unknown) => v is { x: number }).x === 1, "round-trip LS");
}

console.log("\n=== 2. Arabic normalize LRU ===");
{
  clearNormalizeArabicCache();
  const a = normalizeArabic("الْقُرْآنُ");
  const b = normalizeArabic("الْقُرْآنُ");
  assert(a === b && a.length > 0, "normalize returns consistent memoized string");
  assert(getNormalizeArabicCacheSize() >= 1, "cache populated after normalize");
  const before = getNormalizeArabicCacheSize();
  normalizeArabic("الْقُرْآنُ");
  assert(getNormalizeArabicCacheSize() === before, "identical input does not grow cache");

  const lru = new LruStringCache(2);
  lru.set("a", "1");
  lru.set("b", "2");
  lru.set("c", "3");
  assert(lru.get("a") === undefined && lru.get("c") === "3", "LRU evicts oldest");
}

console.log("\n=== 3. unload persist + streak / audio ===");
{
  mem.clear();
  recordUserActivity("quran");
  const streak = getUserStreak();
  assert(streak.currentStreak >= 1, "streak recorded");
  flushUnloadPersist();
  assert(typeof mem.get(USER_STREAK_LS_KEY) === "string", "streak flushed to LS on unload");

  saveAudioResumeState({ surah: 2, ayah: 255, currentTime: 12.5, updatedAt: Date.now() });
  const loaded = loadAudioResumeState();
  assert(!!loaded && loaded.surah === 2 && loaded.ayah === 255, "audio resume round-trip");
  stageAudioResumeState({ surah: 1, ayah: 1, currentTime: 3, updatedAt: Date.now() });
  flushAudioResumeState();
  const staged = loadAudioResumeState();
  assert(!!staged && staged.surah === 1 && staged.currentTime === 3, "staged resume flushed");

  assert(persistLocalSync("tmp-key", { z: true }), "persistLocalSync works");
  registerUnloadPersist("test-snap", () => ({ "test-snap-key": '{"ok":true}' }));
  flushUnloadPersist();
  assert(mem.get("test-snap-key") === '{"ok":true}', "custom unload snapshot written");
}

console.log("\n=== 4. promise dedupe pool ===");
{
  clearDedupePool();
  let runs = 0;
  const p1 = dedupePromise("t", "k", async () => {
    runs++;
    await new Promise((r) => setTimeout(r, 20));
    return 42;
  });
  const p2 = dedupePromise("t", "k", async () => {
    runs++;
    return 99;
  });
  const [a, b] = await Promise.all([p1, p2]);
  assert(a === 42 && b === 42 && runs === 1, "concurrent dedupe shares one factory");
}

console.log(`\nfinal-polish-persistence: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
