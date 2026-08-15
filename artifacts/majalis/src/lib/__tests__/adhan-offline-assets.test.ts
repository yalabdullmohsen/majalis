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

assert.ok(OFFLINE_ADHAN_CORE_PACKS.length >= 5, "حزم مكة/المدينة/مصر/الأقصى/تكبيرات");
assert.ok(resolveOfflineClipUrl("makkah", "general")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("makkah", "fajr")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("madinah", "general")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("egypt", "general")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("aqsa", "general")?.startsWith("/audio/adhan/"));
assert.ok(resolveOfflineClipUrl("takbeerat", "takbir")?.startsWith("/sounds/"));

const aqsa = getMuezzin("aqsa");
assert.equal(aqsa.audioAvailable, true, "الأقصى متاح للاختيار");
assert.ok(aqsa.audioUrl.startsWith("/audio/adhan/") || aqsa.audioUrl.startsWith("/sounds/"), "الأقصى محلي أوفلاين");
assert.ok(aqsa.takbirUrl, "تكبيرات للأقصى");

const egypt = getMuezzin("egypt");
assert.ok(egypt.audioUrl.startsWith("/audio/adhan/") || egypt.audioUrl.startsWith("/sounds/"), "مصر محلي أوفلاين");

const takbeerat = getMuezzin("takbeerat");
assert.equal(takbeerat.audioAvailable, true, "التكبيرات متاحة");

const makkah = getMuezzin("makkah");
assert.ok(makkah.audioUrl.startsWith("/audio/adhan/") || makkah.audioUrl.includes("makkah"));
assert.ok(makkah.fajrUrl?.includes("fajr"), "فجر مكة بالتثويب");
assert.ok(
  makkah.fajrUrl?.startsWith("/audio/adhan/") || makkah.fajrUrl?.startsWith("/sounds/"),
  "فجر مكة محلي أوفلاين",
);
assert.ok(makkah.shortUrl && makkah.takbirUrl, "مقاطع قصيرة لمكة");

const here = dirname(fileURLToPath(import.meta.url));
const publicRoot = resolve(here, "../../../public");
for (const rel of listBundledAdhanSoundPaths()) {
  const abs = resolve(publicRoot, rel.replace(/^\//, ""));
  assert.ok(existsSync(abs), `ملف محلي موجود: ${rel}`);
}

const remote = OFFLINE_ADHAN_CORE_PACKS[0]!.remote.general!;
assert.equal(preferLocalAdhanUrl(remote), OFFLINE_ADHAN_CORE_PACKS[0]!.local.general);

console.log("adhan-offline-assets.test.ts: ok");
