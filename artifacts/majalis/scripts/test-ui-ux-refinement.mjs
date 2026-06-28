#!/usr/bin/env node
/**
 * UI/UX refinement smoke tests — dark mode tokens, nav SSOT, mushaf, tasbih.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src");

let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  failed++;
  console.error(`  ✗ ${name}${detail ? `: ${detail}` : ""}`);
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

console.log("\n=== UI/UX Refinement Tests ===\n");

// 1. Dark mode tokens
const tokens = read("src/styles/reading-tokens.css");
if (tokens.includes('html[data-theme="dark"]') && !tokens.includes("#000000") && tokens.includes("--surface-base: #121916")) {
  ok("Dark mode tokens — comfortable bg, no pure black");
} else {
  fail("Dark mode tokens");
}

// 2. Semantic reading colors
const highlighted = read("src/styles/highlighted-content.css");
if (
  highlighted.includes("--reading-question") ||
  highlighted.includes("highlighted-card__question") &&
  highlighted.includes("highlighted-card__meta-row--source")
) {
  ok("Semantic content card colors");
} else {
  fail("Semantic content card colors");
}

// 3. Unified navigation SSOT
const nav = read("src/lib/navigation.ts");
if (
  nav.includes("UNIFIED_NAV_GROUPS") &&
  nav.includes("getMobileMoreNav") &&
  nav.includes("getSideNavGroups") &&
  !nav.includes("export const MOBILE_MORE_NAV")
) {
  ok("Navigation single source of truth");
} else {
  fail("Navigation SSOT");
}

// Primary nav items exist in unified groups
const primaryMatch = nav.match(/export const PRIMARY_NAV[^=]*=\s*\[([\s\S]*?)\];/);
const groupsMatch = nav.match(/export const UNIFIED_NAV_GROUPS[^=]*=\s*\[([\s\S]*?)\];/);
if (primaryMatch && groupsMatch) {
  const primaryHrefs = [...primaryMatch[1].matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);
  const allHrefs = [...groupsMatch[1].matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1].split("?")[0]);
  const missing = primaryHrefs.filter((h) => !allHrefs.includes(h.split("?")[0]));
  if (missing.length === 0) ok("PRIMARY_NAV subset of UNIFIED_NAV_GROUPS");
  else fail("PRIMARY_NAV subset", missing.join(", "));
} else {
  fail("PRIMARY_NAV validation");
}

// 4. Mushaf module & route
if (existsSync(join(src, "lib/mushaf.ts")) && existsSync(join(src, "views/MushafPage.tsx"))) {
  ok("Mushaf page files exist");
} else {
  fail("Mushaf page files");
}

const routes = read("src/components/AppRoutes.tsx");
const appTsx = read("src/App.tsx");
if (routes.includes('/quran/mushaf') && appTsx.includes('/quran/mushaf')) {
  ok("Mushaf route registered (App.tsx + AppRoutes)");
} else {
  fail("Mushaf route", "missing in App.tsx or AppRoutes");
}

const mushafLib = read("src/lib/mushaf.ts");
if (mushafLib.includes("MUSHAF_TOTAL_PAGES = 604") && mushafLib.includes("fetchMushafPage")) {
  ok("Mushaf 604-page API integration");
} else {
  fail("Mushaf API");
}

// 5. Tasbih pro features
const tasbeeh = read("src/lib/tasbeeh-storage.ts");
const counter = read("src/components/reading/TasbeehCounter.tsx");
const hook = read("src/hooks/useTasbeehCounter.ts");
if (
  tasbeeh.includes('"open"') &&
  tasbeeh.includes("readTasbeehHistory") &&
  counter.includes("decrement") &&
  hook.includes("isOpenMode")
) {
  ok("Professional tasbih counter");
} else {
  fail("Tasbih counter");
}

// 6. Quran subnav separation
const subnav = read("src/components/quran/QuranSubnav.tsx");
if (subnav.includes("/quran/mushaf") && subnav.includes("التلاوات الصوتية")) {
  ok("Quran subnav — mushaf vs recitation separated");
} else {
  fail("Quran subnav");
}

// 7. FOUC prevention
const html = read("index.html");
if (html.includes("majalis-theme-preference") && html.includes('dataset.theme')) {
  ok("Theme FOUC prevention in index.html");
} else {
  fail("Theme FOUC script");
}

// 8. reading-tokens imported
const main = read("src/main.tsx");
if (main.includes("reading-tokens.css")) {
  ok("Reading tokens imported in main.tsx");
} else {
  fail("Reading tokens import");
}

console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`);
process.exit(failed > 0 ? 1 : 0);
