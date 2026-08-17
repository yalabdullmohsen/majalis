/**
 * بوابات التجويد والقراءات + تنظيف مركز القرآن.
 * تشغيل: node --import tsx src/lib/__tests__/quran-hub-tajweed-qiraat-gate.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { quranHubSections, SECTIONS } from "@/config/sections.registry";
import {
  TAJWEED_CHAPTERS,
  TAJWEED_COLORING_FLAG,
} from "@/lib/quran-tajweed/chapters";
import {
  MUSHAF_TEXT_IS_HAFS_ONLY,
  QIRAAT_ASHARA,
  QIRAAT_AUDIO_CATALOG,
  QIRAAT_DIFF_EXAMPLES,
  QIRAAT_SECTIONS,
} from "@/lib/quran-qiraat/catalog";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

assert.equal(TAJWEED_COLORING_FLAG, false, "تلوين التجويد يجب أن يبقى مطفأ");
assert.ok(TAJWEED_CHAPTERS.length >= 10, "أبواب التجويد ≥ ١٠");
for (const ch of TAJWEED_CHAPTERS) {
  assert.ok(ch.source?.trim(), `باب بلا مصدر: ${ch.id}`);
  assert.ok(ch.examples.length >= 1, `باب بلا أمثلة: ${ch.id}`);
  for (const ex of ch.examples) {
    assert.ok(ex.ayahRef.surah >= 1 && ex.ayahRef.surah <= 114, ch.id);
    assert.ok(ex.ayahRef.ayah >= 1, ch.id);
  }
}

assert.equal(MUSHAF_TEXT_IS_HAFS_ONLY, true);
assert.equal(QIRAAT_ASHARA.length, 10);
assert.equal(QIRAAT_AUDIO_CATALOG.length, 0);
assert.ok(QIRAAT_SECTIONS.every((s) => s.source.trim()));
assert.ok(QIRAAT_DIFF_EXAMPLES.length >= 4);
for (const ex of QIRAAT_DIFF_EXAMPLES) {
  assert.ok(ex.source.trim(), ex.id);
  assert.ok(ex.ayahRef.surah >= 1 && ex.ayahRef.ayah >= 1, ex.id);
}

const hub = quranHubSections();
assert.ok(hub.some((s) => s.id === "quran-tajweed"));
assert.ok(hub.some((s) => s.id === "quran-qiraat"));
assert.ok(hub.some((s) => s.id === "quran-tilawa" && s.route.includes("tilawa")));
assert.ok(hub.some((s) => s.id === "quran-ulum-terms"));
assert.equal(
  hub.some((s) => s.id === "quran-terms" || s.route === "/islamic-glossary"),
  false,
  "القاموس العام لا يظهر في مركز القرآن",
);

const glossary = SECTIONS.find((s) => s.id === "glossary");
assert.ok(glossary);
assert.equal(glossary!.hub, "sections");
assert.equal(glossary!.group, "library");

const hubView = fs.readFileSync(path.join(root, "src/pages/quran/ui/QuranHubView.tsx"), "utf8");
assert.doesNotMatch(hubView, /islamic-glossary/, "لا رابط قاموس عام في واجهة المركز");

const coloringSrc = fs.readFileSync(path.join(root, "src/lib/quran-tajweed/chapters.ts"), "utf8");
assert.match(coloringSrc, /TAJWEED_COLORING_FLAG\s*=\s*false/);

console.log(
  `quran-hub-tajweed-qiraat-gate: OK chapters=${TAJWEED_CHAPTERS.length} qari=${QIRAAT_ASHARA.length}`,
);
