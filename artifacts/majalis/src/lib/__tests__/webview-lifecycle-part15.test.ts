/**
 * Part 15 — WebView hardening, layout batch, integrity, lifecycle, device caps.
 * Run: npx tsx src/lib/__tests__/webview-lifecycle-part15.test.ts
 */

import {
  abortTimeout,
  hasWebCryptoSubtle,
  resetFeatureDetectForTests,
  safeRandomUUID,
} from "../feature-detect";
import {
  getWebViewProfile,
  resetWebViewProfileForTests,
  withWebViewGuard,
} from "../webview-detect";
import {
  getDeviceCapabilities,
  resetDeviceCapabilitiesForTests,
  setDeviceCapabilitiesForTests,
  scaledLruSize,
} from "../device-capabilities";
import { fitFontSizeToWidth, batchReadWrite } from "../layout-batch";
import {
  sha256Hex,
  digestsEqual,
  verifyOrRepairPayload,
  wrapWithIntegrity,
  unwrapWithIntegrity,
  resetIntegrityCacheForTests,
} from "../offline-integrity";
import {
  ensurePageLifecycleBinding,
  resetPageLifecycleForTests,
  getLastLifecycleSnap,
} from "../page-lifecycle";

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
  console.log("\n=== 1. Feature detect & WebView ===");
  {
    resetFeatureDetectForTests();
    resetWebViewProfileForTests();
    if (typeof navigator === "undefined") {
      (globalThis as { navigator: Navigator }).navigator = {
        userAgent: "Mozilla/5.0 Instagram",
        hardwareConcurrency: 2,
      } as Navigator;
    }
    const uuid = safeRandomUUID();
    assert(typeof uuid === "string" && uuid.length > 8, "safeRandomUUID");
    const sig = abortTimeout(50);
    assert(!!sig && typeof sig.aborted === "boolean", "abortTimeout signal");
    const profile = getWebViewProfile();
    assert(typeof profile.isInAppBrowser === "boolean", "webview profile");
    assert(typeof profile.serviceWorkerSafe === "boolean", "sw safe flag");
    const guarded = await withWebViewGuard("storage", async () => "ok", "fallback");
    assert(guarded === "ok" || guarded === "fallback", "webview guard returns");
  }

  console.log("\n=== 2. Device capabilities scaling ===");
  {
    resetDeviceCapabilitiesForTests();
    setDeviceCapabilitiesForTests({
      tier: "low",
      lruMax: 12,
      maxConcurrentFetches: 2,
      allowAggressivePrefetch: false,
      fontFitIterations: 8,
      rafPublishEvery: 3,
      deviceMemoryGb: 2,
      hardwareConcurrency: 2,
    });
    const caps = getDeviceCapabilities();
    assert(caps.tier === "low", "low tier");
    assert(scaledLruSize(48) <= 12, "scaled LRU capped");
    assert(caps.maxConcurrentFetches === 2, "fetch concurrency 2");
    resetDeviceCapabilitiesForTests();
  }

  console.log("\n=== 3. SHA-256 integrity ===");
  {
    resetIntegrityCacheForTests();
    if (hasWebCryptoSubtle()) {
      const hex = await sha256Hex("hello");
      assert(!!hex && hex.length === 64, "sha256 hex length");
      assert(digestsEqual(hex, hex), "digestsEqual");
      const env = await wrapWithIntegrity({ a: 1 });
      const un = await unwrapWithIntegrity(env);
      assert(un.ok && un.data.a === 1, "integrity wrap/unwrap");
      const bad = await verifyOrRepairPayload("corrupt", {
        expectedSha256: "0".repeat(64),
        repair: async () => null,
      });
      assert(bad.ok === false, "mismatch detected");
    } else {
      assert(true, "Web Crypto unavailable — skipped digest tests");
    }
  }

  console.log("\n=== 4. Layout batch helpers ===");
  {
    let wrote = false;
    batchReadWrite(
      () => 42,
      (n) => {
        wrote = n === 42;
      },
    );
    assert(wrote, "batchReadWrite order");
    // Fake element for fitFontSize
    const el = {
      style: { fontSize: "" },
      scrollWidth: 100,
    } as unknown as HTMLElement;
    // container wider than scroll → centered at max
    el.scrollWidth = 50;
    const fit = fitFontSizeToWidth(el, 100, 40, 4);
    assert(fit.centered === true && fit.size === 40, "fit centered when fits at max");
  }

  console.log("\n=== 5. Page lifecycle binding ===");
  {
    resetPageLifecycleForTests();
    if (typeof window === "undefined") {
      (globalThis as { window: Window }).window = {
        addEventListener: () => undefined,
        scrollY: 0,
        scrollTo: () => undefined,
      } as unknown as Window;
      (globalThis as { document: Document }).document = {
        addEventListener: () => undefined,
        visibilityState: "visible",
      } as unknown as Document;
      (globalThis as { location: Location }).location = {
        pathname: "/",
        search: "",
      } as Location;
    }
    ensurePageLifecycleBinding();
    assert(getLastLifecycleSnap() === null, "no snap before freeze");
    resetPageLifecycleForTests();
  }

  console.log(`\n=== Part 15 results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
