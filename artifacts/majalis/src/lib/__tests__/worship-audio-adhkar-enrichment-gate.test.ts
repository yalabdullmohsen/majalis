/**
 * بوابة إثراء القراء/الأذان/تذكيرات الأذكار.
 * تشغيل: node --import tsx src/lib/__tests__/worship-audio-adhkar-enrichment-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const registry = JSON.parse(read("public/data/audio/audio-registry.json"));
const verified = (registry.reciters ?? []).filter((r: { verified?: boolean }) => r.verified);
assert.ok(verified.length >= 13, `expected ≥13 verified reciters, got ${verified.length}`);
for (const id of [
  "abdulsamad",
  "sudais",
  "maher",
  "hudhaify",
  "basfar",
  "shatri",
  "ayyoub",
  "ali_jaber",
]) {
  assert.ok(verified.some((r: { id: string }) => r.id === id), `missing verified ${id}`);
}

const audioRegistry = read("src/lib/audio-registry.ts");
assert.match(audioRegistry, /"abdulsamad"/);
assert.match(audioRegistry, /"sudais"/);
assert.match(audioRegistry, /"ali_jaber"/);

const catalog = read("src/lib/adhan-settings-sound-catalog.ts");
assert.match(catalog, /id: "egypt"/);
assert.match(catalog, /id: "aqsa"/);
assert.match(catalog, /أذان تقليدي/);
assert.match(catalog, /أذان المسجد الأقصى/);
assert.doesNotMatch(catalog, /أذان مصري/);

const rights = read("src/lib/prayer-audio-rights-registry.ts");
assert.match(rights, /audioId: "egypt"/);
assert.match(rights, /audioId: "aqsa"/);
assert.match(rights, /approvedForProduction: true/);

assert.ok(existsSync(resolve(root, "public/audio/adhan/adhan-egypt-full.m4a")));
assert.ok(existsSync(resolve(root, "public/audio/adhan/adhan-aqsa-full.mp3")));
assert.ok(existsSync(resolve(root, "ios/App/App/Sounds/adhan-short-egypt.caf")));
assert.ok(existsSync(resolve(root, "ios/App/App/Sounds/adhan-short-aqsa.caf")));

const adhkarView = read("src/pages/worship/ui/AdhkarView.tsx");
assert.match(adhkarView, /AdhkarRemindersCard/);
const card = read("src/components/adhkar/AdhkarRemindersCard.tsx");
assert.match(card, /adhkarReminder/);
assert.match(card, /dhikrPhraseReminder/);
assert.match(card, /syncSmartLocalNotifications/);

const smart = read("src/lib/smart-local-notifications.ts");
assert.match(smart, /\/adhkar\/morning/);
assert.match(smart, /\/adhkar\/evening/);
assert.match(smart, /\/adhkar\/sleep/);
assert.match(smart, /\/adhkar\/after-salah/);

console.log("worship-audio-adhkar-enrichment-gate.test.ts: ok");
