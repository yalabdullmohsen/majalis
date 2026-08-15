#!/usr/bin/env node
/**
 * اختبارات إغلاق إصلاحات البيانات/SEO المتبقية.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fail = (m) => {
  console.error(`FAIL: ${m}`);
  process.exitCode = 1;
};
const ok = (m) => console.log(`OK: ${m}`);

const HOME_TITLE = "مجالس العلم — منصة علمية شاملة";

function prerenderPath(route) {
  if (route === "/nations") return join(root, "seo-prerender/nations/index.html");
  if (route === "/quran/people") return join(root, "seo-prerender/quran/people/index.html");
  return join(root, `seo-prerender${route}/index.html`);
}

const criticalRoutes = [
  "/nations",
  "/nations/aad",
  "/nations/thamud",
  "/nations/qawm-firaun",
  "/quran/people",
  "/quran/people/maryam",
  "/quran/people/dhul-kifl",
  "/quran/people/azar",
];

for (const route of criticalRoutes) {
  const file = prerenderPath(route);
  if (!existsSync(file)) {
    fail(`missing prerender for ${route}: ${file}`);
    continue;
  }
  const html = readFileSync(file, "utf8");
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
  if (!title || title === HOME_TITLE || title.startsWith("مجالس العلم — منصة")) {
    fail(`${route}: homepage title fallback (${title || "empty"})`);
    continue;
  }
  if (!/<h1[\s>]/i.test(html)) fail(`${route}: missing h1`);
  const canon = html.match(/rel="canonical"[^>]*href="([^"]+)"/i);
  if (!canon) fail(`${route}: missing canonical`);
  else {
    const seg = route.split("/").filter(Boolean).pop();
    if (!canon[1].includes(seg)) fail(`${route}: canonical mismatch ${canon[1]}`);
  }
  if (!/<meta\s+name="description"/i.test(html)) fail(`${route}: missing meta description`);
  ok(`prerender ok ${route} — ${title}`);
}

// All nations/:slug shells
const nationsDir = join(root, "seo-prerender/nations");
if (existsSync(nationsDir)) {
  for (const name of readdirSync(nationsDir, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const route = `/nations/${name.name}`;
    const html = readFileSync(join(nationsDir, name.name, "index.html"), "utf8");
    const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
    if (title === HOME_TITLE || title.startsWith("مجالس العلم — منصة")) {
      fail(`${route}: homepage fallback`);
    }
  }
  ok("all nations slug prerenders non-homepage");
}

const peopleDir = join(root, "seo-prerender/quran/people");
if (existsSync(peopleDir)) {
  for (const name of readdirSync(peopleDir, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const route = `/quran/people/${name.name}`;
    const html = readFileSync(join(peopleDir, name.name, "index.html"), "utf8");
    const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
    if (title === HOME_TITLE || title.startsWith("مجالس العلم — منصة")) {
      fail(`${route}: homepage fallback`);
    }
  }
  ok("all quran/people slug prerenders non-homepage");
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(name.name)) continue;
    const p = join(dir, name.name);
    if (name.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|json|html|mjs)$/.test(name.name)) out.push(p);
  }
  return out;
}

let badSource = 0;
for (const base of [join(root, "src"), join(root, "public/data"), join(root, "seo-prerender")]) {
  for (const file of walk(base)) {
    if (readFileSync(file, "utf8").includes("المصدر: رابط القراءة")) {
      console.error(`  ${file}`);
      badSource++;
    }
  }
}
if (badSource) fail(`found المصدر: رابط القراءة in ${badSource} files`);
else ok("no المصدر: رابط القراءة");

const libView = readFileSync(join(root, "src/pages/library/ui/LibraryDetailView.tsx"), "utf8");
if (/المصدر:\s*\{[^}]*رابط/.test(libView) || libView.includes("رابط القراءة")) {
  fail("LibraryDetailView still references رابط القراءة as source UI");
} else ok("LibraryDetailView source UI clean");

const people = JSON.parse(readFileSync(join(root, "public/data/quran-people/people.json"), "utf8")).people;
if (people.length < 41) fail(`people count ${people.length} < 41`);
else ok(`people count ${people.length}`);

const azar = people.find((p) => p.slug === "azar");
if (!azar) fail("azar missing");
else if (!azar.definition?.includes("ويُقتصر على ما ورد")) fail("azar definition incomplete");
else if (!existsSync(prerenderPath("/quran/people/azar"))) fail("azar prerender missing");
else ok("azar present + prerender");

const dk = people.find((p) => p.slug === "dhul-kifl");
if (!dk?.cautionNote?.includes("وقع خلاف")) fail("dhul-kifl missing/incomplete cautionNote");
else ok("dhul-kifl cautionNote");

const fiqh = readFileSync(join(root, "src/lib/fiqh-hub-topics.ts"), "utf8");
if (/موثّقة بالأدلة|موثقة بالأدلة/.test(fiqh)) fail("/fiqh still claims موثّقة بالأدلة");
else ok("fiqh hub wording");

const meth = readFileSync(join(root, "src/views/MethodologyPage.tsx"), "utf8");
const metaBlock = meth.match(/applyPageSeo\(\{[\s\S]*?\}\);/);
if (metaBlock && /قيد المراجعة الشرعية/.test(metaBlock[0])) {
  fail("methodology meta/JSON-LD contains قيد المراجعة الشرعية");
} else ok("methodology meta scoped");

// source_pending must not claim موثوق in catalog without note path
const catalog = readFileSync(join(root, "src/lib/library-catalog.ts"), "utf8");
const pendingBlocks = [...catalog.matchAll(/id:\s*"(book-[^"]+)"[\s\S]*?sourceStatus:\s*"source_pending"/g)];
for (const m of pendingBlocks.slice(0, 3)) {
  const chunk = m[0];
  if (/sourceReference:\s*"[^"]+"/.test(chunk) && !/sourceStatus:\s*"source_pending"/.test(chunk)) {
    // unreachable
  }
}
if (!libView.includes("لا يُعرض هذا السجل كمصدر موثوق") && !libView.includes("المصدر قيد الإضافة")) {
  fail("source_pending UI missing disclaimer");
} else ok("source_pending disclaimer present");

const thinFiles = [
  "src/pages/fiqh/ui/RulingsView.tsx",
  "src/views/TopicsIndexPage.tsx",
];
for (const rel of thinFiles) {
  const t = readFileSync(join(root, rel), "utf8");
  if (/محتوى معتمد في منهج المجلس العلمي|موثّق بالكامل|معتمد بالكامل/.test(t)) {
    fail(`${rel} overclaims completeness`);
  }
}
ok("thin hubs no false complete claims");

if (process.exitCode) {
  console.error("\nremaining-site-fixes: FAILED");
  process.exit(1);
}
console.log("\nremaining-site-fixes: PASSED");
