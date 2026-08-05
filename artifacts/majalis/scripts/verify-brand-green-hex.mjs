#!/usr/bin/env node
/**
 * بوابة: لا درجات أخضر brand خارج styles/theme.css
 * تشغيل: node scripts/verify-brand-green-hex.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(fileURLToPath(import.meta.url), "..", "..");
const srcRoot = join(appRoot, "src");

const BRAND_GREEN = /#(?:143[Ff]35|052[Ee]16|0[Ee]4[Aa]3[Dd]|18362[Aa]|122019|0[Cc]1512|226[Aa]56|176[Bb]57|1[Ff]7[Aa]5[Aa]|4[Ff][Bb]48[Bb]|065[Ff]46|166534|15803[Dd]|0[Ff]766[Ee]|047857|E4[Ff]0[Ee][Aa]|183329)\b/g;

const SKIP = [
  /styles\/theme\.css$/,
  /mushaf/i,
  /memorize/i,
  /\/fc-/,
  /Flashcards/,
  /quran-engine/,
  /styles\/quran\.css$/,
  /mushaf-reader/,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(p, out);
    } else if (/\.(css|tsx|ts|jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(srcRoot)) {
  const rel = relative(srcRoot, file).replace(/\\/g, "/");
  if (SKIP.some((r) => r.test(rel))) continue;
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    const m = line.match(BRAND_GREEN);
    if (m) hits.push(`${rel}:${i + 1}: ${m.join(", ")}`);
  });
}

if (hits.length) {
  console.error(`❌ وُجدت ${hits.length} درجة أخضر خارج ملف الرموز:\n`);
  for (const h of hits.slice(0, 40)) console.error(`  - ${h}`);
  if (hits.length > 40) console.error(`  … و${hits.length - 40} أخرى`);
  process.exit(1);
}

console.log("✓ صفر كود أخضر brand خارج styles/theme.css (مع استثناء المصحف/الحفظ).");
