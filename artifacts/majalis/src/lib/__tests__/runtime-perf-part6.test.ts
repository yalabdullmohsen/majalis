/**
 * Part 6 — runtime performance: frame budget, audio memory, quota, search offload.
 * Run: npx tsx src/lib/__tests__/runtime-perf-part6.test.ts
 */

import {
  scheduleFrame,
  clearFrameQueue,
  createFrameAlignedTicker,
} from "../frame-budget";
import { releaseAudioElement, assignAudioSrc, revokeBlobUrl } from "../audio-memory";
import { normalizeArabic } from "../../shared/arabic-normalize";
import { filterDocsOffthread, normalizeArabicOffthread, disposeSearchWorker } from "../search-offload";
import { estimateStorageQuota } from "../storage-quota";
import {
  inspectStorage,
  isProtectedLocalStorageKey,
  isEvictableLocalStorageKey,
} from "../smart-cache-eviction";

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
  setInterval: globalThis.setInterval.bind(globalThis),
  clearInterval: globalThis.clearInterval.bind(globalThis),
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
} as unknown as Window;

(globalThis as unknown as { document: Document }).document = {
  visibilityState: "visible",
} as unknown as Document;

console.log("\n=== 1. Frame budget ===");
{
  clearFrameQueue();
  let ran = 0;
  await new Promise<void>((resolve) => {
    scheduleFrame(() => {
      ran++;
    });
    scheduleFrame(() => {
      ran++;
      resolve();
    });
  });
  assert(ran === 2, "coalesced frame callbacks both run");

  let ticks = 0;
  const stop = createFrameAlignedTicker(50, () => {
    ticks++;
  });
  await new Promise((r) => setTimeout(r, 350));
  stop();
  assert(ticks >= 1, "frame-aligned ticker fires");
}

console.log("\n=== 2. Audio memory helpers ===");
{
  const audio = {
    pause() {},
    removeAttribute() {},
    load() {},
    src: "https://example.com/a.mp3",
  } as unknown as HTMLAudioElement;
  releaseAudioElement(audio);
  assert(audio.src === "", "releaseAudioElement clears src");

  assignAudioSrc(audio, "https://example.com/b.mp3");
  assert(audio.src.includes("b.mp3"), "assignAudioSrc sets new url");

  // revokeBlobUrl should no-op on http
  revokeBlobUrl("https://example.com/x");
  assert(true, "revokeBlobUrl safe on non-blob");
}

console.log("\n=== 3. Search offload (sync fallback in Node) ===");
{
  disposeSearchWorker();
  const n = await normalizeArabicOffthread("الْقُرْآنُ");
  assert(n === normalizeArabic("الْقُرْآنُ"), "offthread normalize matches sync");

  const ids = await filterDocsOffthread("بقر", [
    { id: "2", fields: ["سورة البقرة"] },
    { id: "1", fields: ["سورة الفاتحة"] },
  ]);
  assert(ids.includes("2") && !ids.includes("1"), "filterDocs matches Arabic");
}

console.log("\n=== 4. Storage quota / eviction guards ===");
{
  assert(isProtectedLocalStorageKey("majalis-user-streak-v1"), "streak protected");
  assert(isEvictableLocalStorageKey("mj-quran-v3-surah-1"), "ephemeral quran cache evictable");
  const snap = await estimateStorageQuota();
  assert(typeof snap.ratio === "number" && ["ok", "warn", "critical"].includes(snap.pressure), "quota snapshot shape");
  const report = await inspectStorage();
  assert(typeof report.estimatedUsage === "number", "inspectStorage works");
}

console.log(`\nruntime-perf-part6: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
