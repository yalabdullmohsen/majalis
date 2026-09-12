/**
 * بوابة حقوق أصوات الصلاة — لا إنتاج بحقوق غير مؤكدة أو أسماء مشاهير.
 * تشغيل: node --import tsx src/lib/__tests__/prayer-audio-rights-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertNoCelebrityProductionAudio,
  isCatalogIdAllowedInProductionUi,
  listProductionApprovedAudio,
  PRAYER_AUDIO_RIGHTS_REGISTRY,
} from "../prayer-audio-rights-registry";
import { evaluateImportCandidate, detectCelebrityNameRisk } from "../prayer-audio-import-pipeline";
import {
  computeBackControlBottomOffset,
  detectBackControlCollision,
} from "../global-back-layout";
import { listAvailableSettingsSounds } from "../adhan-settings-sound-catalog";
import { hasInPageBackChrome } from "../immersive-chrome";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

assertNoCelebrityProductionAudio();

for (const r of listProductionApprovedAudio()) {
  assert.notEqual(r.licenseType, "rights_uncertain");
  assert.equal(r.celebrityNameRisk, false);
  assert.equal(r.approvedForProduction, true);
}

assert.equal(isCatalogIdAllowedInProductionUi("qatami"), false);
assert.equal(isCatalogIdAllowedInProductionUi("madinah"), false);
assert.equal(isCatalogIdAllowedInProductionUi("makkah"), true);
assert.equal(isCatalogIdAllowedInProductionUi("tone-prayer"), true);

const available = listAvailableSettingsSounds();
assert.ok(!available.some((o) => o.id === "qatami"), "qatami must stay out of production UI");
assert.ok(!available.some((o) => o.id === "madinah"), "uncertain madinah must stay out");
assert.ok(available.some((o) => o.id === "makkah" || o.group === "tone"));

assert.equal(detectCelebrityNameRisk("أذان ناصر القطامي"), true);
assert.equal(detectCelebrityNameRisk("أذان ميداني من المغرب"), false);

const rejected = evaluateImportCandidate({
  candidateId: "yt-1",
  sourceUrl: "https://youtube.com/watch?v=x",
  sourcePlatform: "other",
  displayNameAr: "أذان الحرم المكي",
  licenseClaim: "CC0",
  celebrityNameRisk: false,
  hasLicenseEvidence: true,
  licenseAllowsAppEmbedding: true,
  audioQualityOk: true,
  isDuplicate: false,
});
assert.equal(rejected.stage, "rejected");
assert.equal(rejected.approvedForProduction, false);

const ok = evaluateImportCandidate({
  candidateId: "wm-1",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Adhan.ogg",
  sourcePlatform: "wikimedia",
  displayNameAr: "أذان ميداني",
  licenseClaim: "CC0",
  celebrityNameRisk: false,
  hasLicenseEvidence: true,
  licenseAllowsAppEmbedding: true,
  audioQualityOk: true,
  isDuplicate: false,
});
assert.equal(ok.approvedForProduction, true);
assert.equal(ok.licenseVerified, true);

const offset = computeBackControlBottomOffset({
  safeAreaBottom: 34,
  bottomNavigationHeight: 56,
  miniPlayerHeight: 0,
  keyboardHeight: 0,
  activeSheetHeight: 0,
});
assert.ok(offset >= 34 + 56);

const collision = detectBackControlCollision(
  { left: 10, top: 700, right: 58, bottom: 748 },
  [{ left: 20, top: 710, right: 200, bottom: 760 }],
);
assert.equal(collision.collided, true);

assert.equal(hasInPageBackChrome("/adhan-settings"), true);

const view = readFileSync(resolve(appRoot, "src/pages/worship/ui/AdhanSettingsView.tsx"), "utf8");
assert.match(view, /AppBackButton/);
assert.match(view, /PrayerAudioPicker/);
assert.match(view, /ads-page--v3/);
assert.doesNotMatch(view, /bypassAudioRights|allowUnlicensedAudio|skipLicenseValidation/);

const registrySrc = readFileSync(resolve(appRoot, "src/lib/prayer-audio-rights-registry.ts"), "utf8");
assert.doesNotMatch(registrySrc, /bypassAudioRights|allowUnlicensedAudio|assumePublicDomain/);

const sourcesRegistry = resolve(appRoot, "docs/audio-rights/approved-sources-registry.json");
assert.equal(existsSync(sourcesRegistry), true);
const sources = JSON.parse(readFileSync(sourcesRegistry, "utf8"));
assert.ok(Array.isArray(sources.sources));

const evidenceDir = resolve(appRoot, "docs/audio-rights/evidence");
assert.equal(existsSync(resolve(evidenceDir, "signature-sounds-call-to-prayer-2026-09-13.html")), true);
assert.equal(existsSync(resolve(evidenceDir, "wikimedia-beautiful-adhan-2026-09-13.html")), true);
assert.equal(existsSync(resolve(evidenceDir, "wikimedia-adhan-ogg-2026-09-13.html")), true);

console.log("prayer-audio-rights-gate: ok", {
  production: listProductionApprovedAudio().length,
  registry: PRAYER_AUDIO_RIGHTS_REGISTRY.length,
  available: available.length,
});
