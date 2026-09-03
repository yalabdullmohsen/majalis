#!/usr/bin/env node
/**
 * فحص سلامة المحتوى الشرعي — منع عبارات الضعف/الموضوع في الواجهة العامة.
 *
 * Usage:
 *   node scripts/check-editorial-safety.js
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, readText, stripHtml } from "./monitoring-utils.mjs";

const FORBIDDEN = [
  { phrase: "ضعيف", allow: /الضعيف\s*للتنبيه|بين\s*الدرجات|\/hadith\/daif|علم/i },
  { phrase: "ضعّفه", allow: null },
  { phrase: "موضوع", allow: /\/hadith\/mawdu|علم/i },
  { phrase: "لا يصح", allow: null },
  { phrase: "لم يثبت", allow: null },
  { phrase: "منكر الحديث", allow: null },
  { phrase: "الدرجة في حقل الحكم", allow: null },
];

const ALLOWED_PREFIXES = [
  "/hadith/daif",
  "/hadith/mawdu",
  "/hadith-science",
  "/methodology",
  "/fatwa-policy",
];

const PUBLIC_SOURCES = [
  "index.html",
  "src/lib/ticker-content.ts",
  "src/components/NavBar.tsx",
  "src/components/HeaderTicker.tsx",
];

const failures = [];

function isAllowedContext(file, text, idx) {
  if (/hadith\/daif|hadith\/mawdu|hadith-science|methodology|fatwa-policy/i.test(file)) {
    return true;
  }
  const slice = text.slice(Math.max(0, idx - 80), idx + 80);
  if (/filterForPublicZone|hadithWeakPage|editorialWarning|educationalContext|isWeakGrade|WEAK_GRADE|PUBLIC_WEAK|displayZones/.test(slice)) {
    return true;
  }
  return false;
}

function scanFile(rel) {
  const text = readText(rel);
  for (const { phrase, allow } of FORBIDDEN) {
    let from = 0;
    while (true) {
      const idx = text.indexOf(phrase, from);
      if (idx === -1) break;
      const slice = text.slice(Math.max(0, idx - 80), idx + 80);
      if (allow?.test(slice)) {
        from = idx + phrase.length;
        continue;
      }
      if (!isAllowedContext(rel, text, idx)) {
        failures.push(`${rel}: «${phrase}» في سياق عام`);
      }
      from = idx + phrase.length;
    }
  }
}

function scanPrerenderHome() {
  const home = resolve(ROOT, "dist/index.html");
  if (!existsSync(home)) return;
  const raw = readFileSync(home, "utf8");
  const body = stripHtml(raw);
  for (const { phrase, allow } of FORBIDDEN) {
    let from = 0;
    while (true) {
      const idx = body.indexOf(phrase, from);
      if (idx === -1) break;
      const slice = body.slice(Math.max(0, idx - 80), idx + 80);
      if (!allow?.test(slice)) {
        failures.push(`dist/index.html: «${phrase}»`);
      }
      from = idx + phrase.length;
    }
  }
}

console.log("▶ check-editorial-safety\n");

for (const rel of PUBLIC_SOURCES) {
  if (!existsSync(resolve(ROOT, rel))) {
    failures.push(`${rel}: ملف مفقود`);
    continue;
  }
  scanFile(rel);
}

scanPrerenderHome();

for (const prefix of ALLOWED_PREFIXES) {
  const p = resolve(ROOT, "dist", prefix.replace(/^\//, ""), "index.html");
  if (existsSync(p)) {
    console.log(`· ${prefix} prerender موجود (مسموح)`);
  }
}

if (failures.length) {
  console.error("❌ check-editorial-safety فشل:");
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log("✅ check-editorial-safety — نجح");
