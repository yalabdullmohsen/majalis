#!/usr/bin/env node
/**
 * بوابة PageShell (الجولة الثالثة — B1):
 * تفرض أن الأغلفة العامة تشتق من المكوّن الموحّد، وأن فتحات الهيكل موجودة.
 *
 * التشغيل: node scripts/verify-pageshell-gate.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const issues = [];

function read(rel) {
  const abs = join(appRoot, rel);
  if (!existsSync(abs)) {
    issues.push(`${rel}: ملف مفقود`);
    return "";
  }
  return readFileSync(abs, "utf8");
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function mustUsePageShell(rel, src) {
  const clean = stripComments(src);
  // صفحات TopicPage الحديثة تغني عن PageShell لنفس الهيكل المرئي
  if (/from\s+["']@\/components\/topic\/TopicPage["']/.test(clean) && /<TopicPage[\s>]/.test(clean)) {
    return;
  }
  if (!/from\s+["']@\/components\/layout\/PageShell["']|from\s+["']\.\/PageShell["']/.test(clean)) {
    issues.push(`${rel}: يجب استيراد PageShell`);
  }
  if (!/<PageShell[\s>]/.test(clean)) {
    issues.push(`${rel}: يجب استخدام <PageShell>`);
  }
  if (/<div\s+className=["'`][^"'`]*\bpage-shell\b/.test(clean)) {
    issues.push(`${rel}: غلاف خام page-shell بدل PageShell`);
  }
}

const shellSrc = read("src/components/layout/PageShell.tsx");
if (shellSrc) {
  const clean = stripComments(shellSrc);
  if (!/data-page-shell=["']1["']/.test(clean)) {
    issues.push("src/components/layout/PageShell.tsx: data-page-shell=\"1\" مطلوب");
  }
  for (const slot of ["intro", "content", "related"]) {
    if (!new RegExp(`${slot}\\?:`).test(clean) && !new RegExp(`${slot},`).test(clean)) {
      issues.push(`src/components/layout/PageShell.tsx: فتحة ${slot} مفقودة`);
    }
  }
  if (!/page-shell\.css/.test(shellSrc)) {
    issues.push("src/components/layout/PageShell.tsx: يجب استيراد page-shell.css");
  }
}

const cssSrc = read("src/styles/components/page-shell.css");
if (cssSrc) {
  for (const sel of [".page-shell__intro", ".page-shell__content", ".page-shell__related", ".page-related"]) {
    if (!cssSrc.includes(sel)) {
      issues.push(`src/styles/components/page-shell.css: المحدد ${sel} مفقود`);
    }
  }
  if (/max-block-size:\s*120px/.test(cssSrc) && /overflow:\s*hidden/.test(cssSrc)) {
    issues.push("src/styles/components/page-shell.css: قصّ قسري للمقدمة غير مسموح");
  }
}

const requiredLayouts = [
  "src/components/LegalPageLayout.tsx",
  "src/components/platform/ContentDetailLayout.tsx",
  "src/components/layout/ContentHubLayout.tsx",
  "src/views/TarikhIslamiDetailPage.tsx",
  // الجولة الخامسة — محاور محتوى عالية الزيارة
  "src/pages/worship/ui/AdhkarView.tsx",
  "src/pages/account/ui/FawaidView.tsx",
  "src/views/TopicsIndexPage.tsx",
  "src/pages/worship/ui/TasbihView.tsx",
  "src/views/learn/LearnHubPage.tsx",
  "src/pages/worship/ui/DuasView.tsx",
  "src/views/AsmaaHusnaPage.tsx",
];

for (const rel of requiredLayouts) {
  const src = read(rel);
  if (src) mustUsePageShell(rel, src);
}

if (issues.length) {
  console.error("❌ بوابة PageShell فشلت:\n");
  for (const issue of issues) console.error(`  - ${issue}`);
  process.exit(1);
}

console.log(
  `✓ بوابة PageShell: ${requiredLayouts.length} أغلفة على PageShell · فتحات intro/content/related · بلا قصّ قسري`,
);
