/**
 * بوابة محرك مكتبة الصوت — بلا Notifee، قرّاء ومؤذنون معروفون.
 * تشغيل: node --import tsx src/lib/__tests__/audio-library-engine.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FAMOUS_RECITER_IDS,
  describeMuezzinAdhanCapability,
  listFamousMuezzins,
  listFamousReciters,
  scheduleAdhanWithMuezzin,
} from "../audio-library-engine";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

assert.ok(listFamousReciters().length >= 8);
assert.ok(listFamousMuezzins().length >= 7);
assert.ok(listFamousReciters().some((r) => r.id === "minshawi"));
assert.ok(listFamousReciters().some((r) => r.id === "husary"));
assert.ok(listFamousMuezzins().some((m) => m.id === "makkah"));

for (const id of FAMOUS_RECITER_IDS) {
  assert.ok(listFamousReciters().some((r) => r.id === id), `reciter ${id}`);
}

const panel = readFileSync(
  resolve(root, "src/components/audio/AudioLibrarySelectionPanel.tsx"),
  "utf8",
);
const engine = readFileSync(resolve(root, "src/lib/audio-library-engine.ts"), "utf8");

assert.doesNotMatch(engine, /from ['"]@notifee|import Notifee/);
assert.doesNotMatch(panel, /Notifee|React Native/);
assert.doesNotMatch(panel, /critical:\s*true/);
assert.match(panel, /AudioLibrarySelectionPanel/);
assert.match(panel, /listFamousReciters/);
assert.match(panel, /listFamousMuezzins/);

const scheduled = await scheduleAdhanWithMuezzin({
  prayerKey: "dhuhr",
  prayerName: "الظهر",
  atMs: Date.now() + 60_000,
  muezzinId: "makkah",
  isFullAdhan: true,
});
assert.equal(typeof scheduled.ok, "boolean");

assert.match(describeMuezzinAdhanCapability("makkah", true), /iOS|Android|داخل/);

console.log("audio-library-engine.test.ts: ok");
