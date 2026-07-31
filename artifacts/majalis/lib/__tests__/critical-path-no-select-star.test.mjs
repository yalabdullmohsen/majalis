/**
 * Guard: critical client paths must not use select('*').
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const CRITICAL = [
  "src/lib/supabase.ts",
  "src/lib/lessons-service.ts",
  "src/lib/prayer-times.ts",
  "src/components/home/HomeUpcomingCourses.tsx",
  "lib/api-handlers/prayer-times.js",
];

const STAR = /\.select\(\s*[`'"]\s*\*/;

console.log("=== critical-path-no-select-star ===\n");
for (const rel of CRITICAL) {
  const src = readFileSync(join(root, rel), "utf8");
  assert.doesNotMatch(src, STAR, `${rel} must not select('*') / select(\`*\`)`);
  console.log(`  ✓ ${rel}`);
}

const supabase = readFileSync(join(root, "src/lib/supabase.ts"), "utf8");
assert.match(supabase, /LESSON_LIST_COLUMNS/);
assert.match(supabase, /fetchApprovedLessonsFromDb[\s\S]*\.limit\(500\)/);
console.log("  ✓ fetchApprovedLessonsFromDb uses column allowlist + limit");

console.log("\nAll critical-path select('*') gates passed.\n");
