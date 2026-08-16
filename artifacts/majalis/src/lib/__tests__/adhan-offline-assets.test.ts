/**
 * حزمة الأذان الأوفلاين — مسارات محلية + تسميات.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-offline-assets.test.ts
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OFFLINE_ADHAN_CORE_PACKS,
  listBundledAdhanSoundPaths,
  notificationSoundForAdhanPack,
  preferLocalAdhanUrl,
  resolveOfflineClipUrl,
} from "../adhan-offline-assets";
import { getMuezzin } from "../adhan-audio";

assert.ok(OFFLINE_ADHAN_CORE_PACKS.length >= 5, "حزم مكة/المدينة/مصر/الأقصى/تكبيرات");
assert.ok(resolveOfflineClipUrl("makkah", "general")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("makkah", "fajr")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("madinah", "general")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("egypt", "general")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("aqsa", "general")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("takbeerat", "takbir")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("alharam", "general")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("turkey", "general")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("soft", "short")?.startsWith("/audio/adhan/"));

assert.equal(notificationSoundForAdhanPack("makkah"), "adhan-short-makkah.caf");
assert.equal(notificationSoundForAdhanPack("madinah"), "adhan-short-madinah.caf");
assert.equal(notificationSoundForAdhanPack("egypt"), "adhan-short-egypt.caf");

const aqsa = getMuezzin("aqsa");
assert.equal(aqsa.audioAvailable, true, "الأقصى متاح للاختيار");
assert.ok(
  aqsa.audioUrl.startsWith("/audio/adhan/") || aqsa.audioUrl.startsWith("/sounds/adhan/"),
  "الأقصى محلي أوفلاين",
);
assert.ok(aqsa.takbirUrl, "تكبيرات للأقصى");

const egypt = getMuezzin("egypt");
assert.ok(
  egypt.audioUrl.startsWith("/audio/adhan/") || egypt.audioUrl.startsWith("/sounds/adhan/"),
  "مصر محلي أوفلاين",
);

const takbeerat = getMuezzin("takbeerat");
assert.equal(takbeerat.audioAvailable, true, "التكبيرات متاحة");

const makkah = getMuezzin("makkah");
assert.ok(
  makkah.audioUrl.startsWith("/audio/adhan/") ||
    makkah.audioUrl.startsWith("/sounds/") ||
    makkah.audioUrl.includes("makkah"),
);
assert.ok(makkah.fajrUrl?.includes("fajr"), "فجر مكة بالتثويب");
assert.ok(
  makkah.fajrUrl?.startsWith("/audio/adhan/") || makkah.fajrUrl?.startsWith("/sounds/"),
  "فجر مكة محلي أوفلاين",
);
assert.ok(makkah.shortUrl && makkah.takbirUrl, "مقاطع قصيرة لمكة");

const here = dirname(fileURLToPath(import.meta.url));
const audioDir = resolve(here, "../../../public/audio/adhan");
const soundsDir = resolve(here, "../../../public/sounds/adhan");
for (const rel of listBundledAdhanSoundPaths()) {
  const underAudio = rel.startsWith("/audio/adhan/");
  const name = rel.replace(/^\/(audio|sounds)\/adhan\//, "");
  const dir = underAudio ? audioDir : soundsDir;
  assert.ok(existsSync(resolve(dir, name)), `ملف محلي موجود: ${rel}`);
}

const remote = OFFLINE_ADHAN_CORE_PACKS[0]!.remote.general!;
assert.equal(preferLocalAdhanUrl(remote), OFFLINE_ADHAN_CORE_PACKS[0]!.local.general);

console.log("adhan-offline-assets.test.ts: ok");
