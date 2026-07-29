/**
 * iOS / Capacitor stability unit tests — deep links + prayer ticker.
 * Run: npx tsx src/lib/__tests__/ios-stability-audit.test.ts
 */
import assert from "node:assert/strict";
import {
  resolveNativeDeepLinkPath,
  shouldNavigateNativeDeepLink,
} from "../native-deep-link";
import {
  computePrayerTicker,
  formatDurationAr,
  recommendedTickMs,
  type PrayerSlot,
} from "../prayer-ticker";

let passed = 0;
let failed = 0;

function check(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== native deep links ===");

check(
  resolveNativeDeepLinkPath("https://majlisilm.com/prayer-times") === "/prayer-times",
  "https universal link path",
);
check(
  resolveNativeDeepLinkPath("https://majlisilm.com/lessons/abc?x=1#y") === "/lessons/abc?x=1#y",
  "https keeps search+hash",
);
check(
  resolveNativeDeepLinkPath("majlisilm://prayer-times") === "/prayer-times",
  "custom scheme host-as-path",
);
check(
  resolveNativeDeepLinkPath("majlisilm:///mushaf") === "/mushaf",
  "custom scheme triple-slash",
);
check(
  resolveNativeDeepLinkPath("majlisilm://fiqh/topics/tahara") === "/fiqh/topics/tahara",
  "custom scheme with nested path",
);
check(
  resolveNativeDeepLinkPath("majlisilm://evil/../etc/passwd") === null,
  "blocks path traversal",
);
check(resolveNativeDeepLinkPath("not-a-url") === null, "rejects invalid URL");
check(resolveNativeDeepLinkPath("ftp://majlisilm.com/x") === null, "rejects unknown scheme");
check(
  shouldNavigateNativeDeepLink("/prayer-times", "/prayer-times") === false,
  "skip navigate when already there",
);
check(
  shouldNavigateNativeDeepLink("/mushaf", "/prayer-times") === true,
  "navigate when path differs",
);

console.log("\n=== prayer ticker ===");

const base = new Date("2026-07-29T11:00:00+03:00");
const slots: PrayerSlot[] = [
  { key: "fajr", nameAr: "الفجر", at: new Date("2026-07-29T04:10:00+03:00") },
  { key: "dhuhr", nameAr: "الظهر", at: new Date("2026-07-29T11:10:00+03:00") },
  { key: "asr", nameAr: "العصر", at: new Date("2026-07-29T15:00:00+03:00") },
  { key: "maghrib", nameAr: "المغرب", at: new Date("2026-07-29T18:30:00+03:00") },
  { key: "isha", nameAr: "العشاء", at: new Date("2026-07-29T20:00:00+03:00") },
];

const countdown = computePrayerTicker(slots, base);
check(countdown?.mode === "countdown", "15m pre-adhan → countdown");
check(countdown?.active.key === "dhuhr", "countdown targets dhuhr");
check((countdown?.ms ?? 0) === 10 * 60 * 1000, "countdown ms = 10 minutes");
check(recommendedTickMs(countdown!) === 1_000, "countdown uses 1s tick");

const elapsed = computePrayerTicker(slots, new Date("2026-07-29T11:20:00+03:00"));
check(elapsed?.mode === "elapsed", "post-adhan within 35m → elapsed");
check(elapsed?.active.key === "dhuhr", "elapsed targets just-rang prayer");
check((elapsed?.ms ?? 0) === 10 * 60 * 1000, "elapsed ms = 10 minutes");

const upcoming = computePrayerTicker(slots, new Date("2026-07-29T12:00:00+03:00"));
check(upcoming?.mode === "upcoming", "after 35m → upcoming next");
check(upcoming?.active.key === "asr", "upcoming is asr");
check(recommendedTickMs(upcoming!) === 30_000, "upcoming uses 30s tick");

check(formatDurationAr(65_000) === "1:05", "format mm:ss");
check(formatDurationAr(3_661_000) === "1:01:01", "format hh:mm:ss");
check(computePrayerTicker([], base) === null, "empty slots → null");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
