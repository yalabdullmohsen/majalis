/**
 * يتحقق أن ملفات CAF الجديدة مسجّلة في project.pbxproj وCopy Bundle Resources.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const soundsDir = join(root, "ios/App/App/Sounds");
const pbx = join(root, "ios/App/App.xcodeproj/project.pbxproj");

assert.ok(existsSync(soundsDir), "Sounds dir");
assert.ok(existsSync(pbx), "xcodeproj");

const required = [
  "adhan-short-makkah.caf",
  "adhan-short-madinah.caf",
  "adhan-short-aqsa.caf",
  "adhan-short-egypt.caf",
  "adhan-short-takbeerat.caf",
  "adhan-seq-makkah-01.caf",
  "adhan-seq-makkah-02.caf",
  "adhan-seq-makkah-03.caf",
  "adhan-seq-makkah-04.caf",
];

const pbxText = readFileSync(pbx, "utf8");
const onDisk = new Set(readdirSync(soundsDir));

for (const name of required) {
  assert.ok(onDisk.has(name), `missing file ${name}`);
  assert.ok(pbxText.includes(name), `pbxproj missing ${name}`);
  assert.ok(
    pbxText.includes(`${name} in Resources`),
    `Copy Bundle Resources missing ${name}`,
  );
}

const fullDir = join(root, "public/audio/adhan");
for (const name of [
  "adhan-makkah-full.m4a",
  "adhan-madinah-full.m4a",
  "adhan-aqsa-full.mp3",
  "adhan-egypt-full.m4a",
  "adhan-haram-full.m4a",
  "adhan-soft-alert.m4a",
  "adhan-makkah-fajr.mp3",
]) {
  assert.ok(existsSync(join(fullDir, name)), `missing full audio ${name}`);
}

const androidRaw = join(root, "android/app/src/main/res/raw");
for (const name of [
  "adhan_short_makkah.mp3",
  "adhan_short_madinah.mp3",
  "adhan_short_egypt.mp3",
  "adhan_short_aqsa.mp3",
  "adhan_short_takbeerat.mp3",
  "adhan_seq_makkah_01.mp3",
  "adhan_seq_makkah_02.mp3",
  "adhan_seq_makkah_03.mp3",
  "adhan_seq_makkah_04.mp3",
]) {
  assert.ok(existsSync(join(androidRaw, name)), `missing android raw ${name}`);
}

assert.equal(
  readFileSync(join(root, "ios/App/App/App.entitlements"), "utf8").includes(
    "critical-alerts",
  ),
  false,
  "يجب ألا يُعلن Critical Alerts دون امتياز فعلي",
);

console.log("adhan-ios-bundle-resources.test.ts: ok");
