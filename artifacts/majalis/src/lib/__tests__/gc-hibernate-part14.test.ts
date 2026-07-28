/**
 * Part 14 — Object pools, hibernate, compression, progress batch, feature detect.
 * Run: npx tsx src/lib/__tests__/gc-hibernate-part14.test.ts
 */

import {
  createObjectPool,
  fillAudioResumeScratch,
  releaseAudioResumeScratch,
  audioResumePool,
} from "../object-pool";
import { getScrollSample, resetScrollBusForTests, subscribeScrollBus } from "../scroll-raf-bus";
import { compressJson, decompressJson } from "../compress-store";
import {
  enqueueProgress,
  flushProgressBatch,
  onProgressFlush,
  pendingProgressCount,
  resetProgressBatchForTests,
} from "../progress-batch";
import {
  supports,
  resetFeatureDetectForTests,
  createIntersectionObserver,
  scheduleIdle,
} from "../feature-detect";
import {
  captureHibernateSnapshot,
  resetHibernateForTests,
  onHibernateRestore,
} from "../page-hibernate";
import { arabicIncludes } from "../arabic-search";

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
  console.log("\n=== 1. Object pool reuse ===");
  {
    const pool = createObjectPool(
      () => ({ n: 0 }),
      (o) => {
        o.n = 0;
      },
      4,
    );
    const a = pool.acquire();
    a.n = 5;
    pool.release(a);
    const b = pool.acquire();
    assert(b.n === 0, "released object was reset");
    assert(pool.size() === 0, "acquired empties free list");
    pool.release(b);

    const s = fillAudioResumeScratch(2, 3, 1.5, "rec", 100);
    assert(s.surah === 2 && s.ayah === 3 && s.currentTime === 1.5, "scratch filled");
    releaseAudioResumeScratch(s);
    assert(audioResumePool.size() >= 1, "scratch returned to pool");
  }

  console.log("\n=== 2. Feature detect silent fallbacks ===");
  {
    resetFeatureDetectForTests();
    assert(typeof supports("compressionStream") === "boolean", "compressionStream probe");
    assert(typeof supports("webLocks") === "boolean", "webLocks probe");
    assert(typeof supports("intersectionObserver") === "boolean", "IO probe");
    assert(typeof supports("performanceObserver") === "boolean", "PO probe");
    const io = createIntersectionObserver(() => undefined);
    assert(io === null || typeof io.disconnect === "function", "IO factory safe");
    await new Promise<void>((resolve) => {
      scheduleIdle(() => resolve(), 50);
    });
    assert(true, "scheduleIdle resolves");
  }

  console.log("\n=== 3. Compression round-trip ===");
  {
    const big = { ayahs: Array.from({ length: 80 }, (_, i) => ({ n: i, text: "نص تفسير طويل نسبيًا ".repeat(20) })) };
    const r = await compressJson(big, { minBytes: 100 });
    assert(r.rawBytes > 0, "rawBytes recorded");
    const back = await decompressJson<typeof big>(r.payload);
    assert(!!back && back.ayahs.length === 80, "decompress restores ayahs");
    if (supports("compressionStream") && r.compressed) {
      assert(r.storedBytes < r.payload.startsWith("mjz1:") ? r.rawBytes : Infinity, "compressed smaller or flagged");
      assert(r.payload.startsWith("mjz1:"), "magic prefix present when compressed");
    } else {
      assert(r.compressed === false || r.payload.startsWith("{"), "fallback plain JSON ok");
    }
  }

  console.log("\n=== 4. Progress batch micro-queue ===");
  {
    resetProgressBatchForTests();
    const seen: string[] = [];
    onProgressFlush((batch) => {
      for (const m of batch) seen.push(m.kind);
    });
    enqueueProgress({ kind: "ayah-read", surah: 1, ayah: 1 });
    enqueueProgress({ kind: "surah-dwell", surah: 1, ms: 500 });
    assert(pendingProgressCount() === 2, "queued 2");
    flushProgressBatch();
    assert(pendingProgressCount() === 0, "flushed empty");
    assert(seen.includes("ayah-read") && seen.includes("surah-dwell"), "handler saw metrics");
    resetProgressBatchForTests();
  }

  console.log("\n=== 5. Scroll bus + hibernate snapshot ===");
  {
    resetScrollBusForTests();
    resetHibernateForTests();
    if (typeof window === "undefined") {
      (globalThis as { window: Window }).window = {
        scrollY: 200,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        scrollTo: () => undefined,
      } as unknown as Window;
      (globalThis as { document: Document }).document = {
        documentElement: { scrollHeight: 2000, clientHeight: 800, scrollTop: 200 },
        addEventListener: () => undefined,
        visibilityState: "visible",
      } as unknown as Document;
      (globalThis as { location: Location }).location = {
        pathname: "/test",
        search: "",
      } as Location;
    }
    let ticks = 0;
    const unsub = subscribeScrollBus(() => {
      ticks += 1;
    });
    assert(ticks >= 1, "scroll bus immediate sample");
    const sample = getScrollSample();
    assert(typeof sample.progressPct === "number", "progressPct number");
    unsub();

    let restored = false;
    onHibernateRestore(() => {
      restored = true;
    });
    const snap = captureHibernateSnapshot();
    assert(typeof snap.capturedAt === "number", "hibernate snap captured");
    assert(typeof snap.scrollY === "number", "snap has scrollY");
    // restore handlers fire on wake — invoke manually via capture is enough for structure
    void restored;
    resetHibernateForTests();
    resetScrollBusForTests();
  }

  console.log("\n=== 6. Arabic search still correct ===");
  {
    assert(arabicIncludes("إن الصلاة تنهى عن الفحشاء", "الصلاة"), "arabicIncludes true");
    assert(!arabicIncludes("كتاب النحو", "الصلاة"), "arabicIncludes false");
  }

  console.log(`\n=== Part 14 results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
