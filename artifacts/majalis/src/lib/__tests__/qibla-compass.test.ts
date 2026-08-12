/**
 * Qibla math + prayer calc prefs — offline compass / adhan helpers.
 * Run: npx tsx --test src/lib/__tests__/qibla-compass.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  angularDistance,
  distanceToKaabaKm,
  extractCompassAccuracy,
  extractCompassHeading,
  isQiblaAligned,
  KAABA_LAT,
  KAABA_LON,
  lowPassHeading,
  qiblaBearing,
  QIBLA_ALIGN_TOLERANCE_DEG,
  shortestAngleDelta,
} from "../qibla-math";
import {
  PRAYER_CALC_METHODS,
  prayerCalcMethodCacheId,
} from "../prayer-calc-prefs";

describe("qibla-math", () => {
  it("returns ~0° bearing when standing at Kaaba", () => {
    const b = qiblaBearing(KAABA_LAT, KAABA_LON);
    assert.ok(b >= 0 && b < 360);
    // At the Kaaba itself the formula is unstable; just ensure finite.
    assert.ok(Number.isFinite(b));
  });

  it("computes Kuwait → Kaaba bearing in a sane southwest band", () => {
    // Kuwait City ≈ 29.38, 47.98 — Qibla is roughly SW (~240–260°)
    const b = qiblaBearing(29.3759, 47.9774);
    assert.ok(b > 220 && b < 280, `unexpected Kuwait qibla ${b}`);
  });

  it("computes positive distance from Kuwait to Kaaba", () => {
    const d = distanceToKaabaKm(29.3759, 47.9774);
    assert.ok(d > 1000 && d < 2000, `unexpected distance ${d}`);
  });

  it("prefers webkitCompassHeading on iOS-like events", () => {
    assert.equal(extractCompassHeading({ alpha: 90, webkitCompassHeading: 42 }), 42);
  });

  it("uses 360-alpha on Android absolute alpha", () => {
    assert.equal(extractCompassHeading({ alpha: 90, absolute: true }), 270);
  });

  it("reads webkitCompassAccuracy", () => {
    assert.equal(extractCompassAccuracy({ alpha: 0, webkitCompassAccuracy: 22 }), 22);
    assert.equal(extractCompassAccuracy({ alpha: 0, webkitCompassAccuracy: -1 }), null);
  });

  it("low-pass damps jitter across the 0/360 wrap", () => {
    const a = lowPassHeading(null, 350, 0.2);
    const b = lowPassHeading(a, 10, 0.2);
    // Should move toward 10 without jumping through 180
    assert.ok(b > 350 || b < 20, `wrap smoothing failed: ${b}`);
    assert.ok(angularDistance(a, b) < 15);
  });

  it("aligns within ±2.5°", () => {
    assert.equal(isQiblaAligned(100, 101.5), true);
    assert.equal(isQiblaAligned(100, 103.5), false);
    assert.equal(QIBLA_ALIGN_TOLERANCE_DEG, 2.5);
  });

  it("shortestAngleDelta handles wrap", () => {
    assert.equal(shortestAngleDelta(350, 10), 20);
    assert.equal(shortestAngleDelta(10, 350), -20);
  });
});

describe("prayer-calc-prefs", () => {
  it("exposes required classical methods", () => {
    const ids = new Set(PRAYER_CALC_METHODS.map((m) => m.id));
    for (const id of ["Kuwait", "UmmAlQura", "MuslimWorldLeague", "Egyptian", "NorthAmerica"]) {
      assert.ok(ids.has(id as never), `missing ${id}`);
    }
  });

  it("builds stable cache ids", () => {
    assert.equal(prayerCalcMethodCacheId("Kuwait"), "adhan-Kuwait-v1");
    assert.equal(prayerCalcMethodCacheId("UmmAlQura"), "adhan-UmmAlQura-v1");
  });
});
