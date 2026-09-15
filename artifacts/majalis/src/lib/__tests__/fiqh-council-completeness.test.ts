/**
 * بوابة إزالة المجمع الفقهي من الأسطح العامة والاقتراحات.
 * node --import tsx src/lib/__tests__/fiqh-council-completeness.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const routes = read("src/AppRoutes.tsx");
assert.match(routes, /path="\/fiqh-council"/);
assert.match(routes, /path="\/fiqh-council\/:rest\*"/);
assert.ok((routes.match(/Redirect to="\/fiqh"/g) || []).length >= 2);
assert.doesNotMatch(routes, /FiqhCouncil\w*Page/);

for (const rel of [
  "src/lib/navigation.ts",
  "src/lib/feature-registry.ts",
  "src/lib/fiqh-hub-topics.ts",
  "src/lib/masarat-data.ts",
  "src/lib/home-feature-catalog.ts",
  "src/views/MadhahibPage.tsx",
  "src/views/AssistantPage.tsx",
  "src/views/admin/AdminShell.tsx",
  "src/views/AdminPage.tsx",
  "src/views/admin/DashboardSection.tsx",
]) {
  const src = read(rel);
  assert.doesNotMatch(src, /href:\s*["'`]\/fiqh-council/, `${rel}: لا رابط منتج`);
  assert.doesNotMatch(src, /المجمع الفقهي/, `${rel}: لا عنوان المجمع`);
}

const platformSearch = read("src/lib/platform-search.ts");
assert.doesNotMatch(platformSearch, /searchFiqhCouncilSeed/);
assert.match(platformSearch, /fiqh_decisions[\s\S]{0,120}=\s*\[\]/);

const scholarly = read("src/lib/scholarly-intelligence-service.ts");
assert.doesNotMatch(scholarly, /المجمع الفقهي|\/fiqh-council/);
assert.match(scholarly, /fiqh:\s*"الفقه"/);

const ia = read("src/lib/ia-final-structure.ts");
assert.match(ia, /"المجمع الفقهي"/);
assert.match(ia, /"\/fiqh-council"\s*:\s*"\/fiqh"/);

assert.doesNotMatch(read("src/lib/seo-nav-labels.json"), /fiqh-council|المجمع الفقهي/);

if (existsSync(resolve(root, "public/sitemap.xml"))) {
  assert.doesNotMatch(read("public/sitemap.xml"), /\/fiqh-council/);
}

/* بقايا قرار فقهي / CMS / بحث / اقتراحات */
assert.doesNotMatch(read("src/lib/updates-seed.ts"), /fiqh_decision|قرار فقهي/);
assert.doesNotMatch(read("src/features/search/search-kind-i18n.ts"), /fiqh_decision|قرار فقهي/);
assert.doesNotMatch(read("src/features/search/kind-priority.ts"), /fiqh_decision/);
assert.doesNotMatch(read("src/lib/cms/content-types.ts"), /fiqh_decision|قرار فقهي/);
assert.doesNotMatch(read("src/lib/cms/content-registry.ts"), /fiqh_decision/);
assert.doesNotMatch(read("src/lib/rag-service.ts"), /fiqh_decision|قرار مجمع/);
assert.doesNotMatch(read("lib/scholarly-intelligence/url-resolver.mjs"), /قرار فقهي|المجمع الفقهي/);
assert.match(read("src/lib/scholarly-intelligence-service.ts"), /isBannedPublicRelationClient|fiqh_decision/);
assert.match(read("lib/scholarly-intelligence/recommendations.mjs"), /isBannedPublicRelation/);

console.log("fiqh-council-completeness (removal gate): OK");
