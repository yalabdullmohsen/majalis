#!/usr/bin/env node
/**
 * Scholar recovery regression guard — ensures Kuwait scholars registry,
 * Salem lesson, sheikh routes, and automation registry stay wired.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getScholarAutomationRegistry,
  matchScholarByName,
  resolveScholarByIdOrSlug,
} from "../lib/scholar-automation-registry.mjs";

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

console.log("Scholar recovery verification\n");

const registry = getScholarAutomationRegistry();
ok(registry.length >= 14, `Registry has >= 14 scholars (found ${registry.length})`);

const salem = resolveScholarByIdOrSlug("salem-bin-saad-altaweel");
ok(Boolean(salem), "Salem bin Saad Al-Taweel profile exists");
ok(salem?.automation_sources?.length >= 1, "Salem has automation sources");

const salemMatch = matchScholarByName("سالم بن سعد الطويل");
ok(salemMatch.matched?.id === "salem-bin-saad-altaweel", "Salem name matching works");

const importSheikhs = JSON.parse(readFileSync(resolve(root, "data/import/01-sheikhs.json"), "utf8"));
ok(importSheikhs.some((s) => s.name.includes("سالم")), "01-sheikhs.json includes Salem");

const snapshot = JSON.parse(readFileSync(resolve(root, "scripts/lessons-seed.snapshot.json"), "utf8"));
const salemLesson = snapshot.find((r) => r.id === "sci-tawheed-saltaweel");
ok(Boolean(salemLesson), "Salem lesson sci-tawheed-saltaweel in seed snapshot");

const appTsx = readFileSync(resolve(root, "src/App.tsx"), "utf8");
ok(appTsx.includes('path="/sheikhs"'), "App.tsx has /sheikhs route");
ok(appTsx.includes('path="/sheikhs/:id"'), "App.tsx has /sheikh detail route");
ok(!appTsx.match(/path="\/sheikhs"[^>]*>\s*<Redirect to="\/lessons"/), "/sheikhs is not redirected to /lessons");

const lessonsService = readFileSync(resolve(root, "src/lib/lessons-service.ts"), "utf8");
ok(lessonsService.includes("mergeDbWithSeed"), "Lessons service merges catalog seed");
ok(lessonsService.includes("always merge"), "Catalog merge documented for production");

const serverData = readFileSync(resolve(root, "lib/supabase/server-data.ts"), "utf8");
ok(serverData.includes("mergeRegistrySheikhs"), "Server data merges registry sheikhs");
ok(serverData.includes("lessonsForScholar"), "Server sheikh detail uses normalized lesson matching");

const sheikhMatcher = readFileSync(resolve(root, "lib/cms/sheikh-matcher.mjs"), "utf8");
ok(sheikhMatcher.includes("scholar-automation-registry"), "Sheikh matcher uses automation registry");

const corpusSearch = readFileSync(resolve(root, "lib/scholarly-intelligence/corpus-search.mjs"), "utf8");
ok(corpusSearch.includes("searchRegistryScholars"), "Corpus search includes registry fallback");

const searchSuggestions = readFileSync(resolve(root, "src/lib/search-suggestions.ts"), "utf8");
ok(searchSuggestions.includes("KUWAIT_SCHOLAR_REGISTRY"), "Client search suggestions include scholars");

ok(existsSync(resolve(root, "src/lib/kuwait-sheikhs-registry.ts")), "kuwait-sheikhs-registry.ts exists");
ok(existsSync(resolve(root, "src/views/SheikhsPage.tsx")), "SheikhsPage.tsx exists");
ok(existsSync(resolve(root, "src/views/SheikhDetailPage.tsx")), "SheikhDetailPage.tsx exists");
ok(existsSync(resolve(root, "seo-prerender/lessons/sci-tawheed-saltaweel/index.html")), "Salem lesson SEO prerender exists");

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
