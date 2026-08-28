#!/usr/bin/env node
/**
 * بوابة R4-4a: لا يُسمح بعودة منهجيتنا إلى جملة واحدة في prerender.
 * التشغيل: node scripts/verify-methodology-prerender-gate.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(appRoot, "seo-prerender/methodology/index.html");
const issues = [];

if (!existsSync(file)) {
  issues.push("seo-prerender/methodology/index.html مفقود");
} else {
  const html = readFileSync(file, "utf8");
  const article = html.match(/<article>([\s\S]*?)<\/article>/i)?.[1] || "";
  const text = article.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < 1200) {
    issues.push(`متن المنهجية في prerender قصير جدًا (${text.length} حرفًا؛ المطلوب ≥1200)`);
  }
  for (const needle of [
    "درجات التوثيق",
    "مصادر التحقق",
    "dorar.net",
    "سياسة التصحيح",
    "محتوى موثّق",
  ]) {
    if (!article.includes(needle)) {
      issues.push(`عنصر مطلوب مفقود من prerender: ${needle}`);
    }
  }
  const gen = readFileSync(join(appRoot, "scripts/generate-seo.mjs"), "utf8");
  if (/\/methodology": `<p>منهجيتنا في التوثيق: الاعتماد على مصادر معتبرة/.test(gen)) {
    issues.push("generate-seo.mjs ما زال يستخدم فقرة المنهجية القديمة المختصرة");
  }
}

if (issues.length) {
  console.error("❌ بوابة منهجية prerender فشلت:\n");
  for (const i of issues) console.error(`  - ${i}`);
  process.exit(1);
}

console.log("✓ بوابة منهجية prerender: متن كافٍ + مصادر + سياسة تصحيح");
