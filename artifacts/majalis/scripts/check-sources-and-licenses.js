#!/usr/bin/env node
/**
 * فحص حقوق المحتوى والمصادر والتراخيص.
 *
 * Usage:
 *   node scripts/check-sources-and-licenses.js
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ROOT, readText } from "./monitoring-utils.mjs";

const appRoot = ROOT;
const failures = [];

function fail(msg) {
  failures.push(msg);
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

console.log("▶ check-sources-and-licenses\n");

// ── 1) لا مسار مراجعة داخلية ─────────────────────────────────────────────
{
  const routes = readText("src/AppRoutes.tsx");
  const router = readText("src/app/router/routes.ts");
  if (/content-review|internal\/content-review/.test(routes + router)) {
    fail("مسار /internal/content-review أو content-review فعّال");
  } else {
    ok("لا مسار مراجعة داخلية فعّال");
  }
}

// ── 2) صفحات المصادر والتراخيص ───────────────────────────────────────────
{
  const licenses = readText("src/views/SourcesLicensesPage.tsx");
  const sources = readText("src/pages/sources/SourcesDirectoryPage.tsx");
  const required = [
    ["المصحف", licenses],
    ["الأحاديث", licenses],
    ["الأذكار", licenses],
    ["الدروس", licenses],
    ["المصادر والتراخيص", licenses],
    ["دليل الجهات", sources],
    ["روابط", sources],
    ["لا إعادة استضافة", licenses + sources],
  ];
  for (const [label, text] of required) {
    if (!text.includes(label)) fail(`صفحة المصادر/التراخيص ناقصة: «${label}»`);
  }
  if (!failures.some((f) => f.includes("صفحة المصادر"))) {
    ok("صفحات /sources و /data-licenses تحتوي الأقسام المطلوبة");
  }
  if (!licenses.includes('path: "/data-licenses"')) {
    fail("SourcesLicensesPage يجب أن يستخدم path: /data-licenses");
  }
}

// ── 3) القرآن ─────────────────────────────────────────────────────────────
{
  const quranSource = resolve(appRoot, "public/data/quran-v2/SOURCE.json");
  if (!existsSync(quranSource)) {
    fail("public/data/quran-v2/SOURCE.json مفقود");
  } else {
    const data = JSON.parse(readFileSync(quranSource, "utf8"));
    if (!data.mushafLabel || !data.api) fail("SOURCE.json للقرآن ناقص mushafLabel/api");
    else ok("مصدر القرآن (QPC V2) موثّق");
  }
}

// ── 4) الأحاديث ──────────────────────────────────────────────────────────
{
  const manifest = resolve(appRoot, "public/data/hadith/manifest.json");
  if (!existsSync(manifest)) {
    fail("public/data/hadith/manifest.json مفقود");
  } else {
    const data = JSON.parse(readFileSync(manifest, "utf8"));
    if (!data.source) fail("manifest الأحاديث بلا حقل source");
    else ok(`مصدر الأحاديث: ${data.source}`);
  }
  const hadithView = readText("src/pages/hadith/ui/HadithView.tsx");
  for (const field of ["source_name", "hadith_number", "metadata", "takhrij"]) {
    if (!hadithView.includes(field)) fail(`HadithView ناقص: ${field}`);
  }
  if (!failures.some((f) => f.startsWith("HadithView"))) ok("عرض الحديث يتضمن مرجعًا وحقولًا");
}

// ── 5) الأذكار ───────────────────────────────────────────────────────────
{
  const adhkarMod = await import(pathToFileURL(resolve(appRoot, "src/lib/adhkar-seed.ts")).href);
  const items = adhkarMod.ADHKAR_ITEMS || [];
  let missing = 0;
  for (const item of items) {
    if (!item.source?.trim() && !item.reference?.trim()) missing++;
  }
  if (missing > 0) fail(`${missing} ذكر بلا source/reference في ADHKAR_ITEMS`);
  else ok(`الأذكار (${items.length}) كلها بمصدر أو مرجع`);
}

// ── 6) الفوائد ───────────────────────────────────────────────────────────
{
  const fawaid = readText("src/lib/fawaid-curated-seed.ts");
  const nullSources = (fawaid.match(/source:\s*null/g) || []).length;
  const items = (fawaid.match(/text:\s*"/g) || []).length;
  if (nullSources > 0) fail(`${nullSources} فائدة بsource:null في fawaid-curated-seed`);
  else ok(`الفوائد المختارة (${items}) بمصادر`);
  if (!readText("src/lib/content-provenance.ts").includes("hasPublicSource")) {
    fail("content-provenance.ts بلا hasPublicSource");
  }
  if (!readText("src/pages/account/ui/FawaidView.tsx").includes("hasPublicSource")) {
    fail("FawaidView لا يفلتر المحتوى بلا مصدر");
  }
}

// ── 7) الأسئلة / الاختبار ─────────────────────────────────────────────────
{
  const quiz = readText("src/lib/quiz-seed.ts");
  if (!quiz.includes("documentation_status") || !quiz.includes("isLiveQuizQuestion")) {
    fail("quiz-seed.ts لا يفلتر الأسئلة غير الموثقة");
  } else {
    ok("بوابة أسئلة الاختبار تستبعد unsourced بلا reference");
  }
}

// ── 8) المكتبة ───────────────────────────────────────────────────────────
{
  const catalogMod = await import(pathToFileURL(resolve(appRoot, "src/lib/library-catalog.ts")).href);
  const provMod = await import(pathToFileURL(resolve(appRoot, "src/lib/library-provenance.ts")).href);
  const books = catalogMod.LIBRARY_CATALOG || [];
  let hostedNoLicense = 0;
  let noAuthor = 0;
  for (const book of books) {
    const prov = provMod.resolveLibraryProvenance(book);
    if (!book.author?.trim()) noAuthor++;
    if (prov.hostedBySsunnah && prov.license === "requires_explicit_license") hostedNoLicense++;
  }
  if (noAuthor > 0) fail(`${noAuthor} كتاب بلا مؤلف (sourceName)`);
  if (hostedNoLicense > 0) fail(`${hostedNoLicense} كتاب مستضاف بلا ترخيص صريح`);
  if (!failures.some((f) => f.includes("كتاب"))) {
    ok(`المكتبة (${books.length} كتاب) — بطاقات مرجعية أو روابط خارجية`);
  }
  const libType = readText("src/lib/library-catalog.ts");
  for (const field of ["hostedBySsunnah", "license", "sourceUrl", "publicDomain"]) {
    if (!libType.includes(field)) fail(`LibraryBook بلا حقل ${field}`);
  }
}

// ── 9) الدروس المستوردة ──────────────────────────────────────────────────
{
  const feedPath = resolve(appRoot, "public/data/lessons/feed.json");
  if (!existsSync(feedPath)) {
    fail("public/data/lessons/feed.json مفقود");
  } else {
    const feed = JSON.parse(readFileSync(feedPath, "utf8"));
    const items = feed.items || [];
    let noUrl = 0;
    for (const item of items) {
      const src = item.sources?.[0];
      const url = src?.post_url || src?.url || item.register_url;
      if (!url) noUrl++;
    }
    if (noUrl > 0) fail(`${noUrl} درس في feed بلا sourceUrl`);
    else ok(`دروس الحصاد (${items.length}) كلها برابط مصدر`);
  }
}

// ── 10) فلترة العرض العام ───────────────────────────────────────────────
{
  const zones = readText("src/lib/content-display-zones.ts");
  if (!zones.includes("isUnsourcedForPublic")) {
    fail("content-display-zones.ts بلا isUnsourcedForPublic");
  } else {
    ok("فلترة المناطق العامة تستبعد المحتوى بلا مصدر");
  }
}

// ── 11) sitemap — لا فهرسة مسارات admin/internal ─────────────────────────
{
  const sitemap = readText("public/sitemap.xml");
  if (/content-review|\/internal\//.test(sitemap)) {
    fail("sitemap.xml يفهرس مسارات داخلية");
  } else {
    ok("sitemap لا يفهرس مراجعة داخلية");
  }
}

// ── النتيجة ──────────────────────────────────────────────────────────────
if (failures.length) {
  console.error("\n❌ check-sources-and-licenses فشل:");
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log("\n✅ check-sources-and-licenses — نجح");
