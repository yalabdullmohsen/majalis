/**
 * بوابة حراسة المتجر + سلامة كتالوج الإنتاج الصوتي.
 * - UI الإنتاج لا يعرض غير approvedForProduction
 * - كل معاينة/CAF المُعلنة موجودة على القرص
 * - madinah/qatami محظوران
 * - كتالوج المتجر (sunnah-audio-platform) = system-default فقط
 * - وثائق الاستبعاد موجودة ومتسقة
 *
 * تشغيل: node --import tsx src/lib/__tests__/store-release-assets-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listSelectableAdhanVoices } from "../sunnah-audio-platform";
import {
  assertNoCelebrityProductionAudio,
  getAudioRightsRecord,
  isCatalogIdAllowedInProductionUi,
  listProductionApprovedAudio,
  PRAYER_AUDIO_RIGHTS_REGISTRY,
} from "../prayer-audio-rights-registry";
import {
  listAvailableSettingsSounds,
  listExpectedIosNotificationCafs,
  listExpectedSettingsSoundFiles,
} from "../adhan-settings-sound-catalog";
import { listBundledAdhanSoundPaths, notificationSoundForAdhanPack } from "../adhan-offline-assets";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, "../../..");
const repo = resolve(appRoot, "../..");
const store = resolve(repo, "docs/store-release");

assertNoCelebrityProductionAudio();

for (const f of [
  "STORE_SOURCE_COMMIT.txt",
  "STORE_ASSET_MANIFEST.md",
  "STORE_LICENSE_DECISIONS.md",
  "STORE_EXCLUSION_REPORT.md",
  "excluded-asset-globs.json",
  "MANUAL_OWNER_ACTION.md",
  "STORE_100_PERCENT_READINESS.md",
]) {
  assert.ok(existsSync(resolve(store, f)), `missing store doc ${f}`);
}

const commit = readFileSync(resolve(store, "STORE_SOURCE_COMMIT.txt"), "utf8").trim();
assert.match(commit, /^[0-9a-f]{40}$/i, "STORE_SOURCE_COMMIT must be full sha");

const globs = JSON.parse(readFileSync(resolve(store, "excluded-asset-globs.json"), "utf8"));
assert.ok(Array.isArray(globs.excludedFromStoreBinary) && globs.excludedFromStoreBinary.length >= 1);
assert.ok(
  globs.excludedFromStoreBinary.some((g: string) => g.includes("public/audio/adhan")),
  "store strip must cover public/audio/adhan",
);
assert.ok(
  globs.excludedFromStoreBinary.some((g: string) => g.includes("adhan-*.caf") || g.includes("Sounds/adhan")),
  "store strip must cover iOS adhan CAF",
);

const manifest = readFileSync(resolve(store, "STORE_ASSET_MANIFEST.md"), "utf8");
assert.match(manifest, /field-full|أذان ميداني كامل|File:Beautiful_adhan/);
assert.match(manifest, /field|File:Adhan\.ogg|أذان ميداني/);
assert.match(manifest, /madinah|qatami/i);
assert.match(manifest, /MISSING_EVIDENCE|EXCLUDED|HOLD|CC0/);

{
  const selectable = listSelectableAdhanVoices();
  assert.equal(selectable.length, 1, "store catalog must expose exactly one voice");
  assert.equal(selectable[0]?.id, "system-default");
}

{
  const available = listAvailableSettingsSounds();
  assert.ok(!available.some((o) => o.id === "qatami" || o.id === "madinah"));
  assert.equal(isCatalogIdAllowedInProductionUi("qatami"), false);
  assert.equal(isCatalogIdAllowedInProductionUi("madinah"), false);

  for (const opt of available) {
    if (opt.playbackMode === "silent") continue;
    assert.ok(
      isCatalogIdAllowedInProductionUi(opt.id) || opt.group === "tone",
      `production UI option not allowed: ${opt.id}`,
    );
    const rec = getAudioRightsRecord(opt.id);
    assert.ok(rec, `rights record missing for ${opt.id}`);
    assert.equal(rec.approvedForProduction, true, `${opt.id} must be approvedForProduction`);
    assert.notEqual(rec.licenseType, "rights_uncertain");
    assert.notEqual(rec.status, "rejected");
    assert.equal(rec.celebrityNameRisk, false);
  }

  for (const rel of listExpectedSettingsSoundFiles()) {
    const abs = resolve(appRoot, "public" + rel);
    assert.ok(existsSync(abs), `missing preview file ${rel}`);
  }

  for (const caf of listExpectedIosNotificationCafs()) {
    const abs = resolve(appRoot, "ios/App/App/Sounds", caf);
    assert.ok(existsSync(abs), `missing ios caf ${caf}`);
  }
}

{
  for (const path of listBundledAdhanSoundPaths()) {
    const abs = resolve(appRoot, "public" + path);
    assert.ok(existsSync(abs), `offline pack local missing: ${path}`);
  }

  for (const id of ["field", "field-full"]) {
    assert.equal(isCatalogIdAllowedInProductionUi(id), true);
    const caf = notificationSoundForAdhanPack(id);
    assert.ok(caf, `${id} notificationSound`);
    assert.ok(existsSync(resolve(appRoot, "ios/App/App/Sounds", caf!)), `${id} caf on disk`);
  }
}

{
  const blocked = PRAYER_AUDIO_RIGHTS_REGISTRY.filter((r) => !r.approvedForProduction);
  assert.ok(blocked.some((r) => r.audioId === "madinah"));
  assert.ok(blocked.some((r) => r.audioId === "qatami"));
  for (const r of blocked) {
    assert.equal(
      listAvailableSettingsSounds().some((o) => o.id === r.audioId),
      false,
      `blocked id leaked into settings UI: ${r.audioId}`,
    );
  }

  const prod = listProductionApprovedAudio();
  assert.ok(prod.some((r) => r.audioId === "field"));
  assert.ok(prod.some((r) => r.audioId === "field-full"));
  assert.ok(prod.every((r) => r.licenseType !== "rights_uncertain"));
}

console.log("store-release-assets-gate.test.ts: ok", {
  productionApproved: listProductionApprovedAudio().length,
  settingsAvailable: listAvailableSettingsSounds().length,
  storeVoices: listSelectableAdhanVoices().length,
});
