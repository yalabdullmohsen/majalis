#!/usr/bin/env node
/**
 * بوابة: لا تكرار href داخل مجموعات «ذات صلة» / prerender.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findDuplicateHrefs, normalizeLinkHref } from "../src/lib/link-dedupe.ts";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const issues = [];

const adhkar = readFileSync(join(appRoot, "src/pages/worship/ui/AdhkarView.tsx"), "utf8");
if (/RelatedKnowledge/.test(adhkar)) {
  issues.push("AdhkarPage: RelatedKnowledge يكرّر أقسام الصفحة — أُزل");
}

const hadith = readFileSync(join(appRoot, "src/pages/hadith/ui/HadithView.tsx"), "utf8");
if (/RelatedKnowledge/.test(hadith)) {
  issues.push("HadithPage: RelatedKnowledge يكرّر سياق الحديث — أُزل");
}
if (/ExploreAlsoNav[\s\S]{0,400}\/hadith\/books/.test(hadith)) {
  issues.push("HadithPage: ExploreAlsoNav يكرّر رابط الكتب الظاهرة في الشريط/البانر");
}

/** يفحص كل <ul> في HTML prerender بحثًا عن href مكرر. */
function auditPrerenderUlDupes(relDir) {
  const dir = join(appRoot, "seo-prerender", relDir);
  if (!existsSync(dir)) return;
  const file = join(dir, "index.html");
  if (!existsSync(file)) return;
  const html = readFileSync(file, "utf8");
  for (const ul of html.match(/<ul>[\s\S]*?<\/ul>/gi) || []) {
    const hrefs = [...ul.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const dupes = findDuplicateHrefs(hrefs.map((h) => ({ href: h })));
    if (dupes.length) {
      issues.push(`${relDir}: href مكرر في ul — ${dupes.map((d) => normalizeLinkHref(d)).join(", ")}`);
    }
  }
}

for (const page of ["quiz", "tahara", "sitemap", "zakat", "sawm", "hajj"]) {
  auditPrerenderUlDupes(page);
}

const prerenderRoot = join(appRoot, "seo-prerender");
if (existsSync(prerenderRoot)) {
  for (const name of ["search", "quran/recitation-test-ai"]) {
    auditPrerenderUlDupes(name);
  }
}

const generateSeo = readFileSync(join(appRoot, "scripts/generate-seo.mjs"), "utf8");
if (!generateSeo.includes("dedupeLinksByHref")) {
  issues.push("generate-seo.mjs: linkList لا يستخدم dedupeLinksByHref");
}

if (issues.length) {
  console.error("❌ بوابة إزالة التكرار فشلت:\n");
  issues.forEach((i) => console.error(`  - ${i}`));
  process.exit(1);
}
console.log("✓ بوابة إزالة التكرار: لا href مكرر في المسارات الحرجة");
