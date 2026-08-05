/**
 * iOS / Capacitor stability unit tests — deep links, prayer ticker, audio session gates.
 * Run: npx tsx src/lib/__tests__/ios-stability-audit.test.ts
 */
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
import {
  __resetNativeAudioSessionStateForTests,
  ensureNativePlaybackAudioSession,
  ensureNativeRecordingAudioSession,
  getNativeAudioMode,
} from "../native-playback-audio";

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
  "universal link https://majlisilm.com/prayer-times",
);
check(
  resolveNativeDeepLinkPath("https://www.majlisilm.com/mushaf") === "/mushaf",
  "universal link www host",
);
check(
  resolveNativeDeepLinkPath("https://majlisilm.com/lessons/abc?x=1#y") === "/lessons/abc?x=1#y",
  "https keeps search+hash",
);
check(
  resolveNativeDeepLinkPath("majlisilm://prayer-times") === "/prayer-times",
  "custom scheme majlisilm://prayer-times",
);
check(
  resolveNativeDeepLinkPath("majlisilm:///mushaf") === "/mushaf",
  "custom scheme triple-slash",
);
check(
  resolveNativeDeepLinkPath("majlisilm://fiqh/topics/tahara") === "/fiqh/topics/tahara",
  "custom scheme nested path",
);
check(
  resolveNativeDeepLinkPath("https://evil.example/prayer-times") === null,
  "rejects untrusted https host",
);
check(
  resolveNativeDeepLinkPath("https://majlisilm.com.evil/x") === null,
  "rejects lookalike host",
);
check(resolveNativeDeepLinkPath("majlisilm://evil/../etc/passwd") === null, "blocks path traversal");
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

console.log("\n=== prayer ticker state machine ===");

const slots: PrayerSlot[] = [
  { key: "fajr", nameAr: "الفجر", at: new Date("2026-07-29T04:10:00+03:00") },
  { key: "dhuhr", nameAr: "الظهر", at: new Date("2026-07-29T12:00:00+03:00") },
  { key: "asr", nameAr: "العصر", at: new Date("2026-07-29T15:30:00+03:00") },
  { key: "maghrib", nameAr: "المغرب", at: new Date("2026-07-29T18:45:00+03:00") },
  { key: "isha", nameAr: "العشاء", at: new Date("2026-07-29T20:10:00+03:00") },
  // next-day fajr for midnight wrap
  { key: "fajr", nameAr: "الفجر", at: new Date("2026-07-30T04:09:00+03:00") },
];

const farBefore = computePrayerTicker(slots, new Date("2026-07-29T10:00:00+03:00"));
check(farBefore?.mode === "upcoming", ">15m before prayer → upcoming");
check(farBefore?.active.key === "dhuhr", "upcoming targets dhuhr");
check(recommendedTickMs(farBefore!) === 30_000, "upcoming uses 30s tick");

const last15 = computePrayerTicker(slots, new Date("2026-07-29T11:50:00+03:00"));
check(last15?.mode === "countdown", "last 15m → countdown");
check(last15?.active.key === "dhuhr", "countdown targets dhuhr");
check((last15?.ms ?? 0) === 10 * 60 * 1000, "countdown ms = 10 minutes");
check(recommendedTickMs(last15!) === 1_000, "countdown uses 1s tick");

const postAdhan = computePrayerTicker(slots, new Date("2026-07-29T12:20:00+03:00"));
check(postAdhan?.mode === "elapsed", "first 35m after adhan → elapsed");
check(postAdhan?.active.key === "dhuhr", "elapsed targets just-rang prayer");
check((postAdhan?.ms ?? 0) === 20 * 60 * 1000, "elapsed ms = 20 minutes");

const after35 = computePrayerTicker(slots, new Date("2026-07-29T12:40:00+03:00"));
check(after35?.mode === "upcoming", "after 35m → upcoming next");
check(after35?.active.key === "asr", "upcoming is asr");

const afterMidnight = computePrayerTicker(slots, new Date("2026-07-30T00:15:00+03:00"));
check(afterMidnight?.mode === "upcoming", "after midnight → upcoming next fajr");
check(afterMidnight?.active.key === "fajr", "midnight wrap targets next fajr");
check(
  (afterMidnight?.ms ?? 0) > 3 * 60 * 60 * 1000,
  "midnight countdown spans to next fajr",
);

const preFajrCrossDay = computePrayerTicker(slots, new Date("2026-07-30T03:59:00+03:00"));
check(preFajrCrossDay?.mode === "countdown", "pre-fajr after midnight within 15m → countdown");

check(formatDurationAr(65_000) === "١:٠٥", "format mm:ss");
check(formatDurationAr(3_661_000) === "١:٠١:٠١", "format hh:mm:ss");
check(computePrayerTicker([], new Date()) === null, "empty slots → null");

console.log("\n=== native audio session JS state ===");

__resetNativeAudioSessionStateForTests();
check(getNativeAudioMode() === "inactive", "default mode inactive (no session at launch)");

// On Linux / non-native, ensure* should no-op without flipping to playback via plugin.
await ensureNativePlaybackAudioSession();
check(
  getNativeAudioMode() === "inactive",
  "ensurePlayback on non-native leaves mode inactive (no forced AVAudioSession)",
);

__resetNativeAudioSessionStateForTests();
await ensureNativeRecordingAudioSession();
check(
  getNativeAudioMode() === "inactive",
  "ensureRecording on non-native leaves mode inactive",
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
