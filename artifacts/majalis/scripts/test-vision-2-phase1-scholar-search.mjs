#!/usr/bin/env node
/** Vision 2.0 Phase 1 — Scholar Search smoke tests */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

console.log("Vision 2.0 Phase 1 — Scholar Search\n");

assert(existsSync(join(root, "lib/scholarly-intelligence/corpus-search.mjs")), "corpus-search module");
assert(existsSync(join(root, "lib/scholarly-intelligence/corpus-arbaeen.mjs")), "arbaeen index");
assert(existsSync(join(root, "lib/api-handlers/search-autocomplete.js")), "autocomplete API");

const unified = readFileSync(join(root, "lib/scholarly-intelligence/unified-search.mjs"), "utf8");
assert(unified.includes("searchExtendedCorpus"), "unified search integrates corpus");

const app = readFileSync(join(root, "src/App.tsx"), "utf8");
assert(app.includes("/scholar-search"), "scholar-search route");

const searchPage = readFileSync(join(root, "src/views/SearchPage.tsx"), "utf8");
assert(searchPage.includes("الباحث العلمي الإسلامي"), "scholar search branding");
assert(!searchPage.includes("setLoading(false);\n        return;\n      }"), "no early short-circuit");

const server = readFileSync(join(root, "server/index.mjs"), "utf8");
assert(server.includes("search-autocomplete"), "server autocomplete route");

const seo = readFileSync(join(root, "src/lib/seo-routes.json"), "utf8");
assert(seo.includes("/scholar-search"), "SEO entry");

const roadmap = readFileSync(join(root, "reports/vision-2.0-roadmap.md"), "utf8");
assert(roadmap.includes("Phase 1"), "vision roadmap exists");

// Dynamic import corpus search
const { searchExtendedCorpus } = await import("../lib/scholarly-intelligence/corpus-search.mjs");
const quranResults = await searchExtendedCorpus(null, "البقرة", 5);
assert(quranResults.some((r) => r.kind === "quran"), "quran corpus search works offline");

const hadithResults = await searchExtendedCorpus(null, "النيات", 5);
assert(hadithResults.some((r) => r.kind === "hadith"), "hadith corpus search works");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
