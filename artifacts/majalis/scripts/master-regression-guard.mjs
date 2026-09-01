#!/usr/bin/env node
/**
 * حارس regression مركزي — ثوابت سُنّة قبل build/merge.
 * تشغيل: node scripts/master-regression-guard.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { isSitemapDenied } from "./seo-index-policy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(resolve(root, rel), "utf8");

const critical = [];
const high = [];

function fail(level, msg) {
  (level === "critical" ? critical : high).push(msg);
}

function runNode(scriptRel, label) {
  const r = spawnSync(process.execPath, [resolve(root, scriptRel)], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (r.status !== 0) {
    fail("critical", `${label}: ${(r.stderr || r.stdout || "").trim().split("\n").slice(-3).join(" ")}`);
  }
}

console.log("▶ master-regression-guard — سُنّة\n");

// ── 1) /more ────────────────────────────────────────────────────────────────
const FORBIDDEN_NAV = ["/more"];
const NAV_SOURCES = [
  "site.config.json",
  "src/config/navigation.ts",
  "src/lib/services-center-nav.ts",
  "src/lib/nav-map.ts",
  "src/components/BottomNavBar.tsx",
  "index.html",
];

for (const file of NAV_SOURCES) {
  const text = read(file);
  for (const p of FORBIDDEN_NAV) {
    if (new RegExp(`["']${p.replace(/\//g, "\\/")}["']`).test(text)) {
      // prerenderNav و seo-routes redirect مسموح — site.config prerenderNav لا يحتوي /more
      if (file === "site.config.json" && text.includes(`"path": "${p}"`)) {
        fail("critical", `${file}: ${p} في prerenderNav`);
      } else if (file !== "site.config.json") {
        if (file.includes("navigation.ts") && text.includes('"/more"')) {
          // BottomNavBar mapping /more→sections مسموح كalias داخلي فقط إن لم يظهر في BOTTOM_NAV href
          if (file === "src/components/BottomNavBar.tsx" && /HREF_TO_ID[\s\S]*"\/more"/.test(text)) {
            continue;
          }
        }
        if (
          /href:\s*["']\/more["']|href=["']\/more["']|path:\s*["']\/more["']/.test(text) &&
          !file.includes("AppRoutes") &&
          !file.includes("sections.registry")
        ) {
          fail("critical", `${file}: رابط تنقل مباشر إلى /more — استخدم /sections`);
        }
      }
    }
  }
}

// روابط مستخدم صريحة (مصدر واحد)
for (const file of [
  "src/lib/home-feature-catalog.ts",
  "src/lib/site-footer-nav.ts",
  "src/lib/ia-final-structure.ts",
  "src/components/home/HomeExplorePlatform.tsx",
]) {
  const text = read(file);
  if (/href:\s*["']\/more["']|href=["']\/more["']/.test(text)) {
    fail("critical", `${file}: رابط /more ظاهر للمستخدم — استبدل بـ /sections`);
  }
}

const sitemapPath = resolve(root, "public/sitemap.xml");
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  if (/<loc>[^<]*\/more<\//.test(sitemap)) {
    fail("critical", "sitemap.xml يحتوي /more");
  }
}

const searchIndex = resolve(root, "public/data/unified-search-index.json");
if (existsSync(searchIndex)) {
  const idx = readFileSync(searchIndex, "utf8");
  if (/"\/more"/.test(idx)) {
    fail("critical", "unified-search-index.json يحتوي /more");
  }
}

// ── 2) Majlisilm / أسماء ممنوعة ─────────────────────────────────────────────
runNode("scripts/test-identity.mjs", "test-identity");

// ── 3) admin / internal / review في navigation ───────────────────────────────
const BLOCKED = ["/admin", "/internal", "/review", "/dashboard"];
const navTs = read("src/config/navigation.ts");
for (const p of BLOCKED) {
  if (new RegExp(`route:\\s*["']${p.replace(/\//g, "\\/")}["']`).test(navTs)) {
    fail("critical", `navigation.ts: ${p} مفعّل في NAV`);
  }
}
const prerender = JSON.parse(read("site.config.json"));
for (const item of prerender.prerenderNav || []) {
  if (BLOCKED.includes(item.path) || item.path === "/more") {
    fail("critical", `prerenderNav: ${item.path} لا يجب أن يظهر`);
  }
}

// ── 4) صفحات ناقصة — لا ComingSoonPage للمصحف ─────────────────────────────
const appRoutes = read("src/AppRoutes.tsx");
if (/MushafComingSoonPage|ComingSoonPage.*mushaf/i.test(appRoutes)) {
  fail("high", "AppRoutes: صفحة مصحف «قريبًا» — المصحف يجب أن يكون مفتوحًا");
}
if (!existsSync(resolve(root, "src/styles/final-release.css"))) {
  fail("high", "final-release.css مفقود — شارات nav-soon");
} else if (!read("src/styles/final-release.css").includes(".nav-soon-badge")) {
  fail("high", "شارات قريبًا: .nav-soon-badge مفقودة");
}
if (/isHiddenFromNav\([^)]+\)[\s\S]{0,80}return null/.test(read("src/pages/account/ui/SiteMapView.tsx"))) {
  fail("high", "SiteMapView: إخفاء صفحة بـ return null بدل شارة");
}

// ── 5) حديث ضعيف — لا توصية في الرئيسية/الشريط ────────────────────────────
const indexHtml = read("index.html");
if (/\/hadith\/daif|hadith\/mawdu/.test(indexHtml)) {
  fail("critical", "index.html: رابط أحاديث ضعيفة/موضوعة في noscript الرئيسية");
}
const ticker = read("src/lib/ticker-content.ts");
if (/hadith\/daif|\/daif|ضعيف/.test(ticker)) {
  fail("critical", "ticker-content: أحاديث ضعيفة في الشريط");
}

// ── 6) أذان + تلاوة — ملفات محلية ───────────────────────────────────────────
const adhanAudio = read("src/lib/adhan-audio.ts");
const defaultMuezzin = adhanAudio.match(/export const DEFAULT_MUEZZIN_ID = "([^"]+)"/)?.[1];
if (defaultMuezzin) {
  const block = adhanAudio.slice(
    adhanAudio.indexOf(`id: "${defaultMuezzin}"`),
    adhanAudio.indexOf(`id: "${defaultMuezzin}"`) + 800,
  );
  const url = block.match(/audioUrl:\s*"([^"]+)"/)?.[1];
  if (url?.startsWith("/")) {
    const local = resolve(root, "public", url.replace(/^\//, ""));
    if (!existsSync(local) && !existsSync(local.replace(/\.mp3$/, ".ogg"))) {
      fail("high", `أذان افتراضي: ملف مفقود ${url}`);
    }
  }
}
if (!existsSync(resolve(root, "public/data/quran-v2/pages/page-001.json"))) {
  fail("high", "بيانات صفحات المصحف (quran-v2/page-001) مفقودة — القارئ لن يعمل");
}

// ── 7) مصحف/تفسير — baseline CSS ────────────────────────────────────────────
const mushafCss = read("src/features/mushaf-madinah/mushaf-madinah.css");
const MUSHAF_BASELINE = {
  "--mm-line-height: 1.85": true,
  "--mushaf-line-height: var(--mm-line-height)": true,
  "grid-template-rows: repeat(15, minmax(0, 1fr))": true,
  "line-height: var(--mm-line-height)": true,
};
for (const needle of Object.keys(MUSHAF_BASELINE)) {
  if (!mushafCss.includes(needle)) {
    fail("critical", `mushaf-madinah.css: baseline مفقود «${needle}»`);
  }
}
if (/font-size:\s*\d+px[^;]*;[^}]*\.mm-ayah|\.mm-line[^}]*font-size:\s*\d+px/.test(mushafCss)) {
  fail("critical", "mushaf-madinah.css: font-size ثابت على آيات المصحف");
}
const tafsirCss = read("src/styles/pages/tafsir.css");
if (!tafsirCss.includes("line-height: 1.85")) {
  fail("critical", "tafsir.css: line-height أساسي 1.85 مفقود");
}
if (/\.tf-body[^}]*font-size:\s*1\.[2-9]|\.tf-ayah[^}]*font-size/.test(tafsirCss)) {
  fail("critical", "tafsir.css: تكبير خط نص التفسير/الآيات");
}

// ── 8) contact / privacy ────────────────────────────────────────────────────
const seoRoutes = JSON.parse(read("src/lib/seo-routes.json"));
for (const p of ["/contact", "/privacy"]) {
  const r = seoRoutes.routes.find((x) => x.path === p);
  if (!r) fail("critical", `seo-routes: ${p} مفقود`);
  else if (!r.sitemap) fail("high", `seo-routes: ${p} خارج sitemap`);
  else if ((r.robots || "").includes("noindex")) fail("high", `seo-routes: ${p} noindex`);
}
if (!appRoutes.includes('path="/contact"') && !appRoutes.includes("ContactPage")) {
  fail("high", "AppRoutes: /contact غير مسجّل");
}

// ── 9) sitemap noindex / أدوات داخلية ───────────────────────────────────────
if (existsSync(sitemapPath)) {
  const locs = [...readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    try {
      return new URL(m[1]).pathname.replace(/\/$/, "") || "/";
    } catch {
      return m[1];
    }
  });
  for (const loc of locs) {
    if (isSitemapDenied(loc)) fail("critical", `sitemap: ${loc} ممنوع`);
  }
} else {
  fail("high", "public/sitemap.xml مفقود — شغّل generate:seo");
}

runNode("scripts/check-seo-indexing.js", "check-seo-indexing");
runNode("scripts/check-editorial-safety.js", "check-editorial-safety");
runNode("scripts/check-pwa.js", "check-pwa");

if (existsSync(resolve(root, "public/data/search/index.json"))) {
  runNode("scripts/check-search-quality.js", "check-search-quality");
}

if (existsSync(resolve(root, "performance-budget.json"))) {
  /* presence gate — full gzip check runs post-build via check:performance-budget */
} else {
  fail("high", "performance-budget.json مفقود");
}

if (!appRoutes.includes('path="/internal/status"')) {
  fail("high", "AppRoutes: /internal/status غير مسجّل");
}

// ── تقرير ───────────────────────────────────────────────────────────────────
console.log(`\n📊 master-regression-guard`);
console.log(`   Critical: ${critical.length}`);
console.log(`   High:     ${high.length}`);

if (critical.length) {
  console.error("\n❌ Critical:");
  for (const f of critical) console.error(`   • ${f}`);
}
if (high.length) {
  console.error("\n⚠️  High:");
  for (const f of high) console.error(`   • ${f}`);
}

if (critical.length || high.length) {
  process.exit(1);
}

console.log("\n✓ master-regression-guard: Critical 0 · High 0\n");
