/**
 * Part 13 — Cross-tab locks, adaptive prefetch, Aho-Corasick search,
 * secure memory, viewport debounce.
 * Run: npx tsx src/lib/__tests__/multitab-prefetch-part13.test.ts
 */

import { AhoCorasick, bitmaskContains, buildAho, charBitmask } from "../aho-corasick";
import { arabicIncludes, buildNeedleAho, collectNeedleVariants } from "../arabic-search";
import { normalizeArabic } from "../../shared/arabic-normalize";
import {
  getPrefetchBudget,
  resetAdaptivePrefetchForTests,
  setBatteryForTests,
  shouldPrefetch,
} from "../adaptive-prefetch";
import {
  createTrackedObjectUrl,
  getTrackedObjectUrlCount,
  resetSecureMemoryForTests,
  revokeObjectUrl,
  zeroBytes,
  decodeBase64UrlToBytes,
} from "../secure-memory";
import { withTabLock, resetCrossTabLeaderForTests } from "../cross-tab-leader";
import { subscribeViewportSafe } from "../viewport-safe";

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
  console.log("\n=== 1. Aho-Corasick + bitwise prefilter ===");
  {
    const ac = buildAho(["صلاة", "زكاة", "صوم"]);
    assert(ac.hasAny("كتاب الصلاة المفروضة"), "AC finds صلاة");
    assert(!ac.hasAny("كتاب النحو"), "AC misses unrelated");

    const hay = charBitmask("بسم الله الرحمن الرحيم");
    const needle = charBitmask("الرحمن");
    assert(bitmaskContains(hay, needle), "bitmask subset true");
    assert(!bitmaskContains(charBitmask("بسم"), charBitmask("الرحمن")), "bitmask subset false");

    const t0 = performance.now();
    for (let i = 0; i < 200; i++) {
      arabicIncludes("إن الصلاة تنهى عن الفحشاء والمنكر", "الصلاة");
    }
    const ms = performance.now() - t0;
    assert(ms < 50, `200 arabicIncludes under 50ms (got ${ms.toFixed(1)}ms)`);
    assert(collectNeedleVariants("الصلاة").length >= 1, "needle variants non-empty");
    assert(arabicIncludes("إيتاء الزكاة", "زكاة"), "arabicIncludes زكاة in phrase");
    assert(buildNeedleAho("زكاة").hasAny(normalizeArabic("إيتاء الزكاة") || "زكاه"), "buildNeedleAho on normalized hay");
  }

  console.log("\n=== 2. Adaptive prefetch budget ===");
  {
    resetAdaptivePrefetchForTests();
    const base = getPrefetchBudget();
    assert(typeof base.allowAudioPrefetch === "boolean", "budget has audio flag");
    setBatteryForTests({ level: 0.1, charging: false });
    const low = getPrefetchBudget();
    assert(low.allowAudioPrefetch === false, "low battery disables audio prefetch");
    assert(shouldPrefetch("audio") === false, "shouldPrefetch audio false");
    setBatteryForTests({ level: 0.9, charging: true });
    // Without connection API in Node, unknown ect — audio may be allowed
    assert(typeof shouldPrefetch("text") === "boolean", "shouldPrefetch text boolean");
    resetAdaptivePrefetchForTests();
  }

  console.log("\n=== 3. Secure memory / object URLs ===");
  {
    resetSecureMemoryForTests();
    if (typeof URL.createObjectURL !== "function") {
      (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = () =>
        `blob:test-${Math.random()}`;
      (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = () => {};
    }
    const url = createTrackedObjectUrl(new Blob(["x"]));
    assert(getTrackedObjectUrlCount() === 1, "tracked url count 1");
    revokeObjectUrl(url);
    assert(getTrackedObjectUrlCount() === 0, "revoked");

    const bytes = decodeBase64UrlToBytes("AQID"); // 0x01 0x02 0x03
    assert(bytes.length === 3, "base64url decode length");
    zeroBytes(bytes);
    assert(bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 0, "zeroed bytes");
    resetSecureMemoryForTests();
  }

  console.log("\n=== 4. Cross-tab lock (soft fallback in Node) ===");
  {
    resetCrossTabLeaderForTests();
    // Minimal sessionStorage / BroadcastChannel stubs
    if (typeof sessionStorage === "undefined") {
      const store = new Map<string, string>();
      (globalThis as { sessionStorage: Storage }).sessionStorage = {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => {
          store.set(k, v);
        },
        removeItem: (k) => {
          store.delete(k);
        },
        clear: () => store.clear(),
        key: () => null,
        length: 0,
      } as Storage;
    }
    let ran = 0;
    await withTabLock("majalis:heavy-bg", async () => {
      ran += 1;
    });
    assert(ran === 1, "withTabLock executes body");
    resetCrossTabLeaderForTests();
  }

  console.log("\n=== 5. Viewport debounce ===");
  {
    if (typeof window === "undefined") {
      (globalThis as { window: Window }).window = {
        innerWidth: 400,
        innerHeight: 800,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        visualViewport: null,
      } as unknown as Window;
      (globalThis as { screen: Screen }).screen = {} as Screen;
    }
    let calls = 0;
    const sub = subscribeViewportSafe(() => {
      calls += 1;
    }, { debounceMs: 20 });
    // Manually we can't fire without listeners stored — just ensure subscribe returns
    assert(typeof sub.unsubscribe === "function", "viewport subscribe returns unsubscribe");
    sub.unsubscribe();
    assert(calls === 0, "no spurious emit without events");
  }

  console.log(`\n=== Part 13 results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
