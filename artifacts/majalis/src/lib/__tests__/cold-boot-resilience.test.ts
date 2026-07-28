/**
 * Part 4 — cold-boot / audio retry / deep-link / debounce suite.
 * Run: pnpm --filter @workspace/majalis run test:cold-boot-resilience
 */
import assert from "node:assert/strict";
import { audioBackoffMs, decideAudioRetry } from "../audio-retry.ts";
import {
  clampAyah,
  clampSurah,
  parsePositiveInt,
  safeDecodeURIComponent,
  safeSearchParams,
} from "../url-param-safe.ts";
import { buildAyahDeepLink, parseDeepLink } from "../smart-deep-link.ts";
import {
  beginProtectedSession,
  endProtectedSession,
  isProtectedSession,
} from "../protected-session.ts";
import { scheduleIdle } from "../idle-defer.ts";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      passed += 1;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${name}`);
      console.error(err);
    }
  })();
}

console.log("\n=== Audio retry ===");
await test("backoff grows and caps", () => {
  const a0 = audioBackoffMs(0, 300, 5_000);
  const a5 = audioBackoffMs(5, 300, 5_000);
  assert.ok(a0 >= 200 && a0 <= 400);
  assert.ok(a5 <= 5_000);
});

await test("NotAllowedError never retries", () => {
  const d = decideAudioRetry({ name: "NotAllowedError" }, 0, 3);
  assert.equal(d.action, "fail");
});

await test("network errors retry", () => {
  const d = decideAudioRetry(new Error("network"), 0, 3);
  assert.equal(d.action, "retry");
  if (d.action === "retry") assert.ok(d.delayMs > 0);
});

await test("max attempts fail", () => {
  assert.equal(decideAudioRetry(new Error("x"), 3, 3).action, "fail");
});

console.log("\n=== URL param safety ===");
await test("parsePositiveInt clamps", () => {
  assert.equal(parsePositiveInt("abc", { fallback: 1 }), 1);
  assert.equal(parsePositiveInt("999", { min: 1, max: 114 }), 114);
  assert.equal(parsePositiveInt("-3", { min: 1, max: 10 }), 1);
});

await test("clamp surah/ayah", () => {
  assert.equal(clampSurah(0), 1);
  assert.equal(clampSurah(200), 114);
  assert.equal(clampAyah(1, 99), 7); // Fatiha has 7
  assert.equal(clampAyah(2, 255), 255);
  assert.equal(clampAyah(2, 9999), 286);
});

await test("safe decode / search params", () => {
  assert.equal(safeDecodeURIComponent("%E1"), "%E1"); // malformed → raw
  assert.equal(safeSearchParams("?ayah=2").get("ayah"), "2");
});

console.log("\n=== Deep link hardening ===");
await test("out-of-bound ayah clamps", () => {
  const p = parseDeepLink("/mushaf/1?ayah=999");
  assert.equal(p?.kind, "ayah");
  assert.equal(p?.resourceId, "1");
  assert.equal(p?.anchor, 7);
});

await test("invalid surah string safe", () => {
  const p = parseDeepLink("/mushaf/999?ayah=1");
  assert.equal(p?.resourceId, "114");
  assert.equal(buildAyahDeepLink(999, -5), "/mushaf/114?ayah=1");
});

await test("malformed hash does not throw", () => {
  const p = parseDeepLink({ pathname: "/mushaf/18", search: "", hash: "#ayah-NaN" });
  assert.equal(p?.kind, "ayah");
  assert.equal(p?.resourceId, "18");
  assert.equal(p?.anchor, undefined);
});

console.log("\n=== Protected session ===");
await test("begin/end session flag", () => {
  // shim window
  if (typeof globalThis.window === "undefined") {
    (globalThis as unknown as { window: typeof globalThis }).window = globalThis as unknown as Window &
      typeof globalThis;
  }
  const w = globalThis.window as unknown as {
    addEventListener?: typeof window.addEventListener;
    dispatchEvent?: typeof window.dispatchEvent;
    removeEventListener?: typeof window.removeEventListener;
  };
  if (typeof w.addEventListener !== "function") {
    w.addEventListener = () => undefined;
    w.removeEventListener = () => undefined;
    w.dispatchEvent = () => true;
  }
  endProtectedSession();
  assert.equal(isProtectedSession(), false);
  beginProtectedSession("quran-audio");
  assert.equal(isProtectedSession(), true);
  endProtectedSession();
  assert.equal(isProtectedSession(), false);
});

console.log("\n=== Idle defer ===");
await test("scheduleIdle cancelable", async () => {
  let ran = false;
  const h = scheduleIdle(() => {
    ran = true;
  }, { timeoutMs: 50 });
  h.cancel();
  await new Promise((r) => setTimeout(r, 80));
  assert.equal(ran, false);
});

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
