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
assert.equal(existsSync(resolve(root, "src/views/FiqhCouncilPage.tsx")), false);
assert.equal(existsSync(resolve(root, "src/components/fiqh-council")), false);
assert.equal(existsSync(resolve(root, "src/lib/fiqh-council-seed.ts")), false);
assert.ok(existsSync(resolve(root, "src/lib/fiqh/nawazil-topics.ts")));

assert.doesNotMatch(read("src/pages/account/MemorizePage.tsx"), /مجلس علم/);
assert.doesNotMatch(read("scripts/generate-seo.mjs"), /خوادم مجالس/);
assert.doesNotMatch(read("src/lib/scientific-announcements-seed.ts"), /مجمع فقهي/);

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

/* Surfaces that must not advertise the removed product */
assert.doesNotMatch(read("index.html"), /\/fiqh-council|المجمع الفقهي/);
const generateSeo = read("scripts/generate-seo.mjs");
assert.doesNotMatch(
  generateSeo,
  /url:\s*["'`]\/fiqh-council|href=["'`][^"'`]*\/fiqh-council|name:\s*["'`]المجمع الفقهي["'`]/,
  "generate-seo: لا روابط منتج للمجمع",
);
for (const rel of [
  "seo-prerender/fiqh/index.html",
  "seo-prerender/rulings/index.html",
  "seo-prerender/zakat/index.html",
  "seo-prerender/fiqh-qawaid/index.html",
  "seo-prerender/maqasid-sharia/index.html",
  "seo-prerender/fikr-waqia/index.html",
]) {
  if (!existsSync(resolve(root, rel))) continue;
  assert.doesNotMatch(read(rel), /\/fiqh-council/, `${rel}: بلا روابط مجمع`);
}


/* r3: API + sync + catalog — لا سطح حيّ للمجمع */
{
  const apiSearch = read("lib/api-handlers/search.js");
  assert.doesNotMatch(apiSearch, /\.from\(\s*["']fiqh_council_items["']\s*\)/);
  assert.doesNotMatch(apiSearch, /type:\s*"fiqh_decision"/);
  assert.doesNotMatch(apiSearch, /href:\s*`\/fiqh-council\//);
  assert.match(apiSearch, /async function searchFiqh/, "searchFiqh يبقى stub فارغًا");
  const fiqhFn = apiSearch.slice(apiSearch.indexOf("async function searchFiqh"));
  assert.match(fiqhFn.slice(0, 280), /return \[\]/);
}
{
  const sync = read("lib/sync-data.mjs");
  assert.doesNotMatch(sync, /runFiqhCouncilSync\(/);
  assert.doesNotMatch(sync, /from "\.\/fiqh-council-sync/);
  assert.match(sync, /fiqh_council_product_removed|removed:\s*true/);
}
{
  const inst = read("src/data/institutions-catalog.json");
  assert.doesNotMatch(inst, /"fiqh-council-mecca"/);
  assert.doesNotMatch(inst, /مجمع الفقه الإسلامي الدولي/);
}
{
  const snap = read("scripts/platform-seed.snapshot.json");
  assert.match(snap, /"fiqh_decisions"\s*:\s*\[\s*\]/);
}

/* r3: sitemap / SEO / research — لا استعلامات ولا عناوين منتج للمجمع */
{
  const sitemap = read("lib/cms/sitemap-builder.mjs");
  assert.doesNotMatch(sitemap, /\.from\(\s*["']fiqh_council_items["']\s*\)/);
  assert.doesNotMatch(sitemap, /\.from\(\s*["']fiqh_council_issues["']\s*\)/);
  assert.doesNotMatch(sitemap, /قرار مجمعي/);
  assert.doesNotMatch(sitemap, /\/fiqh-council/);
}
{
  const seo = read("lib/auto-knowledge-engine/seo-engine.mjs");
  assert.doesNotMatch(seo, /المجمع الفقهي/);
  assert.doesNotMatch(seo, /\/fiqh-council/);
  assert.doesNotMatch(seo, /fiqh_decision:\s*[`'"]/);
}
{
  const research = read("lib/fiqh-research-engine.mjs");
  assert.doesNotMatch(research, /\.from\(\s*["']fiqh_council_items["']\s*\)/);
  assert.doesNotMatch(research, /search_fiqh_council_advanced/);
  assert.doesNotMatch(research, /المجمع الفقهي/);
  const searchFn = research.slice(research.indexOf("export async function searchPublishedItems"));
  assert.match(searchFn.slice(0, 400), /return \[\]/);
}
{
  const landmarks = read("src/lib/islamic-landmarks-data.ts");
  assert.doesNotMatch(landmarks, /ويُعرض تعريفًا خاصًا/);
}

/* r4: لا مورد/تنبيه/نشر حي لقرارات المجمع + مسار المعلمين SPA */
{
  const openCfg = read("lib/open-platform/config.mjs");
  assert.doesNotMatch(openCfg, /fiqh_decision:\s*\{/);
  assert.doesNotMatch(openCfg, /fiqh_decision\.published/);
  assert.doesNotMatch(openCfg, /قرارات المجامع الفقهية/);
}
{
  const notif = read("lib/digital-learning/notifications.mjs");
  assert.doesNotMatch(notif, /new_fiqh_decision|قرار فقهي/);
}
{
  const pub = read("lib/knowledge-engine/publisher.mjs");
  assert.doesNotMatch(pub, /fiqh_decision:\s*["']fiqh_council_items["']/);
}
{
  const vercel = read("vercel.json");
  assert.match(vercel, /"\/teachers"/);
  assert.match(vercel, /"\/teachers\/:path\*"/);
  assert.match(vercel, /"destination":\s*"\/index\.html"/);
}
{
  const routes = read("src/AppRoutes.tsx");
  assert.match(routes, /path="\/sheikhs"[^>]*>[\s\S]{0,80}Redirect to="\/teachers"/);
}

console.log("fiqh-council-completeness (removal gate): OK");
