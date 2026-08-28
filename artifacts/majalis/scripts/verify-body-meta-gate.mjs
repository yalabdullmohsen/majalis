#!/usr/bin/env node
/**
 * بوابة D1: فصل body/summary عن metaDescription
 * - يمنع إعادة وصف الـmeta المقصوص («…») في الفقرة المرئية داخل article
 * - يفرض أن مولّد SEO يستخدم visibleLeadHtml / route.body
 *
 * التشغيل: node scripts/verify-body-meta-gate.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const issues = [];

const genPath = join(appRoot, "scripts/generate-seo.mjs");
const gen = readFileSync(genPath, "utf8");
if (!/function visibleLeadHtml\s*\(/.test(gen)) {
  issues.push("generate-seo.mjs: visibleLeadHtml مفقود");
}
if (/<p>\$\{escapeHtml\(route\.description\)\}<\/p>/.test(gen)) {
  issues.push("generate-seo.mjs: لا يزال يضع route.description في الفقرة المرئية");
}
if (!/body:\s*(bioFull|detailFull)/.test(gen) || !/body:\s*desc/.test(gen)) {
  issues.push("generate-seo.mjs: صفحات التاريخ/المكتبة يجب أن تمرّر route.body");
}

function walkHtml(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkHtml(p, out);
    else if (name === "index.html") out.push(p);
  }
  return out;
}

const historyFiles = walkHtml(join(appRoot, "seo-prerender/tarikh-islami")).filter(
  (f) => !/seo-prerender\/tarikh-islami\/index\.html$/.test(f.replaceAll("\\", "/")),
);

let checked = 0;
for (const file of historyFiles) {
  const rel = relative(appRoot, file);
  const html = readFileSync(file, "utf8");
  const meta = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] || "";
  const article = html.match(/<article>([\s\S]*?)<\/article>/i)?.[1] || "";
  const firstP = article.match(/<p>([\s\S]*?)<\/p>/)?.[1] || "";
  const text = firstP.replace(/<[^>]+>/g, "").trim();
  checked++;

  if (!text) {
    issues.push(`${rel}: فقرة النبذة المرئية مفقودة`);
    continue;
  }
  if (text.endsWith("…") || text.endsWith("...")) {
    issues.push(`${rel}: النص الظاهر ينتهي بقصّ meta (…)`);
  }
  const metaTruncated = meta.endsWith("…") || meta.endsWith("...");
  if (metaTruncated && text === meta) {
    issues.push(`${rel}: النص الظاهر يطابق meta المقصوص`);
  }
  if (metaTruncated && text.length <= meta.length) {
    issues.push(`${rel}: الظاهر ليس أطول من meta المقصوص`);
  }
}

if (historyFiles.length < 50) {
  issues.push(`seo-prerender/tarikh-islami: عدد صفحات غير كافٍ (${historyFiles.length})`);
}

if (issues.length) {
  console.error("❌ بوابة فصل body/meta فشلت:\n");
  for (const issue of issues.slice(0, 40)) console.error(`  - ${issue}`);
  if (issues.length > 40) console.error(`  … و${issues.length - 40} أخرى`);
  process.exit(1);
}

console.log(`✓ بوابة D1: ${checked} صفحة تاريخ — ظاهر كامل ≠ meta مقصوص · مولّد مفصول`);
