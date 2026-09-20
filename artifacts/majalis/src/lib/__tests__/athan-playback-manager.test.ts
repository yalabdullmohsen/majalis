/**
 * بوابة AthanPlaybackManager — جلسة صلاة محمية بلا maxMs.
 * node --import tsx src/lib/__tests__/athan-playback-manager.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const manager = read("src/lib/athan-playback-manager.ts");
const scheduler = read("src/lib/adhan-scheduler.ts");
const bus = read("src/lib/exclusive-audio-bus.ts");
const coordinator = read("src/lib/audio/app-audio-coordinator.ts");
const audio = read("src/lib/adhan-audio.ts");
const smart = read("src/lib/adhan-smart-cancel.ts");
const bar = read("src/components/adhan/AdhanNotificationBar.tsx");

assert.match(manager, /AthanPlaybackManager|playPrayerAthanSync/);
assert.match(manager, /isProtectedAthanSession/);
assert.match(manager, /kind === "prayer" \? null/);
assert.match(manager, /tryStopAthanFromForeignOwner/);
assert.match(manager, /reason === "leave"|reason === "interrupt"|reason === "bus"/);
assert.match(manager, /attachNaturalEnd|addEventListener\("ended"/);
assert.doesNotMatch(
  manager,
  /setTimeout\(\s*\(\)\s*=>\s*stopAthan/,
  "المدير لا يعيد تشغيلًا بمؤقّت ترقيعي",
);

assert.match(scheduler, /playPrayerAthanSync/);
assert.doesNotMatch(scheduler, /mapFullToSilent/);
assert.doesNotMatch(
  scheduler,
  /mode === "full" \? "silent"/,
  "لا تحويل الكامل إلى صامت في المجدول",
);

assert.match(bus, /tryStopAthanFromForeignOwner/);
assert.match(coordinator, /isProtectedAthanSession/);
assert.match(audio, /playPrayerAthanSync/);
assert.match(audio, /managerStopAthan\("user"\)/);
assert.match(smart, /playPrayerAthanSync/);
assert.match(bar, /stopAthan\("user"\)/);

// عقد سلوكي خفيف بدون DOM Audio حقيقي
const {
  getAthanPhase,
  stopAthan,
  tryStopAthanFromForeignOwner,
  isProtectedAthanSession,
  playPrayerAthanSync,
} = await import("../athan-playback-manager");
const { getMuezzin } = await import("../adhan-audio");

assert.equal(getAthanPhase(), "idle");
assert.equal(tryStopAthanFromForeignOwner(), false);

const muezzin = getMuezzin("makkah");
// بيئة Node قد لا تملك Audio — نتحقق أن المسار لا يرمي وأن الحماية تُفعَّل عند اللعب
const hasAudio = typeof Audio !== "undefined";
if (hasAudio) {
  const el = playPrayerAthanSync(muezzin, false, "short", 0.1);
  if (el) {
    assert.equal(getAthanPhase(), "playing");
    assert.equal(isProtectedAthanSession(), true);
    assert.equal(tryStopAthanFromForeignOwner(), false, "bus لا يوقف جلسة الصلاة");
    assert.equal(isProtectedAthanSession(), true);
    assert.equal(stopAthan("user"), true, "المستخدم يوقف");
    assert.ok(["stopped", "idle"].includes(getAthanPhase()));
  }
} else {
  console.log("  (skip live Audio — Node بدون HTMLAudioElement)");
}

console.log("athan-playback-manager.test.ts: ok");
