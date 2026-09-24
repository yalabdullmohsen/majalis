/**
 * Gate: Discover Experience للمشاهد الإسلامية.
 * Run: node --import tsx src/lib/__tests__/islamic-landmarks-discover-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FEATURED_LANDMARK_IDS,
  ISLAMIC_LANDMARKS,
  getFeaturedLandmarks,
  getLandmarkById,
} from "../islamic-landmarks-data";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== بيانات محفوظة ===");
assert.ok(ISLAMIC_LANDMARKS.length >= 34);
assert.equal(getFeaturedLandmarks().length, FEATURED_LANDMARK_IDS.length);
for (const id of FEATURED_LANDMARK_IDS) {
  assert.ok(getLandmarkById(id), `featured موجود: ${id}`);
}

console.log("=== Discover page ===");
const page = read("src/views/IslamicLandmarksPage.tsx");
assert.match(page, /AppPage/);
assert.match(page, /PageHeaderV2/);
assert.match(page, /ilm-featured|مواقع مميزة/);
assert.match(page, /ilm-chip|LANDMARK_TYPES/);
assert.match(page, /LandmarkDiscoverCard/);
assert.match(page, /islamic-landmarks\/map/);
assert.doesNotMatch(page, /ilm-map-wrap|showMap\s*=/);
assert.doesNotMatch(page, /FloatingBackButton|LandmarkModal/);

console.log("=== Detail + Explorer routes ===");
const routes = read("src/AppRoutes.tsx");
assert.match(routes, /islamic-landmarks\/map/);
assert.match(routes, /islamic-landmarks\/:id/);
assert.match(routes, /IslamicLandmarkDetailPage/);
assert.match(routes, /IslamicLandmarksMapExplorerPage/);

const detail = read("src/views/IslamicLandmarkDetailPage.tsx");
assert.match(detail, /significance/);
assert.match(detail, /description/);
assert.match(detail, /builtYear/);
assert.doesNotMatch(detail, /FloatingBackButton/);

const explorer = read("src/views/IslamicLandmarksMapExplorerPage.tsx");
assert.match(explorer, /ilm-explorer/);
assert.match(explorer, /LandmarksMap/);

console.log("=== لا مساس بنص الكتالوج عبر الصفحة ===");
const data = read("src/lib/islamic-landmarks-data.ts");
assert.match(data, /id: "masjid-haram"/);
assert.match(data, /FEATURED_LANDMARK_IDS/);

console.log("islamic-landmarks-discover-gate.test.ts: ok");
