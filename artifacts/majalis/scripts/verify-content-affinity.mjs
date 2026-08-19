#!/usr/bin/env node
/**
 * بوابة CI: نسبة المحتوى المصاحب (أسئلة · آيات · اقتباسات) للأقسام.
 * يفشل عند: يتيم بلا sectionId · sectionId مخالف · categoryId قديم في TopicQuiz.
 */
import { writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsPath = join(appRoot, "docs/CONTENT_AFFINITY_REPORT.md");

const {
  TAGGED_QUIZ_POOL,
  quizAffinityStats,
  keywordOverlapScore,
  WEAK_AFFINITY_THRESHOLD,
  isValidSectionId,
} = await import("../src/lib/quiz-content-affinity.ts");

const { ROUTE_QUOTE, resolveSectionQuote } = await import("../src/config/section-template.ts");
const { SECTIONS, getSectionByRoute } = await import("../src/config/sections.registry.ts");

const failures = [];
const weakLinks = [];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (["node_modules", "dist", "__tests__"].includes(name)) continue;
      walk(p, acc);
    } else if (/\.tsx$/.test(name)) acc.push(p);
  }
  return acc;
}

// ── 1. أسئلة: كل عنصر موسوم · صفر يتيم ──
const stats = quizAffinityStats();
for (const q of TAGGED_QUIZ_POOL) {
  if (!q.sectionId) failures.push(`سؤال ${q.id} بلا sectionId`);
  else if (!isValidSectionId(q.sectionId)) failures.push(`سؤال ${q.id}: sectionId غير صالح "${q.sectionId}"`);
  const score = keywordOverlapScore(q.sectionId, q.q);
  if (score < WEAK_AFFINITY_THRESHOLD) {
    weakLinks.push({ kind: "quiz", id: q.id, sectionId: q.sectionId, score, text: q.q.slice(0, 80) });
  }
}
if (stats.orphans > 0) failures.push(`${stats.orphans} سؤال يتيم بلا sectionId`);

// ── 2. اقتباسات اللافتة: sectionId إلزامي · بلا fallback ──
for (const [route, quote] of Object.entries(ROUTE_QUOTE)) {
  if (!quote.sectionId) failures.push(`اقتباس ${route} بلا sectionId`);
  const sec = getSectionByRoute(route);
  if (sec && quote.sectionId !== sec.id) {
    failures.push(`اقتباس ${route}: sectionId="${quote.sectionId}" ≠ registry "${sec.id}"`);
  }
  const resolved = resolveSectionQuote(route);
  if (!resolved) failures.push(`resolveSectionQuote(${route}) فشل — اقتباس بلا نسب`);
  const score = keywordOverlapScore(quote.sectionId, quote.text);
  if (score < WEAK_AFFINITY_THRESHOLD) {
    weakLinks.push({ kind: "quote", id: route, sectionId: quote.sectionId, score, text: quote.text.slice(0, 80) });
  }
}

// ── 3. مسح استدعاءات TopicQuiz/SectionQuiz في المصدر ──
const srcRoot = join(appRoot, "src");
for (const file of walk(srcRoot)) {
  const rel = relative(srcRoot, file).replace(/\\/g, "/");
  const src = readFileSync(file, "utf8");
  if (!src.includes("SectionQuiz") && !src.includes("TopicQuiz")) continue;
  if (/categoryId=/.test(src)) failures.push(`${rel}: categoryId قديم — استخدم sectionId/route`);
  for (const m of src.matchAll(/sectionId=\{?"([^"}]+)"?\}/g)) {
    const id = m[1];
    if (!isValidSectionId(id)) failures.push(`${rel}: sectionId="${id}" غير موجود في sections.registry`);
  }
  for (const m of src.matchAll(/sectionId=\{section\.([^}]+)\}/g)) {
    /* dynamic — ContentDetailLayout/FiqhGuidePage */
  }
}

// ── 4. تقرير صلة ضعيفة (تحذير — لا يفشل CI) ──
const sectionCount = Object.keys(stats.bySection).length;
const report = [
  "# تقرير صلة المحتوى (CONTENT_AFFINITY)",
  "",
  `تاريخ التوليد: ${new Date().toISOString()}`,
  "",
  "## ملخص",
  "",
  `- **${stats.tagged}** سؤالاً في **${sectionCount}** قسماً · **${stats.orphans}** يتيم`,
  `- **${Object.keys(ROUTE_QUOTE).length}** اقتباس لافتة موسوم`,
  `- **${weakLinks.length}** تحذير صلة ضعيفة (≤ ${WEAK_AFFINITY_THRESHOLD})`,
  "",
  "## تحذيرات صلة ضعيفة (مراجعة يدوية)",
  "",
];
if (weakLinks.length === 0) {
  report.push("_لا تحذيرات._");
} else {
  report.push("| النوع | المعرّف | القسم | النسبة | النص |");
  report.push("|---|---|---|---:|---|");
  for (const w of weakLinks.slice(0, 200)) {
    report.push(`| ${w.kind} | ${w.id} | ${w.sectionId} | ${w.score.toFixed(3)} | ${w.text}… |`);
  }
  if (weakLinks.length > 200) report.push(`\n_… و${weakLinks.length - 200} إضافية_`);
}
writeFileSync(docsPath, report.join("\n") + "\n");

console.log(`✓ ${stats.tagged} سؤالاً في ${sectionCount} قسماً · ${stats.orphans} يتيم`);
console.log(`✓ تقرير: ${relative(appRoot, docsPath)} (${weakLinks.length} تحذير صلة ضعيفة)`);

if (failures.length) {
  console.error("\n❌ verify-content-affinity فشل:\n");
  failures.slice(0, 50).forEach((f) => console.error(`  - ${f}`));
  if (failures.length > 50) console.error(`  … و${failures.length - 50} أخرى`);
  process.exit(1);
}

console.log("✓ verify-content-affinity: ok");
