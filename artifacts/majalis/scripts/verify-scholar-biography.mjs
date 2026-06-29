#!/usr/bin/env node
/**
 * Scholar Biography System — static verification + registry completeness audit.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${msg}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${msg}`);
  }
}

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

console.log("Scholar Biography System verification\n");

const requiredFiles = [
  "src/lib/scholar-biography/types.ts",
  "src/lib/scholar-biography/utils.ts",
  "src/lib/scholar-biography/index.ts",
  "src/components/sheikh/ScholarBiographySection.tsx",
  "src/components/sheikh/ScholarCollapsibleCard.tsx",
  "src/components/seo/SheikhDetailClient.tsx",
  "src/views/SheikhDetailPage.tsx",
  "src/views/admin/SheikhsSection.tsx",
  "supabase/sheikh_biography_v1.sql",
];

for (const f of requiredFiles) ok(existsSync(resolve(root, f)), `${f} exists`);

const migrationPaths = read("lib/migration-paths.mjs");
ok(migrationPaths.includes("sheikh_biography_v1.sql"), "Migration registered in migration-paths.mjs");

const applyMigrations = read("lib/api-handlers/cron/apply-migrations.js");
ok(applyMigrations.includes("sheikh-biography"), "apply-migrations scope sheikh-biography");

const supabaseTs = read("src/lib/supabase.ts");
ok(supabaseTs.includes("adminLogBiographyRevision"), "adminLogBiographyRevision exported");
ok(supabaseTs.includes("extractBiographySearchTerms"), "Scholar search uses biography_data");

const css = read("src/styles/design-system.css");
ok(css.includes(".scholar-bio-teaser"), "Biography teaser styles");
ok(css.includes(".scholar-collapse-card"), "Collapsible card styles");

const bioSection = read("src/components/sheikh/ScholarBiographySection.tsx");
ok(bioSection.includes("عرض السيرة"), "Biography teaser button label");
ok(!bioSection.match(/lorem|placeholder|TODO|dummy/i), "No placeholder text in biography UI");

const utils = read("src/lib/scholar-biography/utils.ts");
ok(utils.includes("getVerifiedDisplay"), "Verified-only display helper");
ok(utils.includes("buildPublicBiographySections"), "Public biography builder");

const enricher = read("lib/cms/sheikh-enricher.mjs");
ok(enricher.includes("verified: false"), "Official import marks biography unverified");
ok(enricher.includes('biography_status = "review"') || enricher.includes('biography_status: "review"'), "Official import queues review");

const registrySrc = read("src/lib/kuwait-sheikhs-registry.ts");
ok(registrySrc.includes("mergeScholarProfiles") || registrySrc.includes("KUWAIT_SCHOLAR_REGISTRY"), "Kuwait scholar registry wired");

const importSheikhs = JSON.parse(read("data/import/01-sheikhs.json"));
const lessonsSeed = JSON.parse(read("scripts/lessons-seed.snapshot.json"));
const scholarNames = new Set(importSheikhs.map((s) => s.name).filter(Boolean));
for (const row of lessonsSeed) {
  if (row.speaker_name) scholarNames.add(row.speaker_name);
}
const total = scholarNames.size;
let withBio = importSheikhs.filter((s) => String(s.bio || "").trim()).length;
const incomplete = importSheikhs.filter((s) => !String(s.bio || "").trim()).length;

console.log("\nData audit (import + seed sources):");
console.log(`  Unique scholar names tracked: ${total}`);
console.log(`  Import records with short bio: ${withBio}`);
console.log(`  Import records missing bio: ${incomplete}`);
console.log(`  Structured biography field slots: ${read("src/lib/scholar-biography/types.ts").match(/key: "/g)?.length || 18}`);

ok(total >= 14, `Scholar name corpus has >= 14 entries (${total})`);
ok(read("src/components/sheikh/ScholarBiographySection.tsx").includes("buildPublicBiographySections"), "Biography section uses verified builder");

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
