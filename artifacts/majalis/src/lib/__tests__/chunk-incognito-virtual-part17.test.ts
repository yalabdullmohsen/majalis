/**
 * Part 17 — resumable Range downloads, private storage, scroll anchor,
 * sync backoff+jitter, journey performance marks.
 * Run: npx tsx src/lib/__tests__/chunk-incognito-virtual-part17.test.ts
 */

import {
  formatRangeHeader,
  parseContentRangeTotal,
  resumeByteOffset,
  downloadResumable,
  type PartialAssetStore,
} from "../resumable-range-download";
import {
  hybridGetItem,
  hybridSetItem,
  probePrivateStorage,
  resetPrivateStorageProbeForTests,
  getStorageModeSync,
} from "../private-storage-guard";
import {
  captureScrollAnchor,
  restoreScrollAnchor,
  scrollJumpExceeded,
  withScrollAnchorStability,
} from "../scroll-anchor-stability";
import {
  computeBackoffMs,
  runWithBackoff,
  resetSyncSchedulerForTests,
} from "../sync-backoff";
import {
  markJourneyStart,
  endJourney,
  JOURNEY_BUDGETS_MS,
  resetJourneyMarksForTests,
} from "../journey-perf";
import { readLocalJson, writeLocalJson } from "../safe-json";

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

function installStorageStubs() {
  const ls = new Map<string, string>();
  const ss = new Map<string, string>();
  const make = (map: Map<string, string>) =>
    ({
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, String(v));
      },
      removeItem: (k: string) => {
        map.delete(k);
      },
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() {
        return map.size;
      },
    }) as Storage;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: make(ls) });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: make(ss) });
  return { ls, ss };
}

async function main() {
  console.log("\n=== 1. Resumable Range helpers ===");
  {
    assert(formatRangeHeader(0, 511) === "bytes=0-511", "formatRangeHeader");
    assert(parseContentRangeTotal("bytes 0-511/2048") === 2048, "parseContentRangeTotal");
    assert(resumeByteOffset(1024) === 1024, "resumeByteOffset");

    const partials = new Map<string, Uint8Array>();
    const store: PartialAssetStore = {
      getPartial: async (k) => partials.get(k) ?? null,
      putPartial: async (k, b) => {
        partials.set(k, b);
      },
      clearPartial: async (k) => {
        partials.delete(k);
      },
    };

    // Fake Range-capable server
    const payload = new Uint8Array(1200);
    for (let i = 0; i < payload.length; i++) payload[i] = i % 256;
    let calls = 0;
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1;
      const method = (init?.method || "GET").toUpperCase();
      if (method === "HEAD") {
        return new Response(null, {
          status: 200,
          headers: {
            "accept-ranges": "bytes",
            "content-length": String(payload.length),
          },
        });
      }
      const range = (init?.headers as Record<string, string> | undefined)?.Range
        || (init?.headers instanceof Headers ? init.headers.get("Range") : null)
        || "";
      const m = /bytes=(\d+)-(\d+)/.exec(String(range));
      if (!m) {
        return new Response(payload, { status: 200 });
      }
      const start = parseInt(m[1], 10);
      const end = Math.min(parseInt(m[2], 10), payload.length - 1);
      const slice = payload.slice(start, end + 1);
      return new Response(slice, {
        status: 206,
        headers: {
          "content-range": `bytes ${start}-${end}/${payload.length}`,
          "content-type": "audio/mpeg",
        },
      });
    }) as typeof fetch;

    const blob = await downloadResumable("https://example.test/a.mp3", "a", store, {
      chunkSize: 400,
    });
    assert(blob.size === 1200, "full range download size");
    assert(calls >= 2, "used multiple range requests");
    assert(partials.size === 0, "partial cleared after complete");

    // Resume mid-way
    partials.set("b", payload.slice(0, 500));
    calls = 0;
    const blob2 = await downloadResumable("https://example.test/b.mp3", "b", store, {
      chunkSize: 400,
    });
    assert(blob2.size === 1200, "resumed download completes");
    assert(calls >= 1, "resume issued further range GETs");

    globalThis.fetch = origFetch;
  }

  console.log("\n=== 2. Private / hybrid storage ===");
  {
    resetPrivateStorageProbeForTests();
    installStorageStubs();
    const probe = await probePrivateStorage();
    assert(probe.localStorageOk === true, "LS probe ok");
    assert(probe.mode === "persistent" || probe.mode === "session-bridge", "mode classified");

    hybridSetItem("k1", "v1");
    assert(hybridGetItem("k1") === "v1", "hybrid round-trip");

    // Simulate LS failure → session bridge
    resetPrivateStorageProbeForTests();
    const { ss } = installStorageStubs();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new DOMException("QuotaExceededError");
        },
        removeItem: () => {
          throw new Error("blocked");
        },
        clear: () => undefined,
        key: () => null,
        length: 0,
      } as Storage,
    });
    const mode = hybridSetItem("bookmark", JSON.stringify([{ id: 1 }]));
    assert(mode === "session-bridge" || mode === "memory-only", "falls back when LS blocked");
    assert(hybridGetItem("bookmark")?.includes('"id":1') === true, "read from fallback");
    void ss;

    writeLocalJson("majalis-local-bookmarks-v1", [{ id: 9 }]);
    const bm = readLocalJson<{ id: number }[]>("majalis-local-bookmarks-v1", []);
    assert(bm[0]?.id === 9, "safe-json uses hybrid store");
  }

  console.log("\n=== 3. Scroll anchor stability ===");
  {
    // Minimal DOM stubs
    let scrollY = 100;
    const scrolling = { scrollHeight: 2000 };
    (globalThis as { window: unknown }).window = globalThis;
    Object.defineProperty(globalThis, "scrollY", {
      configurable: true,
      get: () => scrollY,
    });
    (globalThis as { pageYOffset?: number }).pageYOffset = 100;
    (globalThis as { scrollTo: (o: ScrollToOptions) => void }).scrollTo = (o) => {
      if (typeof o.top === "number") scrollY = o.top;
    };
    (globalThis as { document: Document }).document = {
      scrollingElement: scrolling as unknown as Element,
      documentElement: scrolling as unknown as HTMLElement,
    } as Document;

    const snap = captureScrollAnchor();
    assert(snap.scrollY === 100, "capture scrollY");
    scrolling.scrollHeight = 2500;
    restoreScrollAnchor(snap);
    // Allow double-rAF to flush if present
    await new Promise((r) => setTimeout(r, 30));
    assert(!scrollJumpExceeded(100, scrollY, 2) || scrollY === 100, "restore keeps position");

    let mutated = false;
    withScrollAnchorStability(() => {
      mutated = true;
    });
    assert(mutated, "withScrollAnchorStability runs mutate");
  }

  console.log("\n=== 4. Sync backoff + jitter ===");
  {
    resetSyncSchedulerForTests();
    const d0 = computeBackoffMs({ attempt: 0, baseMs: 1000, maxMs: 60_000, random: () => 0.5 });
    const d3 = computeBackoffMs({ attempt: 3, baseMs: 1000, maxMs: 60_000, random: () => 0.5 });
    assert(d0 === 500, "attempt0 full-jitter mid");
    assert(d3 === 4000, "attempt3 expands exponentially");
    assert(
      computeBackoffMs({ attempt: 20, baseMs: 1000, maxMs: 8_000, random: () => 1 }) === 8_000,
      "caps at maxMs",
    );

    let tries = 0;
    const sleeps: number[] = [];
    const result = await runWithBackoff(
      async () => {
        tries += 1;
        if (tries < 3) throw new Error("flaky");
        return "ok";
      },
      {
        maxAttempts: 4,
        baseMs: 10,
        maxMs: 100,
        random: () => 0,
        sleep: async (ms) => {
          sleeps.push(ms);
        },
      },
    );
    assert(result === "ok", "runWithBackoff eventually succeeds");
    assert(tries === 3, "retried twice then ok");
    assert(sleeps.length === 2, "slept between failures");
  }

  console.log("\n=== 5. Journey performance marks ===");
  {
    resetJourneyMarksForTests();
    assert(JOURNEY_BUDGETS_MS["audio-first-byte"] > 0, "audio budget defined");
    assert(JOURNEY_BUDGETS_MS["ttfv-interactive"] > 0, "ttfv budget defined");

    if (typeof performance !== "undefined" && typeof performance.mark === "function") {
      markJourneyStart("audio-first-byte");
      await new Promise((r) => setTimeout(r, 5));
      const m = endJourney("audio-first-byte", 10_000);
      assert(m != null && m.durationMs >= 0, "measureJourney returns duration");
      assert(m!.overBudget === false, "under generous budget");
    } else {
      assert(true, "performance API absent — skipped mark assertions");
    }

    void getStorageModeSync;
  }

  console.log(`\n=== Part 17 results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
