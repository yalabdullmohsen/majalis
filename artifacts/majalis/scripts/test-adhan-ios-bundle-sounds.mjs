#!/usr/bin/env node
/**
 * بوابة: أصوات إشعار الأذان موجودة في Bundle Resources بجذر App.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const app = resolve(root, "ios/App/App");
const sounds = resolve(app, "Sounds");
const pbx = readFileSync(resolve(root, "ios/App/App.xcodeproj/project.pbxproj"), "utf8");

const required = [
  "adhan-short-makkah.caf",
  "adhan-short-madinah.caf",
  "adhan-short-egypt.caf",
  "adhan-short-aqsa.caf",
  "adhan-short-takbeerat.caf",
  "adhan-seq-makkah-01.caf",
  "adhan-seq-makkah-02.caf",
  "adhan-seq-makkah-03.caf",
  "adhan-seq-makkah-04.caf",
  "adhan-short-makkah-fajr.caf",
];

for (const name of required) {
  assert.ok(existsSync(resolve(sounds, name)), `مفقود Sounds/${name}`);
  assert.ok(existsSync(resolve(app, name)), `مفقود App/${name} (جذر Bundle)`);
  assert.ok(pbx.includes(`${name} in Resources`), `${name} غير مدرج في Copy Bundle Resources`);
  assert.ok(
    new RegExp(`\\/\\* ${name.replace(/\./g, "\\.")} in Resources \\*\\/ = \\{isa = PBXBuildFile`).test(pbx),
    `${name} بلا PBXBuildFile (مرجع معلق)`,
  );
}

assert.ok(!pbx.includes("path = Sounds/adhan-short"), "مسار FileRef يجب أن يكون بجذر App لا Sounds/");

const soundsTs = readFileSync(resolve(root, "src/lib/prayer-notification-sounds.ts"), "utf8");
assert.match(soundsTs, /adhan-short-makkah\.caf/);
assert.doesNotMatch(soundsTs, /\/sounds\/adhan\//);

console.log("✓ adhan-ios-bundle-sounds gate ok");
