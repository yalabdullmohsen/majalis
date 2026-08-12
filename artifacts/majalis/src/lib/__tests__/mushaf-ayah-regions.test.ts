/**
 * مناطق ضغط الآيات النسبية — مرحلة ١.
 * تشغيل: npx tsx src/lib/__tests__/mushaf-ayah-regions.test.ts
 */
import assert from "node:assert/strict";
import { buildAyahHitRegions } from "@/features/mushaf/ayah-hit-regions";
import type { MushafPageLayout } from "@/lib/mushaf-v2-data";

const layout: MushafPageLayout = {
  pageNumber: 1,
  juzNumber: 1,
  surahsOnPage: [],
  surahsStartingOnPage: [],
  layoutMode: "standard",
  ayahLineCount: 1,
  hizbNumber: 1,
  hizbStartingOnPage: 1,
  rubElHizbStartingOnPage: 1,
  rows: [
    {
      kind: "line",
      lineNumber: 2,
      gridSlot: 2,
      words: [
        {
          id: 1, position: 1, lineNumber: 2, charType: "word",
          textUthmani: "بِسْمِ", textQpcHafs: "بِسْمِ", glyphText: "a",
          audioUrl: null, verseKey: "1:1", sajdahNumber: null,
        },
        {
          id: 2, position: 2, lineNumber: 2, charType: "word",
          textUthmani: "اللَّهِ", textQpcHafs: "اللَّهِ", glyphText: "b",
          audioUrl: null, verseKey: "1:1", sajdahNumber: null,
        },
        {
          id: 3, position: 3, lineNumber: 2, charType: "end",
          textUthmani: "١", textQpcHafs: "١", glyphText: "c",
          audioUrl: null, verseKey: "1:1", sajdahNumber: null,
        },
        {
          id: 4, position: 4, lineNumber: 2, charType: "word",
          textUthmani: "الْحَمْدُ", textQpcHafs: "الْحَمْدُ", glyphText: "d",
          audioUrl: null, verseKey: "1:2", sajdahNumber: null,
        },
      ],
    },
  ],
};

const regions = buildAyahHitRegions(layout);
assert.equal(regions.length, 2);
assert.equal(regions[0].verseKey, "1:1");
assert.equal(regions[0].page, 1);
assert.ok(regions[0].rects.length >= 1);
for (const r of regions[0].rects) {
  assert.ok(r.x >= 0 && r.x <= 1);
  assert.ok(r.y >= 0 && r.y <= 1);
  assert.ok(r.w > 0 && r.w <= 1);
  assert.ok(r.h > 0 && r.h <= 1);
}
assert.equal(buildAyahHitRegions(null).length, 0);
console.log("mushaf-ayah-regions: OK");
