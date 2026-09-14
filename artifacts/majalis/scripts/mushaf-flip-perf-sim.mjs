/**
 * محاكاة خفيفة لعدّادات التقليب — ثوابت المعمارية (mounts/preload).
 * DEV: localStorage mushaf-turn-telemetry=1 لعرض الإطارات.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(resolve(root, rel), "utf8");

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const pager = read("src/features/mushaf-reader/MushafPager.tsx");
const font = read("src/features/mushaf-madinah/useQpcPageFont.ts");
const tele = read("src/features/mushaf-reader/mushaf-turn-telemetry.ts");

assert.match(reader, /mushafPerfInc\("readerMount"\)/);
assert.match(pager, /mushafPerfInc\("pagerMount"\)/);
assert.match(font, /mushafPerfInc\("fontLoad"\)/);
assert.match(font, /inflight/);
assert.match(reader, /prefetchAdjacent:\s*false/);
assert.match(reader, /page \+ 2/);
assert.match(reader, /page - 2/);
assert.match(pager, /key=\{pageNumber\}/);
assert.match(tele, /readerMountCount/);
assert.doesNotMatch(pager, /haptics|vibrate/i);

function simulateFlips(n) {
  const state = {
    readerMountCount: 1,
    pagerMountCount: 1,
    fontLoadCount: 0,
    geometryChangeCount: 1,
    pageRenderCount: 0,
  };
  const warm = new Set([1, 2, 3]);
  state.fontLoadCount = warm.size;
  let page = 1;
  for (let i = 0; i < n; i++) {
    page = Math.min(604, page + 1);
    if (!warm.has(page)) {
      warm.add(page);
      state.fontLoadCount += 1;
    }
    state.pageRenderCount += 3;
  }
  return state;
}

for (const n of [50, 100]) {
  const s = simulateFlips(n);
  assert.equal(s.readerMountCount, 1);
  assert.equal(s.pagerMountCount, 1);
  assert.equal(s.geometryChangeCount, 1);
  console.log(`flip-sim n=${n} @60Hz/120Hz(transform-only)`, s);
}

console.log("mushaf-flip-perf-sim.mjs: ok");
