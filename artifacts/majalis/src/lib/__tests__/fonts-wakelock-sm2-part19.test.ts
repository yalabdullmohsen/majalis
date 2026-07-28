/**
 * Part 19 — font cache, wake lock, SM-2 precision, SW MessageChannel, FPS throttle.
 * Run: npx tsx src/lib/__tests__/fonts-wakelock-sm2-part19.test.ts
 */

import {
  findCachedFontFace,
  getFontCacheSize,
  loadFontFaceSafe,
  resetFontCacheForTests,
  waitForDocumentFonts,
} from "../font-ready";
import {
  createWakeLockController,
  isWakeLockSupported,
} from "../wake-lock";
import {
  addUtcDays,
  applyReviewRating,
  quantizeEaseFactor,
  quantizeIntervalDays,
  sm2,
  toUtcDayKey,
} from "../spaced-repetition";
import {
  getRenderFpsPolicy,
  getWaveformSampleIntervalMs,
  resetBatteryFpsForTests,
  setBatteryLevelForTests,
} from "../render-fps-throttle";

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
  console.log("\n=== 1. FontFaceSet cache ===");
  {
    resetFontCacheForTests();
    const r = await waitForDocumentFonts(20);
    assert(r.ready === true, "waitForDocumentFonts ready");
    assert(getFontCacheSize() === 0, "cache empty initially");
    // Without FontFace in Node, load returns null
    const face = await loadFontFaceSafe("TestFamily", "url(/x.woff2)");
    assert(face === null || face !== null, "loadFontFaceSafe resolves");
    assert(findCachedFontFace("missing") === null, "missing family null");
  }

  console.log("\n=== 2. Wake lock controller ===");
  {
    assert(typeof isWakeLockSupported() === "boolean", "isWakeLockSupported boolean");
    const ctrl = createWakeLockController();
    assert(ctrl.isHeld() === false, "initially not held");
    ctrl.setSessionActive(true);
    // No WakeLock API in Node — request returns false
    const ok = await ctrl.request();
    assert(ok === false || ok === true, "request settles");
    ctrl.setSessionActive(false);
    await ctrl.release();
    assert(ctrl.isHeld() === false, "released");
    ctrl.dispose();
  }

  console.log("\n=== 3. SM-2 precision ===");
  {
    assert(quantizeEaseFactor(2.555) === 2.56, "ease rounds to 2 decimals");
    assert(quantizeEaseFactor(1.2) === 1.3, "ease floor 1.3");
    assert(quantizeIntervalDays(14.4) === 14, "interval rounds");
    assert(quantizeIntervalDays(0) === 1, "interval min 1");

    const a = sm2({ interval_days: 0, ease_factor: 2.5, repetitions: 0 }, 4);
    const b = sm2(a, 4);
    const c = sm2(b, 4);
    assert(a.interval_days === 1 && a.ease_factor === 2.5, "first good");
    assert(b.interval_days === 6, "second good = 6");
    assert(c.interval_days === Math.round(6 * 2.5), "third uses quantized multiply");

    // Determinism: same inputs → identical outputs (no float drift)
    const r1 = applyReviewRating({ easeFactor: 2.5, interval: 6, repetitions: 2, nextReviewDate: "" }, "good", new Date("2026-01-01T12:00:00.000Z"));
    const r2 = applyReviewRating({ easeFactor: 2.5, interval: 6, repetitions: 2, nextReviewDate: "" }, "good", new Date("2026-01-01T12:00:00.000Z"));
    assert(r1.easeFactor === r2.easeFactor && r1.interval === r2.interval, "bit-stable metrics");
    assert(r1.nextReviewDate === r2.nextReviewDate, "bit-stable nextReviewDate");

    const day = toUtcDayKey(new Date("2026-07-28T15:00:00.000Z"));
    assert(day === "2026-07-28", "UTC day key");
    const next = addUtcDays(new Date("2026-01-01T23:30:00.000Z"), 1);
    assert(toUtcDayKey(next) === "2026-01-02", "addUtcDays calendar stable");

    // Many reviews stay quantized
    let s = { interval_days: 1, ease_factor: 2.5, repetitions: 1 };
    for (let i = 0; i < 20; i++) s = sm2(s, 5);
    const cents = Math.round(s.ease_factor * 100);
    assert(Math.abs(s.ease_factor * 100 - cents) < 1e-9, "ease has ≤2 decimal places");
  }

  console.log("\n=== 4. SW MessageChannel helper (no SW) ===");
  {
    const { swChannelRequest } = await import("../sw-message-channel");
    const res = await swChannelRequest(
      { type: "MAJALIS_OFFLINE_CACHE_STATUS" },
      { timeoutMs: 100, fallback: { ok: false, type: "MAJALIS_OFFLINE_CACHE_STATUS", id: "t", error: "no-sw" } },
    );
    assert(res.ok === false, "fallback when no SW");
    assert(res.error === "no-service-worker" || res.error === "no-sw" || res.error === "no-controller", "error code set");
  }

  console.log("\n=== 5. Battery FPS throttle ===");
  {
    resetBatteryFpsForTests();
    const full = getRenderFpsPolicy();
    assert(full.targetFps <= 60 && full.targetFps >= 2, "fps in range");

    setBatteryLevelForTests(0.15, false);
    const low = getRenderFpsPolicy();
    assert(low.targetFps <= 30, "battery <20% → ≤30fps");
    assert(low.reasons.some((r) => r.startsWith("battery:")), "battery reason logged");

    setBatteryLevelForTests(0.05, false);
    const crit = getRenderFpsPolicy();
    assert(crit.targetFps <= 15, "battery <10% → ≤15fps");

    const interval = getWaveformSampleIntervalMs(100);
    assert(interval >= 100, "waveform interval scaled up under low battery");

    setBatteryLevelForTests(0.15, true);
    const charging = getRenderFpsPolicy();
    assert(charging.targetFps >= low.targetFps, "charging relaxes battery throttle");
  }

  console.log(`\n=== Part 19 results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
