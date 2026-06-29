#!/usr/bin/env node
/**
 * Smoke test — scientific research routes and modules.
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
const dispatch = readFileSync(resolve(root, "lib/api-dispatch.mjs"), "utf8");
const seo = readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8");
const sql = readFileSync(resolve(root, "supabase/scientific_research_v1.sql"), "utf8");

ok(app.includes('path="/research"'), "App.tsx route /research");
ok(app.includes("/research/upload"), "App.tsx route upload");
ok(app.includes("/research/author/:slug"), "App.tsx route author");
ok(app.includes("/scientific-research"), "App.tsx legacy redirect");
ok(appRoutes.includes('path="/research"'), "AppRoutes route /research");
ok(app.includes("ScientificResearchPage"), "ScientificResearchPage import");
ok(nav.includes("الأبحاث العلمية"), "nav label");
ok(nav.includes('href: "/research"'), "nav href /research");
ok(seo.includes('"/research"'), "seo-routes /research");
ok(dispatch.includes("/api/scientific-research"), "API dispatch");
ok(sql.includes("research_papers"), "SQL research_papers table");
ok(sql.includes("research_authors"), "SQL research_authors");
ok(sql.includes("research_downloads"), "SQL research_downloads");
ok(sql.includes("research_favorites"), "SQL research_favorites");
ok(sql.includes("research_reviews"), "SQL research_reviews");

console.log(`\n=== Summary: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
