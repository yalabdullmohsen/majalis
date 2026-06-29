#!/usr/bin/env node
/** Phase 1 platform redesign verification */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [];

function pass(n, d = "") { checks.push({ ok: true, n, d }); console.log(`  ✓ ${n}${d ? ` — ${d}` : ""}`); }
function fail(n, d = "") { checks.push({ ok: false, n, d }); console.log(`  ✗ ${n}${d ? ` — ${d}` : ""}`); }

console.log("\n=== Platform Redesign Phase 1 Verification ===\n");

for (const f of [
  "src/styles/tokens-2026.css",
  "src/lib/icons.tsx",
  "src/components/radio/RadioPlayerProvider.tsx",
  "src/views/QuranRadioPage.tsx",
]) {
  fs.existsSync(path.join(ROOT, f)) ? pass(`file ${f}`) : fail(`file ${f}`);
}

const mainTsx = fs.readFileSync(path.join(ROOT, "src/main.tsx"), "utf8");
mainTsx.includes("tokens-2026.css") ? pass("tokens loaded in main.tsx") : fail("tokens loaded");

const nav = fs.readFileSync(path.join(ROOT, "src/lib/navigation.ts"), "utf8");
nav.includes("discover") && nav.includes("NAV_GROUPS") ? pass("navigation restructured") : fail("navigation");

const home = fs.readFileSync(path.join(ROOT, "src/views/HomePage.tsx"), "utf8");
for (const s of ["HomeFeaturedSheikhs", "HomeResearchSpotlight", "HomeCirclesSpotlight", "home-page--v4"]) {
  home.includes(s) ? pass(`home ${s}`) : fail(`home ${s}`);
}

const stations = fs.readFileSync(path.join(ROOT, "src/lib/quran-radio-stations.ts"), "utf8");
const stationCount = (stations.match(/id: "/g) || []).length;
stationCount === 9 ? pass("radio stations deduped", "9 stations") : fail("radio stations", String(stationCount));

const mushafIdx = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/mushaf/page-index.json"), "utf8"));
mushafIdx.totalPages === 604 && mushafIdx.surahs?.length === 114
  ? pass("mushaf index 604/114")
  : fail("mushaf index");

const sidebar = fs.readFileSync(path.join(ROOT, "src/components/mushaf/MushafSidebar.tsx"), "utf8");
!sidebar.includes("slice(0, 120)") ? pass("mushaf sidebar all pages") : fail("mushaf sidebar truncated");

const app = fs.readFileSync(path.join(ROOT, "src/App.tsx"), "utf8");
app.includes("RadioPlayerProvider") && app.includes("/kuwait-mushaf") ? pass("App radio + mushaf redirect") : fail("App wiring");

console.log("\n--- verify:kuwait-mushaf ---\n");
const mushaf = spawnSync("node", ["scripts/verify-kuwait-mushaf.mjs"], { cwd: ROOT, encoding: "utf8" });
if (mushaf.status === 0) pass("verify:kuwait-mushaf");
else fail("verify:kuwait-mushaf", mushaf.stderr?.slice(0, 200));

const failed = checks.filter((c) => !c.ok);
console.log(`\n=== ${checks.length - failed.length}/${checks.length} passed ===\n`);
process.exit(failed.length ? 1 : 0);
