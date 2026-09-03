#!/usr/bin/env node
/**
 * فحص المسارات القديمة والتحويلات — سُنّة / ssunnah.com
 * المخرجات: reports/legacy-routes-redirects-audit.{md,json}
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(root, "../..");
const reportsDir = resolve(repoRoot, "reports");

const critical = [];
const high = [];
const medium = [];
const info = [];

function fail(level, msg) {
  const bucket = level === "critical" ? critical : level === "high" ? high : level === "medium" ? medium : info;
  bucket.push(msg);
}

function readText(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

const SITE_URL = "https://www.ssunnah.com";
const FORBIDDEN_UI = [/majlisilm/i, /المجلس\s*العلمي/i, /Majlis\s*Al-Ilm/i];
const FORBIDDEN_CANONICAL = [
  /majlisilm\.com/i,
  /ssunahh\.com/i,
  /vercel\.app/i,
  /localhost/i,
  /127\.0\.0\.1/i,
];

const IMPORTANT_SECTIONS = [
  { path: "/library", label: "المكتبة" },
  { path: "/scholars", label: "العلماء" },
  { path: "/hadith", label: "الحديث" },
  { path: "/competitions", label: "المسابقات" },
  { path: "/tarikh-islami", label: "التاريخ الإسلامي" },
  { path: "/seerah", label: "السيرة" },
  { path: "/prophets", label: "قصص الأنبياء" },
  { path: "/nations", label: "الأمم السابقة" },
  { path: "/quran/people", label: "الذين ذكروا في القرآن" },
  { path: "/sources", label: "المصادر" },
];

const MUSHAF_TYPO_BASELINE = {
  "--mushaf-font-size: 24px": "mushaf-reader.css",
  "--mushaf-line-height: 1.85": "mushaf-reader.css",
};

const TAFSIR_TYPO_BASELINE = {
  "line-height: 1.85": "tafsir.css (body)",
};

// ── 1) /more — لا ظهور في navigation/sitemap/search ─────────────────────────
const NAV_SOURCES = [
  "site.config.json",
  "src/config/navigation.ts",
  "src/lib/services-center-nav.ts",
  "src/lib/nav-map.ts",
  "src/components/BottomNavBar.tsx",
  "src/lib/home-feature-catalog.ts",
  "src/lib/site-footer-nav.ts",
  "src/lib/ia-final-structure.ts",
  "index.html",
];

for (const file of NAV_SOURCES) {
  const text = readText(file);
  if (/href:\s*["']\/more["']|href=["']\/more["']/.test(text)) {
  if (file === "src/components/BottomNavBar.tsx" && /"\/more":\s*"sections"/.test(text)) {
      continue;
    }
    fail("critical", `${file}: رابط /more ظاهر للمستخدم`);
  }
  if (file === "site.config.json" && /"path":\s*"\/more"/.test(text)) {
    fail("critical", "prerenderNav يحتوي /more");
  }
}

const sitemapPath = resolve(root, "public/sitemap.xml");
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  if (/<loc>[^<]*\/more<\//.test(sitemap)) {
    fail("critical", "sitemap.xml يحتوي /more");
  }
}

const searchPaths = [
  resolve(root, "public/data/search/index.json"),
  resolve(root, "public/data/unified-search-index.json"),
];
for (const sp of searchPaths) {
  if (!existsSync(sp)) continue;
  const idx = readFileSync(sp, "utf8");
  if (/"\/more"/.test(idx) || /"href"\s*:\s*"\/more"/.test(idx)) {
    fail("critical", `${sp.replace(root + "/", "")}: يحتوي /more`);
  }
}

const appRoutes = readText("src/AppRoutes.tsx");
if (!/path="\/more"[\s\S]*?Redirect\s+to=["']\/(#explore)?["']/.test(appRoutes)) {
  fail("critical", "AppRoutes: /more يجب أن يحوّل إلى / أو /#explore");
}
if (/MoreHubFromRegistry|MorePage/.test(appRoutes) && /<Route\s+path="\/more"[^>]*component/.test(appRoutes)) {
  fail("critical", "AppRoutes: صفحة /more ما زالت مفعّلة كمكوّن");
}

const vercel = readJson("vercel.json");
const moreRedirect = (vercel.redirects || []).find((r) => r.source === "/more");
if (!moreRedirect) {
  fail("critical", "vercel.json: لا يوجد redirect لـ /more");
} else if (!/^\/(#explore)?$|^\/#explore$/.test(String(moreRedirect.destination).replace(SITE_URL, ""))) {
  fail("high", `vercel.json: /more يحوّل إلى ${moreRedirect.destination} — المتوقع / أو /#explore`);
}
const moreRewrite = (vercel.rewrites || []).some((r) => r.source === "/more");
if (moreRewrite) {
  fail("critical", "vercel.json: rewrite لـ /more يجب إزالته (redirect فقط)");
}

const seoRoutes = readJson("src/lib/seo-routes.json");
const moreSeo = seoRoutes.routes.find((r) => r.path === "/more");
if (!moreSeo) {
  fail("high", "seo-routes: مسار /more مفقود (للتحويل/noindex)");
} else {
  if (moreSeo.sitemap !== false) fail("critical", "seo-routes: /more يجب sitemap=false");
  if (!(moreSeo.robots || "").includes("noindex")) fail("high", "seo-routes: /more يجب noindex");
}

if (existsSync(resolve(root, "seo-prerender/more/index.html"))) {
  fail("high", "seo-prerender/more: يجب عدم توليد prerender لـ /more");
}

// ── 2) أسماء قديمة ────────────────────────────────────────────────────────
const USER_FACING = [
  "index.html",
  "public/site.webmanifest",
  "public/robots.txt",
  "src/lib/seo-routes.json",
  "src/components/SiteFooter.tsx",
];
for (const file of USER_FACING) {
  const p = resolve(root, file);
  if (!existsSync(p)) continue;
  const text = readFileSync(p, "utf8");
  for (const re of FORBIDDEN_UI) {
    if (re.test(text) && !/legacyOrigins|forbiddenBrand|LEGACY_CACHE|SELF_SOURCE/.test(text)) {
      fail("critical", `${file}: اسم قديم ظاهر (${re})`);
    }
  }
}

// ── 3) canonical — دائماً www.ssunnah.com ───────────────────────────────────
const prerenderSample = [
  "seo-prerender/index.html",
  "seo-prerender/hadith/index.html",
  "seo-prerender/quran-hub/index.html",
  "seo-prerender/library/index.html",
];
for (const file of prerenderSample) {
  const p = resolve(root, file);
  if (!existsSync(p)) continue;
  const html = readFileSync(p, "utf8");
  const canon = html.match(/rel="canonical"\s+href="([^"]+)"/)?.[1];
  if (canon && !canon.startsWith(SITE_URL)) {
    fail("critical", `${file}: canonical غير معتمد (${canon})`);
  }
  for (const re of FORBIDDEN_CANONICAL) {
    if (re.test(html) && !/legacyOrigins|forbiddenBrand|LEGACY_CACHE/.test(html)) {
      const og = html.match(/property="og:url"\s+content="([^"]+)"/)?.[1] || "";
      if (FORBIDDEN_CANONICAL.some((r) => r.test(og))) {
        fail("critical", `${file}: og:url أو canonical يحمل دوميناً قديماً`);
      }
    }
  }
}

// ── 4) حلقات redirect ──────────────────────────────────────────────────────
const { IA_REDIRECTS } = await import(pathToFileURL(resolve(root, "src/lib/ia-final-structure.ts")).href);
const sectionsMod = await import(pathToFileURL(resolve(root, "src/config/sections.registry.ts")).href);
const SECTION_MERGE_REDIRECTS = sectionsMod.SECTION_MERGE_REDIRECTS || [];

const graph = new Map();
function addEdge(from, to) {
  const f = String(from).split("?")[0].split("#")[0] || "/";
  const t = String(to).split("?")[0].split("#")[0] || "/";
  if (!graph.has(f)) graph.set(f, new Set());
  graph.get(f).add(t);
}

for (const r of vercel.redirects || []) {
  if (r.source?.includes(":path*") || r.source?.includes("(")) continue;
  if (r.has) continue;
  addEdge(r.source, r.destination?.replace(SITE_URL, "") || r.destination);
}
for (const [from, to] of Object.entries(IA_REDIRECTS)) addEdge(from, to);
for (const { from, to } of SECTION_MERGE_REDIRECTS || []) addEdge(from, to);
for (const r of seoRoutes.routes) {
  if (r.redirect) addEdge(r.path, r.redirect);
}

function findLoop(start) {
  const stack = [start];
  const visited = new Set();
  function dfs(node, chain) {
    if (chain.includes(node)) return [...chain, node];
    if (visited.has(node)) return null;
    visited.add(node);
    for (const next of graph.get(node) || []) {
      const loop = dfs(next, [...chain, node]);
      if (loop) return loop;
    }
    return null;
  }
  return dfs(start, []);
}

for (const node of graph.keys()) {
  const loop = findLoop(node);
  if (loop && loop.length > 1) {
    fail("critical", `حلقة redirect: ${loop.join(" → ")}`);
    break;
  }
}

// ── 5) admin/internal/review ────────────────────────────────────────────────
const navTs = readText("src/config/navigation.ts");
for (const p of ["/admin", "/internal", "/review", "/dashboard"]) {
  if (new RegExp(`route:\\s*["']${p.replace("/", "\\/")}["']`).test(navTs)) {
    fail("critical", `navigation.ts: ${p} مفعّل في NAV`);
  }
}

// ── 6) أقسام مهمة — وصول من الرئيسية/التذييل/البحث ─────────────────────────
const homeCatalog = readText("src/lib/home-feature-catalog.ts");
const footer = readText("src/lib/site-footer-nav.ts");
const sectionsRegistry = readText("src/config/sections.registry.ts");
let searchDocs = "";
const searchFile = resolve(root, "public/data/search/index.json");
if (existsSync(searchFile)) searchDocs = readFileSync(searchFile, "utf8");

for (const { path, label } of IMPORTANT_SECTIONS) {
  const inHome = homeCatalog.includes(`"${path}"`) || homeCatalog.includes(`'${path}'`);
  const inFooter = footer.includes(`"${path}"`) || footer.includes(`'${path}'`);
  const inSections = sectionsRegistry.includes(`route: "${path}"`) || sectionsRegistry.includes(`route: '${path}'`);
  const inSearch = searchDocs.includes(`"${path}"`) || searchDocs.includes(`"${path}/`);
  if (!inHome && !inFooter && !inSections && !inSearch) {
    fail("high", `${label} (${path}): لا وصول من الرئيسية/التذييل/الأقسام/البحث`);
  }
}

// ── 7) المصحف والتفسير — لا تغيير خط/line-height ─────────────────────────
const mushafCss = readText("src/features/mushaf-reader/mushaf-reader.css");
for (const [needle, label] of Object.entries(MUSHAF_TYPO_BASELINE)) {
  if (!mushafCss.includes(needle)) {
    fail("critical", `المصحف: ${label} — تغيّر ${needle}`);
  }
}

const tafsirCss = readText("src/styles/pages/tafsir.css");
if (!tafsirCss.includes("line-height: 1.85")) {
  fail("critical", "التفسير: line-height الأساسي 1.85 تغيّر");
}
if (/font-size:\s*clamp\([^)]*mushaf|\.tf-ayah|\.mushaf/.test(tafsirCss)) {
  fail("medium", "tafsir.css: تحقق يدوي من عدم ربط خط المصحف");
}

// ── 8) ssunahh typo ───────────────────────────────────────────────────────
const srcFiles = ["src", "public", "scripts", "index.html"];
function walk(rel, acc = []) {
  const p = resolve(root, rel);
  if (!existsSync(p)) return acc;
  const st = readdirSync(p, { withFileTypes: true });
  for (const e of st) {
    if (e.name === "node_modules" || e.name === "dist" || e.name === "seo-prerender") continue;
    const sub = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(sub, acc);
    else if (/\.(tsx?|jsx?|mjs|json|html|css|txt|xml)$/.test(e.name)) acc.push(sub);
  }
  return acc;
}
for (const file of walk("src").concat(walk("public")).concat(["index.html", "vercel.json"])) {
  const text = readFileSync(resolve(root, file), "utf8");
  if (/ssunahh\.com/i.test(text)) {
    fail("critical", `${file}: خطأ إملائي ssunahh.com`);
  }
}

// ── تقرير ─────────────────────────────────────────────────────────────────
const summary = {
  generatedAt: new Date().toISOString(),
  siteUrl: SITE_URL,
  critical: critical.length,
  high: high.length,
  medium: medium.length,
  info: info.length,
  issues: { critical, high, medium, info },
  redirectCount: (vercel.redirects || []).length,
  iaRedirectCount: Object.keys(IA_REDIRECTS).length,
};

const md = `# تقرير فحص المسارات القديمة والتحويلات

تاريخ: ${summary.generatedAt}
النطاق الرسمي: ${SITE_URL}

## الملخص

| المستوى | العدد |
|---------|------:|
| حرج | ${critical.length} |
| عالٍ | ${high.length} |
| متوسط | ${medium.length} |
| معلومات | ${info.length} |

- تحويلات Vercel: ${summary.redirectCount}
- تحويلات IA_REDIRECTS: ${summary.iaRedirectCount}

## حرج

${critical.length ? critical.map((x) => `- ${x}`).join("\n") : "- لا شيء"}

## عالٍ

${high.length ? high.map((x) => `- ${x}`).join("\n") : "- لا شيء"}

## متوسط

${medium.length ? medium.map((x) => `- ${x}`).join("\n") : "- لا شيء"}

## معلومات

${info.length ? info.map((x) => `- ${x}`).join("\n") : "- لا شيء"}

## سياسة /more

- الصفحة **ملغاة** — لا تظهر في التنقل أو sitemap أو البحث.
- الزوار يُحوَّلون إلى \`/\` أو \`/#explore\`.
- المسار البديل للأقسام: \`/sections\`.

راجع أيضاً: [docs/legacy-routes-map.md](../docs/legacy-routes-map.md)
`;

writeFileSync(resolve(reportsDir, "legacy-routes-redirects-audit.json"), JSON.stringify(summary, null, 2) + "\n");
writeFileSync(resolve(reportsDir, "legacy-routes-redirects-audit.md"), md);

console.log(`legacy-routes-redirects-audit: critical=${critical.length} high=${high.length} medium=${medium.length}`);

if (critical.length || high.length) {
  console.error("❌ فشل legacy-routes-redirects-audit");
  for (const x of [...critical, ...high]) console.error(`   ${x}`);
  process.exit(1);
}

console.log("✓ legacy-routes-redirects-audit: ناجح");
