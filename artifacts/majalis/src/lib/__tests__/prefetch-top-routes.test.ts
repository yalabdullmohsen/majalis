/**
 * بوابة: المسارات الأربعة الأكثر زيارة تُحمَّل مسبقاً عند الخمول.
 * تشغيل: npx tsx src/lib/__tests__/prefetch-top-routes.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = readFileSync(resolve(root, "src/lib/prefetch-top-routes.ts"), "utf8");
const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");

assert.match(src, /HomePage/);
assert.match(src, /LessonsPage/);
assert.match(src, /PrayerTimesPage/);
assert.match(src, /QuranKnowledgeHubPage/);
assert.match(src, /requestIdleCallback/);
assert.match(main, /prefetchTopRoutesOnIdle/);
console.log("  ✓ prefetch-top-routes على الخمول");
