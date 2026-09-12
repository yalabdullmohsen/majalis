/**
 * بوابة P0 — ودجت سُنّة (مستوى البيانات فقط).
 * node --import tsx src/lib/__tests__/widgets-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Node has no localStorage — minimal polyfill for snapshot IO tests
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  } as Storage;
}

import type { PrayerTimesPayload } from "@/lib/prayer-times";
import {
  WIDGET_BRAND,
  WIDGET_PLATFORM_STACK,
  WIDGET_SCHEMA_VERSION,
  WIDGET_SURFACE_AUDIT,
  assertDeepLinkSafe,
  assertNoSecretsInSnapshot,
  buildMushafContinueSnapshot,
  buildNextPrayerSnapshot,
  clearWidgetBundles,
  deepLinkForMushafPage,
  deepLinkForWidgetType,
  getWidgetBundle,
  invalidateWidgetsForAccountChange,
  publishCoreWidgetSnapshots,
  resolveAccountScope,
  writeWidgetBundleAtomic,
} from "@/lib/widgets";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== Brand / platform ===");
assert.equal(WIDGET_BRAND, "سُنّة");
assert.equal(WIDGET_PLATFORM_STACK.productBrand, "سُنّة");
assert.equal(WIDGET_PLATFORM_STACK.runtime, "capacitor-webview");
assert.ok(WIDGET_SURFACE_AUDIT.some((s) => s.status === "active"));
assert.ok(WIDGET_SURFACE_AUDIT.some((s) => s.id.includes("home-screen")));

console.log("=== Static source wiring ===");
{
  const prayer = read("src/lib/widgets/prayer-snapshots.ts");
  assert.match(prayer, /@\/lib\/prayer-times/);
  assert.match(prayer, /@\/lib\/prayer-time-engine/);
  assert.doesNotMatch(prayer, /\bAdhan\b/);
  const mushaf = read("src/lib/widgets/mushaf-snapshots.ts");
  assert.match(mushaf, /quran-last-page/);
  assert.match(mushaf, /content-resolver/);
  const clearSrc = read("src/lib/clear-user-local-data.ts");
  assert.match(clearSrc, /sunnah-widget-/);
  assert.match(clearSrc, /invalidateWidgetsForAccountChange/);
}

console.log("=== Deep links ===");
{
  assert.ok(assertDeepLinkSafe(deepLinkForWidgetType("next_prayer")));
  assert.ok(assertDeepLinkSafe(deepLinkForMushafPage(12)));
  assert.equal(assertDeepLinkSafe({ path: "https://evil.example" }), false);
  assert.equal(assertDeepLinkSafe({ path: "/../etc" }), false);
}

console.log("=== Secrets ===");
assert.equal(assertNoSecretsInSnapshot('{"page":1}'), true);
assert.equal(assertNoSecretsInSnapshot('{"refresh_token":"x"}'), false);

console.log("=== Account scope ===");
assert.notEqual(resolveAccountScope("a"), resolveAccountScope("b"));
assert.equal(resolveAccountScope(null), "guest");

const sample: PrayerTimesPayload = {
  ok: true,
  city: "الكويت",
  timezone: "Asia/Kuwait",
  method: "Kuwait",
  source: "test",
  date: { gregorian: "2026-09-12", hijri: null, readable: null },
  prayers: [
    { key: "Fajr", name: "الفجر", obligatory: true, time24: "04:30", time: "٤:٣٠ ص", minutes: 270 },
    { key: "Sunrise", name: "الشروق", obligatory: false, time24: "05:45", time: "٥:٤٥ ص", minutes: 345 },
    { key: "Dhuhr", name: "الظهر", obligatory: true, time24: "11:48", time: "١١:٤٨ ص", minutes: 708 },
    { key: "Asr", name: "العصر", obligatory: true, time24: "15:20", time: "٣:٢٠ م", minutes: 920 },
    { key: "Maghrib", name: "المغرب", obligatory: true, time24: "18:05", time: "٦:٠٥ م", minutes: 1085 },
    { key: "Isha", name: "العشاء", obligatory: true, time24: "19:30", time: "٧:٣٠ م", minutes: 1170 },
  ],
  fetchedAt: new Date().toISOString(),
};

console.log("=== Next prayer snapshot ===");
{
  const snap = await buildNextPrayerSnapshot({
    payload: sample,
    now: new Date("2026-09-12T08:00:00+03:00"),
  });
  assert.equal(snap.schemaVersion, WIDGET_SCHEMA_VERSION);
  assert.equal(snap.fallbackState, "ok");
  assert.ok(snap.payload && "prayerKey" in snap.payload);
  assert.ok(assertDeepLinkSafe(snap.deepLink));
  assert.equal(snap.privacyLevel, "lock_safe");
}

console.log("=== Mushaf snapshot ===");
{
  const empty = await buildMushafContinueSnapshot({ page: null });
  assert.equal(empty.fallbackState, "no_progress");
  assert.equal(empty.privacyLevel, "account_private");
  const page = await buildMushafContinueSnapshot({ page: 42 });
  assert.equal(page.fallbackState, "ok");
  assert.equal((page.payload as { page: number }).page, 42);
}

console.log("=== Publish + invalidate ===");
{
  clearWidgetBundles();
  const next = await buildNextPrayerSnapshot({ payload: sample, userId: "u1" });
  const mushaf = await buildMushafContinueSnapshot({ page: 7, userId: "u1" });
  const written = writeWidgetBundleAtomic({
    schemaVersion: WIDGET_SCHEMA_VERSION,
    brand: WIDGET_BRAND,
    writtenAt: new Date().toISOString(),
    accountScope: resolveAccountScope("u1"),
    snapshots: [next, mushaf],
  });
  assert.equal(written.ok, true);
  assert.ok(getWidgetBundle());

  const pub = await publishCoreWidgetSnapshots({ userId: "u1" });
  assert.equal(pub.accountScope, resolveAccountScope("u1"));
  assert.ok(pub.snapshotCount >= 3);

  invalidateWidgetsForAccountChange();
  assert.equal(getWidgetBundle(), null);
}

console.log("=== No legacy brand strings ===");
for (const f of ["src/lib/widgets/types.ts", "src/lib/widgets/platform-audit.ts"]) {
  const src = read(f);
  assert.doesNotMatch(src, /مجلس\s*علم|MajlisIlm|majlisilm\.com/i);
  assert.match(src, /سُنّة/);
}
assert.match(read("src/lib/widgets/design-tokens.ts"), /sunnah-widget/);
assert.equal(WIDGET_BRAND, "سُنّة");

console.log("\nwidgets P0 gate: PASS");
