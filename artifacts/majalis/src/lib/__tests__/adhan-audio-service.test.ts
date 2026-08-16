/**
 * بوابة الخدمة المركزية لأذان داخل التطبيق.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-audio-service.test.ts
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADHAN_FULL_AUDIO_PATHS,
  adhanCatalog,
  getAudioDiagnostics,
  playAdhanPreview,
  stopAdhanPreview,
} from "../adhan-audio-service";
import { OFFLINE_ADHAN_CORE_PACKS } from "../adhan-offline-assets";

assert.ok(adhanCatalog.some((e) => e.id === "makkah" && e.default));
assert.ok(adhanCatalog.some((e) => e.id === "madinah"));
assert.ok(adhanCatalog.some((e) => e.id === "alharam"));
assert.ok(adhanCatalog.some((e) => e.id === "soft" && e.notificationOnlyAllowed));
assert.ok(adhanCatalog.some((e) => e.id === "custom" && e.fallback === "makkah"));

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
for (const path of Object.values(ADHAN_FULL_AUDIO_PATHS)) {
  const rel = path.replace(/^\//, "");
  assert.ok(existsSync(resolve(root, "public", rel)), `asset missing: ${path}`);
}

for (const pack of OFFLINE_ADHAN_CORE_PACKS) {
  for (const p of Object.values(pack.local)) {
    if (!p) continue;
    const rel = p.replace(/^\//, "");
    assert.ok(existsSync(resolve(root, "public", rel)), `pack local missing: ${p}`);
  }
}

const silent = await playAdhanPreview("makkah", "silent");
assert.equal(silent.ok, false);
assert.match(silent.message, /صامت/);

stopAdhanPreview();
const diag = getAudioDiagnostics();
assert.ok(["ios", "android", "web"].includes(diag.platform));
assert.equal(diag.criticalAlertsEntitlement, false);
assert.ok(diag.silentModeNote.length > 10);

console.log("adhan-audio-service.test.ts: ok");
