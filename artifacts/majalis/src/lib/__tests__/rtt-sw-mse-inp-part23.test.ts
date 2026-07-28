/**
 * Part 23 — network scheduler, SW lifecycle, SAB index, MSE, keyboard INP.
 * Run: npx tsx src/lib/__tests__/rtt-sw-mse-inp-part23.test.ts
 */

import {
  computeNetworkSchedulerPolicy,
  observeNetworkRtt,
  resetNetworkSchedulerForTests,
  getNetworkSchedulerPolicy,
} from "../network-scheduler";
import {
  flushClientStateForSwUpdate,
  getSwTransitionPhase,
  handleControllerChangeSeamless,
  resetSwLifecycleForTests,
} from "../sw-lifecycle-guard";
import {
  canUseSharedArrayBuffer,
  indexSearchSync,
  runConcurrentIndex,
} from "../shared-buffer-index";
import {
  evictPlayedSourceBufferRange,
  isMseSupported,
  isQuotaExceededError,
} from "../mse-audio-buffer";
import {
  createKeyboardInpHandler,
  measureSyncKeyBudget,
} from "../keyboard-inp";

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
  console.log("\n=== 1. Network RTT scheduler ===");
  {
    resetNetworkSchedulerForTests();
    const fast = computeNetworkSchedulerPolicy({
      rttMs: 30,
      jitterMs: 5,
      ect: "4g",
      saveData: false,
      downlink: 20,
    });
    assert(fast.searchDebounceMs <= 280, `fast debounce ≤280 (got ${fast.searchDebounceMs})`);
    assert(fast.requestBatchSize >= 8, "fast batch ≥8");
    assert(fast.audioPrefetchCount >= 2, "fast prefetch ≥2");

    const slow = computeNetworkSchedulerPolicy({
      rttMs: 500,
      jitterMs: 120,
      ect: "2g",
      saveData: false,
    });
    assert(slow.searchDebounceMs >= 500, "slow debounce ≥500");
    assert(slow.requestBatchSize <= 2, "slow batch ≤2");
    assert(slow.audioPrefetchCount === 0, "slow prefetch 0");

    observeNetworkRtt(100);
    observeNetworkRtt(200);
    const live = getNetworkSchedulerPolicy();
    assert(live.rttMs != null && live.rttMs > 0, "ewma rtt tracked");
    assert(live.jitterMs >= 0, "jitter tracked");
  }

  console.log("\n=== 2. SW lifecycle guard ===");
  {
    resetSwLifecycleForTests();
    assert(getSwTransitionPhase() === "idle", "phase idle");
    flushClientStateForSwUpdate();
    assert(getSwTransitionPhase() === "flushing", "phase flushing");
    let reloaded = false;
    handleControllerChangeSeamless({
      hadController: true,
      forceReload: true,
      reload: () => {
        reloaded = true;
      },
    });
    await new Promise((r) => setTimeout(r, 10));
    assert(reloaded === true, "seamless reload invoked after flush");
    handleControllerChangeSeamless({
      hadController: false,
      forceReload: true,
      reload: () => {
        reloaded = false;
      },
    });
    assert(getSwTransitionPhase() === "soft-ready", "first install no bounce");
  }

  console.log("\n=== 3. SharedArrayBuffer / clone fallback ===");
  {
    assert(typeof canUseSharedArrayBuffer() === "boolean", "sab probe boolean");
    const syncHits = indexSearchSync(
      ["بسم الله الرحمن الرحيم", "الحمد لله", "قل هو الله أحد"],
      "الله",
      10,
    );
    assert(syncHits.length >= 2, "sync index hits");
    const result = await runConcurrentIndex({
      id: "t1",
      items: Array.from({ length: 500 }, (_, i) => `نص رقم ${i} فيه كلمة بحث`),
      query: "بحث",
    });
    assert(result.mode === "structured-clone" || result.mode === "shared-buffer", "mode set");
    assert(result.hits.length > 0, "concurrent hits");
  }

  console.log("\n=== 4. MSE helpers ===");
  {
    assert(typeof isMseSupported("audio/mpeg") === "boolean", "mse support probe");
    assert(isQuotaExceededError({ name: "QuotaExceededError" }) === true, "quota detect");
    assert(isQuotaExceededError({ name: "Other" }) === false, "non-quota");
    // Fake SourceBuffer-like — eviction no-ops safely when updating
    const fake = {
      updating: true,
      buffered: { length: 0 },
      remove: () => undefined,
    } as unknown as SourceBuffer;
    assert(evictPlayedSourceBufferRange(fake, 60, 30) === false, "skip while updating");
  }

  console.log("\n=== 5. Keyboard INP pipeline ===");
  {
    let deferred = false;
    let prevented = false;
    const handler = createKeyboardInpHandler(
      () => {
        deferred = true;
      },
      { preventKeys: ["ArrowLeft"] },
    );
    const fakeEvent = {
      key: "ArrowLeft",
      target: null,
      preventDefault() {
        prevented = true;
      },
    } as unknown as KeyboardEvent;
    const budget = measureSyncKeyBudget(() => handler(fakeEvent));
    assert(prevented === true, "preventDefault sync");
    assert(budget < 30, `sync budget <30ms (got ${budget.toFixed(2)})`);
    await new Promise((r) => setTimeout(r, 30));
    assert(deferred === true, "handler deferred");
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Part 23: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
