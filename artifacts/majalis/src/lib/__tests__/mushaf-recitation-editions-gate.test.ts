/**
 * بوابة إصدارات التلاوة — بلا خيارات وهمية لمجود/معلم.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-recitation-editions-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRecitationEditionsFromRegistry,
  stylesForReciter,
} from "../quran-data/recitation-editions";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const registry = JSON.parse(
  readFileSync(resolve(root, "public/data/audio/audio-registry.json"), "utf8"),
) as {
  reciters: Array<{
    id: string;
    name: string;
    style: string;
    granularity: string;
    bitrate: number;
    folder: string;
    source: string;
    verified: boolean;
    filesPresent?: number;
    qaPassedAt?: string;
  }>;
};

const editions = buildRecitationEditionsFromRegistry(registry.reciters);
assert.ok(editions.length > 0, "يجب وجود إصدارات مرتل موثّقة");

for (const ed of editions) {
  assert.equal(ed.style, "murattal", `${ed.reciterId}: النمط الوحيد الموثّق حاليًا هو مرتل`);
  assert.ok(ed.sourceResourceId, `${ed.reciterId}: resource id مطلوب`);
  assert.ok(ed.streamingAllowed);
  assert.equal(ed.offlineAllowed, false, "لا offline قبل توثيق الحقوق");
  assert.notEqual(ed.licenseStatus, "blocked");
}

const fake = buildRecitationEditionsFromRegistry([
  {
    id: "fake",
    name: "قارئ وهمي",
    style: "مجود",
    granularity: "ayah",
    bitrate: 128,
    folder: "Fake_Mujawwad",
    source: "everyayah",
    verified: false,
    filesPresent: 6236,
  },
]);
assert.equal(fake.length, 0, "لا تُنشأ نسخة من قارئ غير verified");

assert.deepEqual(stylesForReciter(editions, "husary"), ["murattal"]);

const mod = readFileSync(resolve(root, "src/lib/quran-data/recitation-editions.ts"), "utf8");
assert.match(mod, /pending_rights_review/);
assert.match(mod, /لا تُعرض مجوّد\/معلّم إلا بوجود مورد/);
assert.doesNotMatch(mod, /voice.?clone|elevenlabs|openai.*audio/i);

const dock = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafAudioDock.tsx"), "utf8");
assert.doesNotMatch(dock, /مجود|معلم|mujawwad|muallim/i);
assert.match(dock, /مرتل|styleLabelAr|recitation-style/);

console.log(`mushaf-recitation-editions-gate.test.ts: ok (editions=${editions.length})`);
