#!/usr/bin/env node
/**
 * بوابة ما قبل النشر — فحوصات مصدر وبناء محلي.
 *
 * Usage:
 *   node scripts/predeploy-guard.mjs
 *   node scripts/predeploy-guard.mjs --post-build   # بعد pnpm run build
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  MAJALIS_ROOT,
  REPO_ROOT,
  ensureReportsDir,
  readMajalis,
  majalisExists,
  writeJsonReport,
  runNode,
  parseSitemapLocs,
  scanTextForForbiddenBrand,
  SENSITIVE_SITEMAP_PREFIXES,
} from "./release-guard-lib.mjs";
import { isSitemapDenied } from "../artifacts/majalis/scripts/seo-index-policy.mjs";

const postBuild = process.argv.includes("--post-build");
const failures = [];
const warnings = [];
const checks = [];

function fail(msg) {
  failures.push(msg);
  checks.push({ name: msg.split(":")[0], ok: false, detail: msg });
}

function warn(msg) {
  warnings.push(msg);
  checks.push({ name: msg.split(":")[0], ok: true, warn: msg });
}

function pass(name, detail = "OK") {
  checks.push({ name, ok: true, detail });
}

function runMajalisScript(scriptRel, label, opts = {}) {
  const r = runNode(MAJALIS_ROOT, scriptRel, label, [], opts);
  if (!r.ok) {
    fail(`${label}: ${(r.stderr || r.stdout).split("\n").slice(-3).join(" ")}`);
  } else {
    pass(label);
  }
  return r.ok;
}

console.log("▶ predeploy-guard — سُنّة\n");

// ── 1) حراس موجودون ───────────────────────────────────────────────────────
runMajalisScript("scripts/test-identity.mjs", "test-identity");
runMajalisScript("scripts/check-copy-quality.js", "check-copy-quality");
runMajalisScript("scripts/master-regression-guard.mjs", "master-regression-guard");

if (majalisExists("public/sitemap.xml")) {
  runMajalisScript("scripts/check-seo-indexing.js", "check-seo-indexing");
} else {
  warn("sitemap: public/sitemap.xml غير موجود محليًا — سيُولَّد عند البناء");
}

runMajalisScript("scripts/check-pwa.js", "check-pwa");

// ── 2) robots + manifest ────────────────────────────────────────────────────
if (!majalisExists("public/robots.txt")) {
  fail("robots.txt: مفقود");
} else {
  const robots = readMajalis("public/robots.txt");
  if (!/Sitemap:\s*https:\/\/www\.ssunnah\.com\/sitemap\.xml/i.test(robots)) {
    fail("robots.txt: لا يشير إلى sitemap الرسمي");
  }
  if (!/Disallow:\s*\/admin/i.test(robots)) fail("robots.txt: بلا Disallow /admin");
  if (!/Disallow:\s*\/search/i.test(robots)) fail("robots.txt: بلا Disallow /search");
  if (scanTextForForbiddenBrand(robots).length) fail("robots.txt: اسم تجاري قديم");
  else pass("robots.txt");
}

const manifestPaths = ["public/site.webmanifest", "public/manifest.webmanifest"];
const manifestPath = manifestPaths.find((p) => majalisExists(p));
if (!manifestPath) {
  fail("manifest: site.webmanifest مفقود");
} else {
  try {
    const m = JSON.parse(readMajalis(manifestPath));
    if (m.name !== "سُنّة" && m.name !== "سنّة") fail(`manifest: name=${m.name}`);
    else if (m.dir !== "rtl") fail(`manifest: dir=${m.dir}`);
    else pass("manifest");
  } catch {
    fail("manifest: JSON غير صالح");
  }
}

// ── 3) service worker ───────────────────────────────────────────────────────
if (!majalisExists("public/sw.js")) {
  fail("sw.js: مفقود");
} else {
  const sw = readMajalis("public/sw.js");
  if (!/ssunnah-v\$\{SW_BUILD_ID\}/.test(sw)) fail("sw.js: كاش بلا بادئة ssunnah ديناميكية");
  if (!/LEGACY_CACHE_PREFIXES/.test(sw) || !/majlisilm-v/.test(sw)) {
    warn("sw.js: تحقق يدوي من تنظيف كاش majlisilm القديم");
  } else pass("sw.js legacy cleanup");
  if (/cache\.add\s*\(\s*["']\/["']\s*\)/.test(sw)) fail("sw.js: يخزّن / في الكاش");
  if (scanTextForForbiddenBrand(sw, { allowLegacyCache: true }).length) {
    fail("sw.js: اسم تجاري قديم خارج سياق التنظيف");
  } else pass("sw.js brand");
}

// ── 4) لا مراجعة داخلية / مسارات حساسة ───────────────────────────────────
const routes = readMajalis("src/AppRoutes.tsx");
if (/content-review|internal\/content-review/i.test(routes)) {
  fail("routes: مسار مراجعة داخلية مفعّل");
} else pass("no content-review route");

for (const p of ["/internal/content-review", "/content-review"]) {
  if (routes.includes(`path="${p}"`) || routes.includes(`path='${p}'`)) {
    fail(`routes: ${p} مسجّل`);
  }
}

// ── 5) مصحف/تفسير baseline ─────────────────────────────────────────────────
const mushafCss = readMajalis("src/features/mushaf-madinah/mushaf-madinah.css");
for (const needle of [
  "--mm-line-height: 1.85",
  "line-height: var(--mm-line-height)",
]) {
  if (!mushafCss.includes(needle)) fail(`mushaf CSS: baseline مفقود «${needle}»`);
}
if (/\.mm-ayah[^}]*font-size:\s*\d+px|\.mm-line[^}]*font-size:\s*\d+px/.test(mushafCss)) {
  fail("mushaf CSS: font-size ثابت على آيات المصحف");
} else pass("mushaf CSS baseline");

const tafsirCss = readMajalis("src/styles/pages/tafsir.css");
if (!tafsirCss.includes("line-height: 1.85")) fail("tafsir CSS: line-height 1.85 مفقود");
if (/\.tf-body[^}]*font-size:\s*1\.[2-9]/.test(tafsirCss)) {
  fail("tafsir CSS: تكبير خط التفسير");
} else pass("tafsir CSS baseline");

// ── 6) metadata / JSON-LD في index.html ───────────────────────────────────
const indexHtml = readMajalis("index.html");
if (scanTextForForbiddenBrand(indexHtml).length) fail("index.html: اسم تجاري قديم في metadata");
else pass("index.html brand");

// ── 7) seo-routes — لا مسارات حساسة في sitemap ────────────────────────────
const seoRoutes = JSON.parse(readMajalis("src/lib/seo-routes.json"));
for (const route of seoRoutes.routes || []) {
  if (!route.sitemap) continue;
  const p = String(route.path || "").replace(/\/$/, "") || "/";
  if (isSitemapDenied(p)) fail(`seo-routes: ${p} في sitemap وممنوع`);
  for (const pre of SENSITIVE_SITEMAP_PREFIXES) {
    if (p === pre || p.startsWith(`${pre}/`)) fail(`seo-routes: ${p} حساس وفي sitemap`);
  }
}
pass("seo-routes sitemap policy");

// ── 8) post-build ─────────────────────────────────────────────────────────
let buildOk = !postBuild;
if (postBuild) {
  const dist = resolve(MAJALIS_ROOT, "dist");
  if (!existsSync(dist)) {
    fail("build: dist/ مفقود — شغّل pnpm run build أولًا");
  } else {
    buildOk = true;
    pass("build dist exists");

    if (!existsSync(resolve(dist, "index.html"))) fail("dist: index.html مفقود");
    if (!existsSync(resolve(dist, "sw.js"))) fail("dist: sw.js مفقود");

    if (existsSync(resolve(dist, "version.json"))) {
      try {
        const version = JSON.parse(readFileSync(resolve(dist, "version.json"), "utf8"));
        if (!version.shortCommit) fail("version.json: shortCommit مفقود");
        if (version.commit && /^[a-f0-9]{40}$/i.test(version.commit)) {
          fail("version.json: يسرب commit كامل — استخدم shortCommit فقط");
        } else pass("version.json privacy");
      } catch {
        fail("version.json: غير صالح");
      }
    }

    if (existsSync(resolve(dist, "sitemap.xml"))) {
      const locs = parseSitemapLocs(readFileSync(resolve(dist, "sitemap.xml"), "utf8"));
      for (const loc of locs) {
        if (isSitemapDenied(loc)) fail(`dist/sitemap: ${loc} ممنوع`);
        for (const pre of SENSITIVE_SITEMAP_PREFIXES) {
          if (loc === pre || loc.startsWith(`${pre}/`)) fail(`dist/sitemap: ${loc} حساس`);
        }
        if (/content-review|internal\/review/i.test(loc)) fail(`dist/sitemap: ${loc} مراجعة داخلية`);
      }
      pass("dist/sitemap");
    }

    runMajalisScript("scripts/verify-deploy-cache-versioning.mjs", "verify-deploy-cache-versioning");
  }
} else {
  warn("post-build: لم يُفحص dist/ — أعد التشغيل بـ --post-build بعد البناء");
}

// ── تقرير ───────────────────────────────────────────────────────────────────
const result = {
  at: new Date().toISOString(),
  postBuild,
  buildOk,
  failures,
  warnings,
  checks,
  ok: failures.length === 0,
};

ensureReportsDir();
writeJsonReport(".release-predeploy.json", result);

console.log(`\n📊 predeploy-guard`);
console.log(`   فشل: ${failures.length}`);
console.log(`   تحذيرات: ${warnings.length}`);

if (failures.length) {
  console.error("\n❌ BLOCK — لا تنشر:");
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

if (warnings.length) {
  console.warn("\n⚠️  تحذيرات:");
  for (const w of warnings) console.warn(`   • ${w}`);
}

console.log("\n✅ predeploy-guard — PASS\n");
