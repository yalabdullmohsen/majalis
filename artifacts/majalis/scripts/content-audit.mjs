#!/usr/bin/env node
/**
 * Content inventory audit — counts seed sections for admin reporting
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function countMatches(file, pattern) {
  const text = readFileSync(join(root, file), "utf8");
  return (text.match(pattern) || []).length;
}

const inventory = {
  adhkar: countMatches("src/lib/adhkar-seed.ts", /id: "adh-/g),
  adhkarCategories: countMatches("src/lib/adhkar-seed.ts", /id: "adh-/g) > 0
    ? countMatches("src/lib/adhkar-seed.ts", /id: "adh-[a-z-]+", name:/g)
    : 0,
  miracles: countMatches("src/lib/miracles-seed.ts", /id: "miracle-/g),
  fawaidCurated: countMatches("src/lib/fawaid-curated-seed.ts", /fawaid-curated-/g),
  fawaidSeed: countMatches("src/lib/fawaid-seed.ts", /"id": "seed-fawaid-/g),
  library: countMatches("src/lib/library-seed.ts", /id: "lib-/g),
  sheikhs: countMatches("src/lib/sheikhs-seed.ts", /id: "sheikh-/g),
  lessons: countMatches("src/lib/lessons-seed.ts", /id: "/g),
  qa: countMatches("src/lib/qa-seed.ts", /"id":/g),
};

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), inventory }, null, 2));
