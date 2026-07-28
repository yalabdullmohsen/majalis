/**
 * اختبارات تقسية الأداء — دمج الكتابة، مفاتيح اليوم، تنظيف القناة
 * تشغيل: npx tsx src/lib/__tests__/enterprise-perf-hardening.test.ts
 */

import { createWriteCoalescer, deferIdleWork, isBrowserClient } from "../../utils/defer-storage";
import { calendarDayKey, calendarDayKeyOffset } from "../../utils/today-key";
import {
  saveAudioResumeState,
  flushAudioResumeState,
  loadAudioResumeState,
} from "../quran-audio-resume";
import { getDefaultHomepagePrefs, sanitizePrefs } from "../homepage-layout";
import { closeCrossTabChannel, getCrossTabId, publishCrossTabEvent, subscribeCrossTab } from "../cross-tab-sync";

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
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  get length() {
    return 0;
  },
} as Storage;

console.log("\n=== Defer / coalesce ===");
{
  assert(typeof isBrowserClient() === "boolean", "isBrowserClient");
  let writes = 0;
  let last = 0;
  const c = createWriteCoalescer<number>({
    write: (v) => {
      writes += 1;
      last = v;
    },
    maxWaitMs: 50,
    idleTimeoutMs: 10,
  });
  c.enqueue(1);
  c.enqueue(2);
  c.enqueue(3);
  c.flush();
  assert(writes === 1 && last === 3, "coalescer keeps latest only");
  let idleRan = false;
  const h = deferIdleWork(() => {
    idleRan = true;
  }, { timeoutMs: 5 });
  h.cancel();
  assert(idleRan === false, "idle work cancelable");
}

console.log("\n=== Calendar day key ===");
{
  const k = calendarDayKey(new Date("2026-07-28T12:00:00Z"), "UTC");
  assert(k === "2026-07-28", "UTC day key");
  const y = calendarDayKeyOffset(1, new Date("2026-07-28T12:00:00Z"), "UTC");
  assert(y === "2026-07-27", "yesterday offset");
}

console.log("\n=== Audio resume coalesce ===");
{
  saveAudioResumeState({ surah: 2, ayah: 1, currentTime: 1.5, updatedAt: Date.now() });
  saveAudioResumeState({ surah: 2, ayah: 2, currentTime: 0, updatedAt: Date.now() });
  flushAudioResumeState();
  const loaded = loadAudioResumeState();
  assert(loaded?.surah === 2 && loaded?.ayah === 2, "flushed resume state");
}

console.log("\n=== Homepage defaults SSR-safe ===");
{
  const d = getDefaultHomepagePrefs();
  assert(d.order.length > 0 && d.hidden.length > 0, "default prefs");
  const s = sanitizePrefs({ order: ["continue"], hidden: ["prayer"] });
  assert(s.order[0] === "continue", "sanitize keeps order head");
}

console.log("\n=== Cross-tab teardown ===");
{
  const id = getCrossTabId();
  assert(id.startsWith("tab-"), "tab id");
  const unsub = subscribeCrossTab(() => undefined);
  publishCrossTabEvent("ping", {});
  unsub();
  closeCrossTabChannel();
  assert(true, "subscribe/unsubscribe/close safe");
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
