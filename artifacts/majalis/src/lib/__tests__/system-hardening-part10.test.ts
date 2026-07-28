/**
 * Part 10 — System hardening: mutex, quota emergency, battery, IDB guards.
 * Run: npx tsx src/lib/__tests__/system-hardening-part10.test.ts
 */

import { withMutex, resetMutexStateForTests } from "../async-mutex";
import { withHarmonyLock, coalesceAsync } from "../system-harmony";
import {
  isQuotaExceededError,
  enterQuotaEmergencyMode,
  isEphemeralCacheMode,
  setEphemeralCache,
  getEphemeralCache,
  resetQuotaEmergencyForTests,
  writeWithQuotaGuard,
} from "../quota-emergency";
import {
  getBatteryThrottleState,
  resetBatteryThrottleForTests,
  shouldDeferBackgroundWork,
} from "../battery-throttle";
import {
  isGuardedSurahDetail,
  isGuardedAudioResume,
  isGuardedFlashReview,
  guardIdbValue,
} from "../idb-payload-guards";
import { LruCache } from "../lru-cache";
import {
  isProtectedLocalStorageKey,
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

async function main() {
  console.log("\n=== 1. Named mutex serializes same lane ===");
  {
    resetMutexStateForTests();
    const order: number[] = [];
    await Promise.all([
      withMutex("audio-resume", async () => {
        order.push(1);
        await new Promise((r) => setTimeout(r, 20));
        order.push(2);
      }),
      withMutex("audio-resume", async () => {
        order.push(3);
        order.push(4);
      }),
    ]);
    assert(order.join(",") === "1,2,3,4", "same-lane mutex is serial (no interleave)");

    const parallel: string[] = [];
    await Promise.all([
      withMutex("audio-resume", async () => {
        parallel.push("a-start");
        await new Promise((r) => setTimeout(r, 15));
        parallel.push("a-end");
      }),
      withMutex("flashcard-sync", async () => {
        parallel.push("b");
      }),
    ]);
    assert(parallel.includes("b") && parallel.includes("a-start"), "different lanes run concurrently");
  }

  console.log("\n=== 2. Harmony lock + coalesce ===");
  {
    resetMutexStateForTests();
    let runs = 0;
    const bucket: { current: Promise<number> | null } = { current: null };
    const p1 = coalesceAsync(bucket, async () => {
      runs += 1;
      await new Promise((r) => setTimeout(r, 10));
      return runs;
    });
    const p2 = coalesceAsync(bucket, async () => {
      runs += 1;
      return runs;
    });
    const [a, b] = await Promise.all([p1, p2]);
    assert(a === b && runs === 1, "coalesceAsync dedupes concurrent factories");

    await withHarmonyLock("reading-pos", async () => 1);
    assert(true, "withHarmonyLock resolves");
  }

  console.log("\n=== 3. Quota emergency + ephemeral cache ===");
  {
    resetQuotaEmergencyForTests();
    assert(isQuotaExceededError({ name: "QuotaExceededError" }), "detects QuotaExceededError");
    assert(isQuotaExceededError({ code: 22 }), "detects legacy quota code 22");
    assert(!isQuotaExceededError(new Error("network")), "ignores non-quota errors");

    assert(isProtectedLocalStorageKey("majalis-quran-audio-resume-v1"), "audio resume is protected");
    assert(isProtectedLocalStorageKey("mj-quran-notes-v1"), "notes protected");

    await enterQuotaEmergencyMode("test");
    assert(isEphemeralCacheMode(), "ephemeral mode on after emergency");
    setEphemeralCache("tmp:prefetch", { x: 1 });
    assert(getEphemeralCache<{ x: number }>("tmp:prefetch")?.x === 1, "ephemeral map stores values");

    let writes = 0;
    const ok = await writeWithQuotaGuard(() => {
      writes += 1;
      if (writes === 1) {
        const err = new Error("quota");
        (err as { name: string }).name = "QuotaExceededError";
        throw err;
      }
      return true;
    });
    assert(ok && writes === 2, "writeWithQuotaGuard retries after emergency");
    resetQuotaEmergencyForTests();
  }

  console.log("\n=== 4. Battery throttle defaults ===");
  {
    resetBatteryThrottleForTests();
    const s = getBatteryThrottleState();
    assert(s.lowPower === false && s.deferBackground === false, "default battery state is normal");
    resetBatteryThrottleForTests({ deferBackground: true, lowPower: true });
    assert(shouldDeferBackgroundWork() === true, "shouldDeferBackgroundWork respects flag");
    resetBatteryThrottleForTests();
  }

  console.log("\n=== 5. IDB payload guards (no any) ===");
  {
    assert(
      isGuardedSurahDetail({
        number: 1,
        name: "الفاتحة",
        numberOfAyahs: 7,
        ayahs: [{ numberInSurah: 1, text: "بِسْمِ" }],
      }),
      "valid surah detail passes",
    );
    assert(!isGuardedSurahDetail({ number: 999, name: "x", numberOfAyahs: 1, ayahs: [] }), "invalid surah rejected");
    assert(
      isGuardedAudioResume({ surah: 2, ayah: 255, currentTime: 1.5, updatedAt: Date.now() }),
      "audio resume guard ok",
    );
    assert(!isGuardedAudioResume({ surah: 0, ayah: 1, currentTime: 0, updatedAt: 1 }), "bad surah rejected");
    assert(
      isGuardedFlashReview({
        key: "u::hadith:1",
        user_id: "u",
        card_type: "hadith",
        card_id: "1",
        next_review_at: new Date().toISOString(),
        interval_days: 1,
        ease_factor: 2.5,
        repetitions: 1,
      }),
      "flash review guard ok",
    );
    assert(guardIdbValue({ foo: 1 }, isGuardedAudioResume) === null, "guardIdbValue returns null on mismatch");
  }

  console.log("\n=== 6. LruCache bounds ===");
  {
    const c = new LruCache<string, number>(2);
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3);
    assert(c.get("a") === undefined && c.size === 2, "generic LruCache evicts LRU");
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

void main();
