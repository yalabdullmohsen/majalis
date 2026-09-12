/**
 * بوابة أقسام الإشعارات الموحّدة.
 * node --import tsx src/lib/__tests__/notifications-sections-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NOTIF_SECTIONS,
  pickSectionMessage,
  previewSectionMessage,
} from "../notifications/sections-config";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.equal(NOTIF_SECTIONS.length, 8, "ثمانية أقسام");
const ids = NOTIF_SECTIONS.map((s) => s.id);
assert.deepEqual(ids, [
  "prayer",
  "quran",
  "adhkar",
  "salawat",
  "istighfar",
  "lessons",
  "seekingKnowledge",
  "fridayOccasions",
]);

for (const section of NOTIF_SECTIONS) {
  assert.ok(section.messages.length >= 10, `${section.id} needs ≥10 messages`);
  assert.ok(!/الإشعارات الإسلامية/.test(section.title));
  for (const msg of section.messages) {
    assert.ok(msg.title.trim());
    assert.ok(msg.body.trim());
    assert.ok(msg.body.length < 80, `${section.id} body too long`);
    assert.doesNotMatch(msg.body, /اقترب الموعد/);
    assert.doesNotMatch(msg.body, /إذا كنت تصل/);
  }
}

const a = pickSectionMessage("quran");
const b = pickSectionMessage("quran");
// With >1 messages, consecutive picks should usually differ; allow rare collision but ensure function returns
assert.ok(a.title && a.body);
assert.ok(b.title && b.body);
assert.ok(previewSectionMessage("prayer").title.includes("أذان") || previewSectionMessage("prayer").title.includes("اقترب"));

const view = read("src/pages/account/ui/NotificationSettingsView.tsx");
assert.match(view, /SettingsList/);
assert.match(view, /NOTIF_SECTIONS/);
assert.match(view, /title="الإشعارات"|title:\s*"الإشعارات"/);
assert.doesNotMatch(view, /الإشعارات الإسلامية/);
assert.match(view, /تذكير الذكر/);
assert.match(view, /dhikrPhraseReminder/);

const loc = read("src/lib/notifications/localization.ts");
assert.match(loc, /اقترب أذان \{\{name\}\}/);
assert.match(loc, /أذان \{\{name\}\}/);
assert.match(loc, /body: "\{\{clock\}\}"/);

console.log("notifications-sections-gate: ok");
