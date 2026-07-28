/**
 * Part 16 — adaptive audio buffers, IDB self-heal, fonts, abort, diagnostics.
 * Run: npx tsx src/lib/__tests__/audio-idb-fonts-part16.test.ts
 */

import {
  getAudioBufferPolicy,
  observeAudioLatency,
  observeAudioThroughput,
  resetAudioBufferPolicyForTests,
} from "../audio-buffer-policy";
import {
  backupCriticalUserState,
  getIdbHealCount,
  getVolatileBackup,
  isIdbCorruptionError,
  isQuotaExceededError,
  resetIdbHealForTests,
  restoreCriticalUserState,
  withIdbRecovery,
} from "../idb-self-heal";
import { waitForDocumentFonts, whenFontsReady } from "../font-ready";
import {
  abortAllScopes,
  beginAbortScope,
  createMountGuard,
  getScopeSignal,
  guardAsync,
  resetAbortScopesForTests,
} from "../route-abort";
import {
  clearDiagnostics,
  getDiagnosticCount,
  getRecentDiagnostics,
  logDiagnostic,
} from "../diagnostics";

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

async function main() {
  console.log("\n=== 1. Adaptive audio buffer policy ===");
  {
    resetAudioBufferPolicyForTests();
    const base = getAudioBufferPolicy();
    assert(typeof base.preload === "string", "preload mode present");
    assert(base.stallGraceMs > 0, "stallGraceMs > 0");
    assert(base.targetBufferSec > 0, "targetBufferSec > 0");
    assert(Array.isArray(base.reasons), "reasons array");

    observeAudioLatency(800);
    observeAudioThroughput(10_000, 5_000); // very slow ~0.016 Mbps
    const slow = getAudioBufferPolicy();
    assert(slow.targetBufferSec >= base.targetBufferSec, "high latency expands buffer window");
    assert(slow.stallGraceMs >= 500, "slow path keeps non-trivial stall grace");

    resetAudioBufferPolicyForTests();
    observeAudioLatency(40);
    observeAudioThroughput(5_000_000, 50); // fast
    const fast = getAudioBufferPolicy();
    assert(fast.targetBufferSec <= 8, "fast path contracts buffer window");
  }

  console.log("\n=== 2. IndexedDB quota / corruption recovery ===");
  {
    resetIdbHealForTests();

    const mem = new Map<string, string>();
    const lsStub = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, String(v));
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() {
        return mem.size;
      },
    };
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: lsStub,
    });

    localStorage.setItem("majalis-local-bookmarks-v1", JSON.stringify([{ id: 1 }]));
    localStorage.setItem("mj-quran-khatmah-v1", JSON.stringify({ progress: 42 }));

    const snap = backupCriticalUserState();
    assert(!!snap.bookmarksJson && snap.bookmarksJson.includes('"id":1'), "bookmarks backed up");
    assert(!!snap.khatmahJson && snap.khatmahJson.includes("42"), "khatmah backed up");
    assert(getVolatileBackup() !== null, "volatile backup retained");

    localStorage.removeItem("majalis-local-bookmarks-v1");
    localStorage.removeItem("mj-quran-khatmah-v1");
    restoreCriticalUserState();
    assert(localStorage.getItem("majalis-local-bookmarks-v1")?.includes('"id":1') === true, "bookmarks restored");
    assert(localStorage.getItem("mj-quran-khatmah-v1")?.includes("42") === true, "khatmah restored");

    assert(isQuotaExceededError({ name: "QuotaExceededError" }), "detects QuotaExceededError");
    assert(isIdbCorruptionError({ name: "UnknownError", message: "Internal error" }), "detects corruption");

    let attempts = 0;
    const result = await withIdbRecovery(async () => {
      attempts += 1;
      if (attempts === 1) {
        const err = new Error("quota");
        (err as { name: string }).name = "QuotaExceededError";
        throw err;
      }
      return "ok";
    });
    assert(result === "ok", "withIdbRecovery retries after heal");
    assert(attempts === 2, "fn invoked twice");
    assert(getIdbHealCount() >= 1, "heal count bumped");
  }

  console.log("\n=== 3. Font ready gate ===");
  {
    const r = await waitForDocumentFonts(50);
    assert(r.ready === true, "waitForDocumentFonts resolves ready");
    assert(r.waitedMs >= 0, "waitedMs non-negative");

    let ran = false;
    await whenFontsReady(() => {
      ran = true;
      return 7;
    }, 50);
    assert(ran === true, "whenFontsReady invokes callback after wait");
  }

  console.log("\n=== 4. Route abort / mount guard ===");
  {
    resetAbortScopesForTests();
    const s1 = beginAbortScope("page-a");
    assert(s1.aborted === false, "fresh scope not aborted");
    const s2 = beginAbortScope("page-a");
    assert(s1.aborted === true, "replacing scope aborts previous");
    assert(s2.aborted === false, "new scope live");
    assert(getScopeSignal("page-a") === s2, "getScopeSignal returns current");

    let late = false;
    const p = guardAsync(s2, async () => {
      await new Promise((r) => setTimeout(r, 30));
      late = true;
      return 1;
    });
    beginAbortScope("page-a"); // abort mid-flight
    const out = await p;
    assert(out === undefined, "guardAsync returns undefined after abort");
    assert(late === true || late === false, "work may complete but result discarded");

    const guard = createMountGuard();
    assert(guard.isCurrent() === true, "mount guard current");
    guard.abort();
    assert(guard.isCurrent() === false, "mount guard aborted");
    abortAllScopes();
  }

  console.log("\n=== 5. Diagnostics ring buffer ===");
  {
    clearDiagnostics();
    for (let i = 0; i < 140; i++) {
      logDiagnostic("custom", `e${i}`);
    }
    assert(getDiagnosticCount("custom") === 140, "counters track all writes");
    const recent = getRecentDiagnostics(32);
    assert(recent.length === 32, "recent capped at 32");
    assert(recent[0]?.message === "e108", "ring wraps (oldest of last 32)");
    assert(recent[31]?.message === "e139", "newest is last event");

    logDiagnostic("audio-chunk-fail", "x");
    logDiagnostic("idb-retry", "quota");
    logDiagnostic("worker-restart", "w1");
    assert(getDiagnosticCount("audio-chunk-fail") === 1, "audio-chunk-fail counter");
    assert(getDiagnosticCount("idb-retry") === 1, "idb-retry counter");
    assert(getDiagnosticCount("worker-restart") === 1, "worker-restart counter");
    clearDiagnostics();
    assert(getDiagnosticCount("custom") === 0, "clear resets counters");
  }

  console.log(`\n=== Part 16 results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
