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
  preferLocalAdhanUrl,
  resolveOfflineClipUrl,
} from "../adhan-offline-assets";
import { getMuezzin } from "../adhan-audio";

assert.ok(OFFLINE_ADHAN_CORE_PACKS.length >= 4, "حزم مكة/المدينة/الأقصى/تكبيرات");
assert.ok(resolveOfflineClipUrl("makkah", "general")?.startsWith("/sounds/"));
assert.ok(resolveOfflineClipUrl("madinah", "general")?.startsWith("/sounds/"));
assert.ok(resolveOfflineClipUrl("takbeerat", "takbir")?.startsWith("/sounds/"));

const aqsa = getMuezzin("aqsa");
assert.equal(aqsa.audioAvailable, true, "الأقصى متاح للاختيار");
assert.ok(aqsa.audioUrl, "رابط الأقصى");
assert.ok(aqsa.takbirUrl, "تكبيرات للأقصى");

const makkah = getMuezzin("makkah");
assert.ok(makkah.audioUrl.startsWith("/sounds/") || makkah.audioUrl.includes("makkah"));
assert.ok(makkah.fajrUrl, "فجر مكة بالتثويب");
assert.ok(makkah.shortUrl && makkah.takbirUrl, "مقاطع قصيرة لمكة");

const here = dirname(fileURLToPath(import.meta.url));
const sounds = resolve(here, "../../../public/sounds/adhan");
for (const rel of listBundledAdhanSoundPaths()) {
  const name = rel.replace("/sounds/adhan/", "");
  assert.ok(existsSync(resolve(sounds, name)), `ملف محلي موجود: ${name}`);
}

const remote = OFFLINE_ADHAN_CORE_PACKS[0]!.remote.general!;
assert.equal(preferLocalAdhanUrl(remote), OFFLINE_ADHAN_CORE_PACKS[0]!.local.general);

console.log("adhan-offline-assets.test.ts: ok");
