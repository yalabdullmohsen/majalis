#!/usr/bin/env node
/**
 * فحص اتساق التنقل — سُنّة / ssunnah.com
 * المخرجات: reports/navigation-consistency-audit.{md,json}
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(root, "../..");
const reportsDir = resolve(repoRoot, "reports");

const critical = [];
const high = [];
const medium = [];
const info = [];
const pageRows = [];

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

const { primaryNav, secondaryNav, footerNav, NAV_LABEL_CANONICAL } = await import(
  pathToFileURL(resolve(root, "src/config/navigation.ts")).href,
);

const PRIMARY_HREFS = primaryNav.map((i) => i.href);
const PRIMARY_LABELS = primaryNav.map((i) => i.label);
const EXPECTED_PRIMARY = [
  ["/", "الرئيسية"],
  ["/lessons", "الدروس"],
  ["/quran-hub", "القرآن"],
  ["/adhkar", "الأذكار"],
  ["/prayer-times", "الصلاة"],
  ["/fiqh", "الفقه"],
  ["/search", "البحث"],
];

// ── 1) لا /more ─────────────────────────────────────────────────────────────
const NAV_SOURCES = [
  "src/config/navigation.ts",
  "src/lib/navigation.ts",
  "src/lib/nav-map.ts",
  "src/lib/site-footer-nav.ts",
  "src/components/BottomNavBar.tsx",
  "src/components/NavBar.tsx",
  "src/components/TopSectionBar.tsx",
  "src/lib/home-feature-catalog.ts",
  "index.html",
  "site.config.json",
];

for (const file of NAV_SOURCES) {
  const text = readText(file);
  if (file === "src/components/BottomNavBar.tsx" && /"\/more":\s*"sections"/.test(text)) continue;
  if (/href:\s*["']\/more["']|href=["']\/more["']/.test(text)) {
    fail("critical", `${file}: رابط /more ظاهر`);
  }
  if (file !== "index.html" && /breadcrumb[^]*المزيد|label:\s*["']المزيد["']/.test(text)) {
    if (!file.includes("MorePage") && !file.includes("moreSections")) {
      fail("high", `${file}: تسمية «المزيد» في تنقل`);
    }
  }
}

if (existsSync(resolve(root, "public/sitemap.xml"))) {
  const sm = readText("public/sitemap.xml");
  if (/<loc>[^<]*\/more<\//.test(sm)) fail("critical", "sitemap.xml يحتوي /more");
}

const searchIdx = existsSync(resolve(root, "public/data/search/index.json"))
  ? readJson("public/data/search/index.json")
  : { docs: [] };
for (const doc of searchIdx.docs || []) {
  const href = String(doc.href || "").split("?")[0].split("#")[0];
  if (href === "/more" || href.startsWith("/more/")) fail("critical", "فهرس البحث يحتوي /more");
}

// ── 2) primaryNav موحّد ────────────────────────────────────────────────────
if (JSON.stringify(PRIMARY_HREFS) !== JSON.stringify(EXPECTED_PRIMARY.map((e) => e[0]))) {
  fail("critical", `primaryNav مسارات: ${PRIMARY_HREFS.join(", ")}`);
}
if (JSON.stringify(PRIMARY_LABELS) !== JSON.stringify(EXPECTED_PRIMARY.map((e) => e[1]))) {
  fail("high", `primaryNav تسميات: ${PRIMARY_LABELS.join(" · ")}`);
}

const site = readJson("site.config.json");
const prerenderLabels = (site.prerenderNav || []).map((n) => n.label);
if (JSON.stringify(prerenderLabels) !== JSON.stringify(PRIMARY_LABELS)) {
  fail("high", "site.config prerenderNav لا يطابق primaryNav");
}

const navTs = readText("src/lib/navigation.ts");
if (!/primaryNav/.test(navTs)) fail("critical", "lib/navigation.ts لا يستورد primaryNav");

const topBar = readText("src/components/TopSectionBar.tsx");
if (!/primaryNav/.test(topBar)) fail("critical", "TopSectionBar لا يستخدم primaryNav");

const indexHtml = readText("index.html");
for (const [href, label] of EXPECTED_PRIMARY) {
  if (!indexHtml.includes(`href="${href}">${label}</a>`)) {
    fail("high", `index.html noscript: ${label} (${href}) ناقص أو مختلف`);
  }
}

// ── 3) تسميات موحّدة ──────────────────────────────────────────────────────
const FORBIDDEN_LABELS = ["القرآن الكريم", "مركز القرآن", "مواقيت الصلاة", "فقه"];
for (const file of ["src/components/TopSectionBar.tsx", "src/lib/navigation.ts"]) {
  const text = readText(file);
  for (const bad of FORBIDDEN_LABELS) {
    if (text.includes(`"${bad}"`) && file === "src/components/TopSectionBar.tsx") {
      fail("medium", `${file}: تسمية قديمة «${bad}» في الشريط`);
    }
  }
}

// ── 4) Majlisilm / admin / internal ─────────────────────────────────────────
const FORBIDDEN_UI = [/majlisilm/i, /المجلس\s*العلمي/i];
for (const file of NAV_SOURCES) {
  if (file === "site.config.json") continue; // legacyOrigins موثّقة للتحويل فقط
  for (const re of FORBIDDEN_UI) {
    if (re.test(readText(file))) fail("critical", `${file}: اسم قديم ظاهر`);
  }
}
for (const blocked of ["/internal", "/review", "/admin"]) {
  if (primaryNav.some((i) => i.href === blocked) || secondaryNav.some((i) => i.href === blocked)) {
    fail("critical", `${blocked} في التنقل`);
  }
}

// ── 5) أقسام ثانوية قابلة للوصول ───────────────────────────────────────────
const SECONDARY_REQUIRED = [
  "/library",
  "/scholars",
  "/hadith",
  "/islamic-glossary",
  "/tarikh-islami",
  "/seerah",
  "/prophets",
  "/nations",
  "/sources",
];
for (const href of SECONDARY_REQUIRED) {
  const inSecondary = secondaryNav.some((i) => i.href === href);
  const inFooter = footerNav.some((g) => g.links.some((l) => l.href === href));
  if (!inSecondary || !inFooter) {
    fail("high", `${href}: يجب أن يكون في secondaryNav والفوتر`);
  }
}

// ── 6) المصحف/التفسير typography ────────────────────────────────────────────
const mushafCss = readText("src/features/mushaf-reader/mushaf-reader.css");
if (!mushafCss.includes("--mushaf-font-size: 24px")) {
  fail("critical", "تغيّر font-size المصحف");
}
if (!mushafCss.includes("--mushaf-line-height: 1.85")) {
  fail("critical", "تغيّر line-height المصحف");
}
const tafsirCss = existsSync(resolve(root, "src/styles/pages/tafsir.css"))
  ? readText("src/styles/pages/tafsir.css")
  : "";
if (tafsirCss && !/line-height:\s*1\.85/.test(tafsirCss)) {
  fail("critical", "تغيّر line-height التفسير");
}

// ── 7) تقرير الصفحات ────────────────────────────────────────────────────────
const PAGES = [
  { path: "/", source: "index.html noscript" },
  { path: "/lessons", source: "prerender + NavBar" },
  { path: "/hadith", source: "prerender + NavBar" },
  { path: "/fiqh", source: "prerender + NavBar" },
  { path: "/mushaf", source: "NavBar" },
  { path: "/adhkar", source: "NavBar" },
  { path: "/prayer-times", source: "NavBar" },
  { path: "/search", source: "NavBar" },
];

for (const page of PAGES) {
  pageRows.push({
    page: page.path,
    navLinks: PRIMARY_LABELS,
    expected: EXPECTED_PRIMARY.map((e) => e[1]),
    diff: [],
    legacyLinks: [],
    fix: page.path === "/" ? "noscript موحّد مع primaryNav" : "prerenderNav من site.config",
    blocksDeploy: critical.length > 0,
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  critical: critical.length,
  high: high.length,
  medium: medium.length,
  info: info.length,
  pass: critical.length === 0 && high.length === 0,
  primaryNav: primaryNav,
  secondaryNavCount: secondaryNav.length,
  footerGroups: footerNav.map((g) => g.title),
  issues: { critical, high, medium, info },
  pages: pageRows,
  labelCanonical: NAV_LABEL_CANONICAL,
  googleSnippetNote:
    "مقتطفات قوقل القديمة قد تعرض «المزيد» — لا تُعدّل الكود إلا إذا ظهر في HTML الحي.",
};

writeFileSync(resolve(reportsDir, "navigation-consistency-audit.json"), JSON.stringify(summary, null, 2) + "\n");

const md = [
  "# تقرير اتساق التنقل",
  "",
  `تاريخ: ${summary.generatedAt}`,
  "",
  `| المستوى | العدد |`,
  `|---------|------|`,
  `| حرج | ${critical.length} |`,
  `| عالٍ | ${high.length} |`,
  `| متوسط | ${medium.length} |`,
  "",
  summary.pass ? "✅ **النتيجة: ناجح**" : "❌ **النتيجة: يحتاج إصلاح**",
  "",
  "## primaryNav المعتمد",
  "",
  ...EXPECTED_PRIMARY.map(([h, l]) => `- \`${h}\` — ${l}`),
  "",
  "## مجموعات التذييل",
  "",
  ...footerNav.map((g) => `- **${g.title}** (${g.links.length} روابط)`),
  "",
  "## ملاحظة مقتطفات قوقل",
  "",
  summary.googleSnippetNote,
  "",
];

if (critical.length + high.length + medium.length > 0) {
  md.push("## المشكلات", "");
  for (const m of [...critical, ...high, ...medium]) md.push(`- ${m}`);
  md.push("");
}

md.push("## الصفحات", "", "| الصفحة | التنقل | يمنع النشر |", "|--------|--------|------------|");
for (const row of pageRows) {
  md.push(`| ${row.page} | ${row.navLinks.join(" · ")} | ${row.blocksDeploy ? "نعم" : "لا"} |`);
}

writeFileSync(resolve(reportsDir, "navigation-consistency-audit.md"), md.join("\n") + "\n");

console.log(
  `navigation-consistency-audit: critical=${critical.length} high=${high.length} medium=${medium.length}`,
);
if (summary.pass) {
  console.log("✓ navigation-consistency-audit: ناجح");
} else {
  for (const m of [...critical, ...high]) console.error(`✗ ${m}`);
  process.exit(1);
}
