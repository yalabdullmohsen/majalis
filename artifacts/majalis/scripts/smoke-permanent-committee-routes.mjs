#!/usr/bin/env node
/**
 * Smoke test — Permanent Committee section routes and integration markers.
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
const adminShell = readFileSync(resolve(root, "src/views/admin/AdminShell.tsx"), "utf8");
const searchPage = readFileSync(resolve(root, "src/views/SearchPage.tsx"), "utf8");
const localSearch = readFileSync(resolve(root, "src/lib/local-search-ext.ts"), "utf8");
const cmsTypes = readFileSync(resolve(root, "src/lib/cms/content-types.ts"), "utf8");
const cmsRegistry = readFileSync(resolve(root, "src/lib/cms/content-registry.ts"), "utf8");
const seo = readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8");
const sql = readFileSync(resolve(root, "../../supabase/permanent_committee_v1.sql"), "utf8");
const corpus = readFileSync(resolve(root, "lib/scholarly-intelligence/corpus-search.mjs"), "utf8");
const importReg = readFileSync(resolve(root, "lib/content-import/registry.mjs"), "utf8");
const lessonDetail = readFileSync(resolve(root, "src/views/LessonDetailPage.tsx"), "utf8");
const sideNav = readFileSync(resolve(root, "src/components/SideNavDrawer.tsx"), "utf8");

ok(app.includes('path="/permanent-committee"'), "App.tsx hub route");
ok(app.includes("/permanent-committee/search"), "App.tsx search route");
ok(app.includes("/permanent-committee/fatwas"), "App.tsx list route");
ok(app.includes("/permanent-committee/category/:name"), "App.tsx category route");
ok(app.includes("/permanent-committee/:id"), "App.tsx detail route");
ok(appRoutes.includes('path="/permanent-committee"'), "AppRoutes hub route");
ok(appRoutes.includes("PermanentCommitteeHubPage"), "AppRoutes PC page imports");
ok(nav.includes('href: "/permanent-committee"'), "PRIMARY_NAV /permanent-committee");
ok(nav.includes("اللجنة الدائمة"), "nav label اللجنة الدائمة");
ok(nav.includes("HOME_MORE_SECTIONS") && nav.includes("/permanent-committee"), "HOME_MORE_SECTIONS entry");
ok(adminShell.includes("permanent-committee"), "admin permanent-committee section");
ok(searchPage.includes("اللجنة الدائمة"), "SearchPage PC results group");
ok(searchPage.includes("permanentCommittee"), "SearchPage permanentCommittee counter");
ok(localSearch.includes("permanentCommittee"), "local-search-ext PC hits");
ok(cmsTypes.includes("permanent_committee_fatwa"), "CMS content type");
ok(cmsRegistry.includes("permanent_committee_fatwas"), "CMS registry table");
ok(seo.includes('"/permanent-committee"'), "seo-routes /permanent-committee");
ok(sql.includes("permanent_committee_fatwas"), "SQL fatwas table");
ok(sql.includes("permanent_committee_categories"), "SQL categories table");
ok(corpus.includes("searchPermanentCommittee"), "corpus-search PC integration");
ok(importReg.includes("permanent_committee_fatwas"), "content-import registry");
ok(lessonDetail.includes("RelatedPermanentCommittee"), "LessonDetailPage PC cross-link");
ok(sideNav.includes('"/permanent-committee"'), "SideNavDrawer icon map");

console.log(`\n=== Summary: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
