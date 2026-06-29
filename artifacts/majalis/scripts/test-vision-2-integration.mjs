#!/usr/bin/env node
/**
 * Vision 2.0 Integration smoke test — verifies unified platform wiring.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0;
let fail = 0;

function ok(c, m) {
  if (c) {
    pass++;
    console.log(`PASS  ${m}`);
  } else {
    fail++;
    console.error(`FAIL  ${m}`);
  }
}

const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const appRoutes = readFileSync(resolve(root, "src/components/AppRoutes.tsx"), "utf8");
const nav = readFileSync(resolve(root, "src/lib/navigation.ts"), "utf8");
const unified = readFileSync(resolve(root, "lib/scholarly-intelligence/unified-search.mjs"), "utf8");
const corpus = readFileSync(resolve(root, "lib/scholarly-intelligence/corpus-search.mjs"), "utf8");
const resolver = readFileSync(resolve(root, "lib/scholarly-intelligence/url-resolver.mjs"), "utf8");
const dispatch = readFileSync(resolve(root, "lib/api-dispatch.mjs"), "utf8");
const lesson = readFileSync(resolve(root, "src/views/LessonDetailPage.tsx"), "utf8");
const sheikh = readFileSync(resolve(root, "src/components/seo/SheikhDetailClient.tsx"), "utf8");
const search = readFileSync(resolve(root, "src/views/SearchPage.tsx"), "utf8");

ok(unified.includes("searchExtendedCorpus"), "unified-search uses extended corpus");
ok(corpus.includes("research_papers"), "corpus-search queries research_papers");
ok(corpus.includes("RESEARCH_SEED_PAPERS"), "corpus-search has seed fallback");
ok(corpus.includes("quran_scientific_circles"), "corpus-search queries circles");
ok(resolver.includes("/research/"), "url-resolver research path");
ok(resolver.includes("/quran-scientific-circles/"), "url-resolver circles path");
ok(resolver.includes("/sheikhs/"), "url-resolver sheikh profile path");
ok(dispatch.includes("/api/search-autocomplete"), "search-autocomplete in api-dispatch");
ok(app.includes("/scholar-search"), "App scholar-search route");
ok(appRoutes.includes("/quran-scientific-circles"), "AppRoutes circles");
ok(appRoutes.includes("/research"), "AppRoutes research");
ok(appRoutes.includes("/scholar-search"), "AppRoutes scholar-search");
ok(!app.includes("/sheikhs/:id\"><Redirect to=\"/lessons\""), "sheikh redirect removed");
ok(nav.includes("/research"), "nav research");
ok(nav.includes("/quran-scientific-circles"), "nav circles");
ok(nav.includes("/scholar-search"), "nav scholar-search");
ok(nav.includes("/topics"), "nav topics in home sections");
ok(search.includes("الباحث العلمي"), "SearchPage scholar search title");
ok(search.includes("researchHits"), "SearchPage merges research into intelligent results");
ok(lesson.includes("RelatedKnowledge"), "LessonDetailPage smart relations");
ok(sheikh.includes("RelatedKnowledge"), "SheikhDetailClient smart relations");

console.log(`\n=== Vision 2.0 Integration: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
