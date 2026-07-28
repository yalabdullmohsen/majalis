/**
 * Part 18 — speculative prefetch, audio crossfade, vector GC, LWW/CRDT, yield budgets.
 * Run: npx tsx src/lib/__tests__/prefetch-audio-crdt-part18.test.ts
 */

import {
  resolvePrefetchTargets,
  speculativePrefetchHref,
  clearSpeculativePrefetchStateForTests,
} from "../speculative-prefetch";
import {
  lwwPick,
  stampLww,
  mergeKeyedByLww,
  mergeProgressMapsByLww,
  mergeVersionVectors,
  vvConcurrent,
  vvDominates,
  emptyVersionVector,
  bumpVersionVector,
  toUpdatedAtMs,
} from "../lww-crdt-sync";
import {
  detachVectorSubtree,
  flushDetachedVectors,
  revokeGraphicResources,
  resetVectorCleanupForTests,
} from "../vector-memory-cleanup";
import {
  mapWithTimeBudget,
  mapInChunks,
  yieldToMain,
} from "../yield-to-main";
import { attachAudioTransitionController } from "../audio-crossfade";

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
  console.log("\n=== 1. Speculative prefetch targets ===");
  {
    clearSpeculativePrefetchStateForTests();
    const surah = resolvePrefetchTargets("/mushaf/2");
    assert(surah.jsonUrls.some((u) => u.includes("surah-2")), "surah JSON target");
    assert(surah.importFactories.length >= 1, "surah import factory");

    const page = resolvePrefetchTargets("/mushaf/page/5");
    assert(page.jsonUrls.some((u) => u.includes("page-5")), "mushaf page JSON");

    const fiqh = resolvePrefetchTargets("/fiqh/tahara");
    assert(fiqh.importFactories.length >= 1, "fiqh import factory");

    const lib = resolvePrefetchTargets("/library/riyad");
    assert(lib.importFactories.length >= 1, "library import factory");

    // Smoke: speculativePrefetchHref should not throw without DOM fetch
    speculativePrefetchHref("/hadith");
    assert(true, "speculativePrefetchHref no-throw");
  }

  console.log("\n=== 2. Audio crossfade controller ===");
  {
    class FakeAudio {
      volume = 1;
      paused = true;
      src = "";
      playbackRate = 1;
      pause() {
        this.paused = true;
      }
      load() {
        /* noop */
      }
      play() {
        this.paused = false;
        return Promise.resolve();
      }
    }
    // No AudioContext in Node — volume fallback path
    const audio = new FakeAudio() as unknown as HTMLAudioElement;
    const ctrl = attachAudioTransitionController(audio);
    assert(ctrl.usingWebAudio() === false, "falls back without AudioContext");
    ctrl.silence();
    assert(audio.volume === 0, "silence sets volume 0");
    await ctrl.transitionTo("https://example.test/a.mp3", { playbackRate: 1.1 });
    assert(audio.src.includes("a.mp3"), "transitionTo sets src");
    assert(audio.volume === 1, "unsilence restores volume");
    ctrl.dispose();
    assert(true, "dispose safe");
  }

  console.log("\n=== 3. Vector memory cleanup ===");
  {
    resetVectorCleanupForTests();
    const host = {
      isConnected: false,
      firstChild: null as { remove?: () => void } | null,
      removeChild(child: unknown) {
        void child;
        this.firstChild = null;
      },
      children: [] as unknown[],
    };
    // Simulate children
    let kids = 2;
    Object.defineProperty(host, "firstChild", {
      get: () => (kids > 0 ? { id: kids } : null),
      configurable: true,
    });
    host.removeChild = () => {
      kids -= 1;
    };
    detachVectorSubtree(host as unknown as Element);
    assert(kids === 0, "detachVectorSubtree removes children");
    assert(flushDetachedVectors() === 0, "flush on empty queue");
    revokeGraphicResources(["blob:http://x/1", "https://x", null]);
    assert(true, "revokeGraphicResources no-throw");
  }

  console.log("\n=== 4. LWW / version-vector CRDT ===");
  {
    const a = stampLww({ n: 1 }, "tab-a");
    const b = stampLww({ n: 2 }, "tab-b", a.meta.vv);
    // Force remote newer
    b.meta.updatedAt = a.meta.updatedAt + 1000;
    const picked = lwwPick(a, b);
    assert(picked.value.n === 2, "LWW picks newer remote");

    const vv1 = bumpVersionVector(emptyVersionVector(), "a");
    const vv2 = bumpVersionVector(emptyVersionVector(), "b");
    assert(vvConcurrent(vv1, vv2), "independent actors are concurrent");
    assert(vvDominates(mergeVersionVectors(vv1, vv2), vv1), "merged dominates vv1");

    const local = [
      { id: "1", savedAt: "2026-01-01T00:00:00.000Z", v: "old" },
      { id: "2", savedAt: "2026-01-02T00:00:00.000Z", v: "keep" },
    ];
    const remote = [
      { id: "1", savedAt: "2026-01-03T00:00:00.000Z", v: "new" },
      { id: "2", savedAt: "2026-01-01T00:00:00.000Z", v: "stale" },
    ];
    const merged = mergeKeyedByLww(local, remote, {
      getKey: (x) => x.id,
      getUpdatedAt: (x) => toUpdatedAtMs(x.savedAt),
    });
    const m1 = merged.find((x) => x.id === "1");
    const m2 = merged.find((x) => x.id === "2");
    assert(m1?.v === "new", "id1 takes newer remote");
    assert(m2?.v === "keep", "id2 keeps newer local — no stale overwrite");

    const prog = mergeProgressMapsByLww(
      { hadith: { id: "a", at: "2026-01-01T00:00:00.000Z" } },
      {
        hadith: { id: "b", at: "2026-01-02T00:00:00.000Z" },
        qa: { id: "c", at: "2026-01-01T00:00:00.000Z" },
      },
    );
    assert(prog.hadith?.id === "b", "progress LWW");
    assert(prog.qa?.id === "c", "progress adds missing section");
  }

  console.log("\n=== 5. Time-budgeted yielding ===");
  {
    const items = Array.from({ length: 200 }, (_, i) => i);
    let yields = 0;
    const origSetTimeout = globalThis.setTimeout;
    // Count yieldToMain fallbacks via setTimeout(0) when no scheduler.yield
    const nums = await mapWithTimeBudget(
      items,
      (n) => n * 2,
      1, // tiny budget → many yields
    );
    assert(nums.length === 200 && nums[199] === 398, "mapWithTimeBudget preserves results");
    const chunked = await mapInChunks(items, 50, (n) => n + 1);
    assert(chunked[0] === 1 && chunked.length === 200, "mapInChunks ok");
    await yieldToMain();
    assert(true, "yieldToMain resolves");
    void yields;
    void origSetTimeout;
  }

  console.log(`\n=== Part 18 results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
