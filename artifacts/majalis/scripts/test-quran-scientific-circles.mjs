#!/usr/bin/env node
/**
 * Smoke tests for الحلقات القرآنية والعلمية
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

console.log("Quran Scientific Circles — smoke tests\n");

// 1. SQL migration exists
const sqlPath = join(root, "supabase/quran_scientific_circles_v1.sql");
assert(existsSync(sqlPath), "SQL migration file exists");
const sql = readFileSync(sqlPath, "utf8");
assert(sql.includes("quran_scientific_circles"), "main table defined");
assert(sql.includes("quran_scientific_circle_categories"), "categories table defined");
assert(sql.includes("quran_scientific_circle_import_jobs"), "import jobs table defined");

// 2. Routes in App.tsx
const app = readFileSync(join(root, "src/App.tsx"), "utf8");
assert(app.includes("/quran-scientific-circles"), "list route registered");
assert(app.includes("/quran-scientific-circles/:id"), "detail route registered");

// 3. Navigation
const nav = readFileSync(join(root, "src/lib/navigation.ts"), "utf8");
assert(nav.includes("الحلقات القرآنية والعلمية"), "nav label present");

// 4. Admin
const adminNav = readFileSync(join(root, "src/lib/admin-navigation.ts"), "utf8");
assert(adminNav.includes("quran-scientific-circles"), "admin section slug");

// 5. SEO
const seoRoutes = readFileSync(join(root, "src/lib/seo-routes.json"), "utf8");
assert(seoRoutes.includes("/quran-scientific-circles"), "SEO route entry");

// 6. Seed data (static analysis)
const seedSrc = readFileSync(join(root, "src/lib/quran-scientific-circles-seed.ts"), "utf8");
const seedCount = (seedSrc.match(/id: "qsc-/g) || []).length;
assert(seedCount >= 8, `seed entries (${seedCount})`);
assert(seedSrc.includes('status: "published"'), "published seed items exist");
assert(seedSrc.includes('status: "review"'), "review seed items exist");
assert(seedSrc.includes("getPublicSeedCircles"), "public filter export");

// 7. Service (static analysis)
const serviceSrc = readFileSync(join(root, "src/lib/quran-scientific-circles-service.ts"), "utf8");
assert(serviceSrc.includes("applyFilters"), "filter logic present");
assert(serviceSrc.includes("sortCircles"), "sort logic present");
assert(serviceSrc.includes("arabicMatchAny"), "arabic search integrated");

// 8. Import
const importSrc = readFileSync(join(root, "src/lib/quran-scientific-circles-import.ts"), "utf8");
assert(importSrc.includes("parseCirclesJson"), "JSON import");
assert(importSrc.includes("parseCirclesCsv"), "CSV import");
assert(importSrc.includes("extractCircleFromPosterText"), "poster extraction");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
