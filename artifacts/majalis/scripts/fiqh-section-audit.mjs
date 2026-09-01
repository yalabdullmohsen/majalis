#!/usr/bin/env node
/**
 * فحص قسم الفقه — أبواب، مسائل، بحث، SEO، واجهة.
 * المخرجات: reports/fiqh-section-audit.{md,json}
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

function fail(level, message) {
  const bucket = level === "critical" ? critical : level === "high" ? high : level === "medium" ? medium : info;
  bucket.push(message);
}

async function importSrc(rel) {
  const url = pathToFileURL(resolve(root, rel)).href;
  return import(url);
}

function readText(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

function hasMajlisilmLeak(text, label) {
  if (/\bMajlisilm\b/i.test(text) || /المجلس العلمي/.test(text)) {
    fail("critical", `${label}: يظهر اسم Majlisilm أو المجلس العلمي`);
  }
}

// ── 1) تحميل بيانات الفقه ─────────────────────────────────────────────────
const {
  FIQH_DOOR_ORDER,
  FIQH_DOOR_META,
  buildFiqhDoorSummaries,
  listAllLessonHits,
  getLessonContentStatus,
  isSeverelyIncompleteLesson,
  dedupeLessonHits,
} = await importSrc("src/lib/fiqh/fiqhNormalize.ts");

const { probeFiqhSearch } = await importSrc("src/lib/fiqh/fiqhSearch.ts");

const doors = buildFiqhDoorSummaries();
const allHits = listAllLessonHits();

// ── 2) أبواب مكررة ─────────────────────────────────────────────────────────
const doorLabels = doors.map((d) => d.label);
const uniqueLabels = new Set(doorLabels);
if (uniqueLabels.size !== doorLabels.length) {
  fail("critical", "أبواب فقه بأسماء مكررة في FIQH_DOOR_META");
}
if (FIQH_DOOR_ORDER.length !== 8) {
  fail("high", `عدد الأبواب الثابتة ${FIQH_DOOR_ORDER.length} بدل 8`);
}
for (const door of doors) {
  if (!door.label?.trim()) fail("critical", `باب بلا اسم: ${door.id}`);
  if (door.issueCount == null || Number.isNaN(door.issueCount)) {
    fail("high", `باب ${door.label}: عدد مسائل غير صالح`);
  }
}

// ── 3) مسائل بلا عنوان / مصدر ───────────────────────────────────────────────
for (const hit of allHits) {
  if (!hit.lesson.title?.trim()) {
    fail("critical", `مسألة بلا عنوان: ${hit.book.id}/${hit.lesson.id}`);
  }
  const status = getLessonContentStatus(hit.lesson);
  if (!hit.lesson.sources?.length) {
    fail("high", `مسألة بلا مصدر: ${hit.lesson.title || hit.lesson.id}`);
  } else if (status === "under_review") {
    info.push(`مسألة قيد التدقيق: ${hit.lesson.title}`);
  }
}

// ── 4) مكوّنات الواجهة والشارات ─────────────────────────────────────────────
const requiredComponents = [
  "src/components/fiqh/FiqhCategoryCard.tsx",
  "src/components/fiqh/FiqhFilters.tsx",
  "src/components/fiqh/FiqhIssueCard.tsx",
  "src/components/fiqh/FiqhSourceLine.tsx",
  "src/components/fiqh/FiqhRelatedIssues.tsx",
];
for (const file of requiredComponents) {
  if (!existsSync(resolve(root, file))) {
    fail("critical", `مكوّن مفقود: ${file}`);
  }
}

const fiqhView = readText("src/pages/fiqh/ui/FiqhView.tsx");
const fiqhLesson = readText("src/pages/fiqh/ui/FiqhLessonView.tsx");
if (!fiqhView.includes("FiqhCategoryCard")) fail("high", "FiqhView لا يستخدم FiqhCategoryCard");
if (!fiqhView.includes("FiqhFilters")) fail("high", "FiqhView لا يستخدم FiqhFilters");
if (!fiqhLesson.includes("FiqhSourceLine")) fail("high", "FiqhLessonView لا يستخدم FiqhSourceLine");
if (!fiqhLesson.includes("fiqh-status-badge")) fail("high", "صفحة المسألة بلا شارة حالة");

// ── 5) sitemap ────────────────────────────────────────────────────────────────
const sitemapPath = resolve(root, "public/sitemap.xml");
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  if (!sitemap.includes("/fiqh<")) fail("high", "/fiqh غير موجودة في sitemap");
  for (const hit of allHits) {
    if (!isSeverelyIncompleteLesson(hit.lesson)) continue;
    const loc = `/fiqh/books/${hit.book.id}/lessons/${hit.lesson.id}`;
    if (sitemap.includes(loc)) {
      fail("critical", `مسألة ناقصة جدًا داخل sitemap: ${loc}`);
    }
  }
  for (const denied of ["/search", "/profile", "/settings", "/login", "/register", "/internal", "/review", "/admin"]) {
    if (sitemap.includes(`<loc>https://www.ssunnah.com${denied}`)) {
      fail("critical", `sitemap يحتوي مسارًا ممنوعًا: ${denied}`);
    }
  }
} else {
  fail("high", "public/sitemap.xml مفقود");
}

// ── 6) بحث فقهي ─────────────────────────────────────────────────────────────
const searchTerms = ["الصلاة", "الوضوء", "الصيام", "الزكاة", "الحج", "البيع", "النكاح"];
for (const term of searchTerms) {
  const results = probeFiqhSearch(term);
  if (results.length === 0) {
    fail("high", `بحث «${term}» لا يعيد نتائج رغم وجود محتوى متوقع`);
  }
}

// ── 7) بطاقات مكررة ─────────────────────────────────────────────────────────
const doorIds = doors.map((d) => d.id);
if (new Set(doorIds).size !== doorIds.length) {
  fail("critical", "معرّفات أبواب مكررة في البطاقات");
}
const deduped = dedupeLessonHits(allHits);
if (deduped.length !== new Set(allHits.map((h) => h.lesson.id)).size) {
  fail("high", "تكرار مسائل في الفهرس");
}

// ── 8) وضع ليلي ─────────────────────────────────────────────────────────────
const fiqhCss = readText("src/styles/pages/fiqh-hub.css");
if (!fiqhCss.includes('html[data-theme="dark"] .fiqh-filters__chip')) {
  fail("high", "ألوان فلاتر الفقه بلا قواعد وضع ليلي");
}
if (!fiqhCss.includes("html[data-theme=\"dark\"] .fiqh-status-badge")) {
  fail("high", "شارات حالة الفقه بلا قواعد وضع ليلي");
}

// ── 9) Majlisilm / مسارات داخلية ─────────────────────────────────────────────
hasMajlisilmLeak(fiqhView, "FiqhView");
hasMajlisilmLeak(fiqhLesson, "FiqhLessonView");
const appRoutes = readText("src/AppRoutes.tsx");
if (appRoutes.includes('path="/review"') || appRoutes.includes('path="/admin"')) {
  // مسموح إن كان AdminLazyRoute محمي — نفحص التنقّل العام فقط
  const bottomNav = existsSync(resolve(root, "src/components/BottomNavBar.tsx"))
    ? readText("src/components/BottomNavBar.tsx")
    : "";
  if (/\/review|\/admin|\/internal/.test(bottomNav)) {
    fail("critical", "مسارات review/admin/internal في التنقّل العام");
  }
}

// ── 10) المصحف والتفسير — لا تغيير خط ───────────────────────────────────────
const mushafReader = existsSync(resolve(root, "src/features/mushaf-reader/NewMushafReader.tsx"))
  ? readText("src/features/mushaf-reader/NewMushafReader.tsx")
  : "";
const tafsirFiles = ["src/styles/pages/mushaf.css", "src/styles/pages/tafsir.css"];
for (const file of tafsirFiles) {
  if (!existsSync(resolve(root, file))) continue;
  const css = readText(file);
  if (/font-size\s*:\s*clamp\([^)]*\+/.test(css)) {
    fail("critical", `${file}: تكبير خط محتمل للمصحف/التفسير`);
  }
}
if (mushafReader && /fontSize|lineHeight/.test(mushafReader) && /userScale|zoom/i.test(mushafReader)) {
  info.push("تحقّق يدوي من مقياس خط المصحف في NewMushafReader");
}

// ── 11) SEO metadata ─────────────────────────────────────────────────────────
if (fiqhView.includes("Majlisilm")) fail("critical", "Majlisilm في واجهة الفقه");

for (const door of doors) {
  const meta = FIQH_DOOR_META[door.id];
  if (!meta?.href) fail("high", `باب ${door.label} بلا مسار دخول`);
}

// ── تقرير ───────────────────────────────────────────────────────────────────
const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    info: info.length,
    doors: doors.length,
    lessons: allHits.length,
    searchTermsChecked: searchTerms.length,
  },
  doors: doors.map((d) => ({
    id: d.id,
    label: d.label,
    issueCount: d.issueCount,
    status: d.status,
    href: d.href,
  })),
  findings: { critical, high, medium, info },
};

const md = `# تقرير فحص قسم الفقه

تاريخ: ${report.generatedAt}

## الملخص
| المؤشر | القيمة |
|--------|--------|
| Critical | ${critical.length} |
| High | ${high.length} |
| Medium | ${medium.length} |
| أبواب | ${doors.length} |
| مسائل | ${allHits.length} |

## الأبواب
${doors.map((d) => `- **${d.label}** (${d.issueCount} مسألة) — ${d.status}`).join("\n")}

## Critical
${critical.length ? critical.map((f) => `- ${f}`).join("\n") : "- لا شيء"}

## High
${high.length ? high.map((f) => `- ${f}`).join("\n") : "- لا شيء"}

## Medium
${medium.length ? medium.map((f) => `- ${f}`).join("\n") : "- لا شيء"}
`;

writeFileSync(resolve(reportsDir, "fiqh-section-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(resolve(reportsDir, "fiqh-section-audit.md"), md);

console.log("\n📊 fiqh-section-audit");
console.log(`   Critical: ${critical.length}`);
console.log(`   High:     ${high.length}`);
console.log(`   Medium:   ${medium.length}`);

if (critical.length) {
  console.error("\n❌ Critical:");
  for (const f of critical) console.error(`   • ${f}`);
}
if (high.length) {
  console.error("\n⚠️  High:");
  for (const f of high) console.error(`   • ${f}`);
}

if (critical.length || high.length) process.exit(1);
console.log("\n✓ fiqh-section-audit: Critical 0 · High 0\n");
