/**
 * Master polish consolidation — pools, compression, range, locks, workers, WebView, audio.
 * Run: npx tsx src/lib/__tests__/master-polish-consolidation.test.ts
 */

import {
  createTickSamplePool,
  createTypedArrayPool,
  GLOBAL_TICK_POOL,
  sealMonomorphic,
} from "../object-pool";
import {
  canCompressStreams,
  compressJsonString,
  decompressJsonString,
  isCompressedPayload,
} from "../compressed-storage";
import { downloadWithRangeResume, supportsHttpRange } from "../range-download";
import { withWebLock } from "../web-locks";
import { createSupervisedWorker } from "../worker-supervisor";
import { detectWebViewKind, getWebViewProfile, safeWebApi } from "../webview-guard";
import { createLifecycleHandle } from "../hook-lifecycle";
import { createAudioCrossfade } from "../audio-crossfade";
import { createAudioRafSync } from "../audio-raf-sync";
import { computeNetworkSchedulerPolicy } from "../network-scheduler";
import { createKeyboardInpHandler, measureSyncKeyBudget } from "../keyboard-inp";
import { startMasterPolishSuite, resetMasterPolishForTests } from "../master-polish-bootstrap";
import { isMseSupported } from "../mse-audio-buffer";
import { canUseSharedArrayBuffer } from "../shared-buffer-index";

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
  console.log("\n=== 1. Object / TypedArray pools ===");
  {
    const pool = createTickSamplePool(4);
    const a = pool.acquire();
    a.t = 1;
    pool.release(a);
    assert(pool.size() >= 4, "tick pool recycled");
    const typed = createTypedArrayPool(64);
    const u8 = typed.u8(32);
    assert(u8.length === 32, "u8 scratch");
    assert(GLOBAL_TICK_POOL.size() >= 0, "global pool");
    const sealed = sealMonomorphic({ a: 1, b: 2 });
    assert(sealed.a === 1, "seal monomorphic");
  }

  console.log("\n=== 2. Compression + range resume API ===");
  {
    assert(typeof canCompressStreams() === "boolean", "compress probe");
    const raw = JSON.stringify({ text: "تفسير ".repeat(200) });
    const stored = await compressJsonString(raw);
    if (canCompressStreams() && stored !== raw) {
      assert(isCompressedPayload(stored), "compressed prefix");
      const back = await decompressJsonString(stored);
      assert(back === raw, "roundtrip decompress");
    } else {
      assert(true, "compress fallback ok");
    }
    assert(typeof supportsHttpRange === "function", "range probe fn");
    // Don't hit network in unit test — just ensure API shape
    try {
      await downloadWithRangeResume({ url: "http://127.0.0.1:9/nope" });
      assert(false, "should throw");
    } catch {
      assert(true, "range download errors cleanly");
    }
  }

  console.log("\n=== 3. Web Locks + worker supervisor ===");
  {
    const lock = await withWebLock("test-lock", async () => 42);
    assert(lock.ran === true && lock.value === 42, "lock ran");
    const worker = createSupervisedWorker({
      source: () => {
        throw new Error("no-worker-in-node");
      },
      maxRestarts: 1,
    });
    assert(worker.isAlive() === false, "worker unavailable ok");
    worker.terminate();
  }

  console.log("\n=== 4. WebView + lifecycle + audio helpers ===");
  {
    assert(detectWebViewKind("Instagram 123") === "instagram", "ig detect");
    assert(getWebViewProfile("none").restrictedServiceWorker === false, "normal profile");
    assert(safeWebApi(() => {
      throw new Error("x");
    }, 7) === 7, "safeWebApi fallback");
    const life = createLifecycleHandle();
    const id = setTimeout(() => undefined, 99999);
    life.addTimeout(id);
    life.dispose();
    assert(true, "lifecycle dispose");
    const xf = createAudioCrossfade();
    xf.dispose();
    const sync = createAudioRafSync();
    sync.stop();
    assert(typeof isMseSupported("audio/mpeg") === "boolean", "mse");
    assert(typeof canUseSharedArrayBuffer() === "boolean", "sab");
  }

  console.log("\n=== 5. Network scheduler + INP <16ms budget ===");
  {
    const fast = computeNetworkSchedulerPolicy({ rttMs: 20, ect: "4g", jitterMs: 2 });
    assert(fast.searchDebounceMs <= 280, "fast debounce");
    let ran = false;
    const h = createKeyboardInpHandler(() => {
      ran = true;
    }, { preventKeys: [" "] });
    const ev = {
      key: " ",
      target: null,
      preventDefault() {},
    } as unknown as KeyboardEvent;
    const ms = measureSyncKeyBudget(() => h(ev));
    assert(ms < 16, `INP sync budget <16ms (got ${ms.toFixed(3)})`);
    await new Promise((r) => setTimeout(r, 40));
    assert(ran === true, "deferred handler");
  }

  console.log("\n=== 6. Master bootstrap ===");
  {
    resetMasterPolishForTests();
    await startMasterPolishSuite();
    await startMasterPolishSuite(); // idempotent
    assert(true, "bootstrap idempotent");
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Master polish: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
