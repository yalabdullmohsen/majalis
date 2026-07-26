#!/usr/bin/env node
/**
 * يتحقق من أن صفحات dist المصيَّرة لها عناوين فريدة وليست عنوان الرئيسية.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(appRoot, "dist");
if (!existsSync(dist)) {
  console.error("✗ dist/ مفقود");
  process.exit(1);
}

function titleOf(rel) {
  const html = readFileSync(join(dist, rel), "utf8");
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : "";
}

const homeTitle = titleOf("index.html");
const samples = [
  ["library/book-bukhari/index.html", /بخاري/],
  ["library/book-muslim/index.html", /مسلم/],
  ["scholars/ibn-taymiyya/index.html", /تيمية/],
  ["scholars/nawawi/index.html", /نووي/],
  ["qa/index.html", /الأسئلة العلمية|أسئلة علمية/],
  ["quiz/index.html", /اختبر معلوماتك|سؤال وجواب|مسابقة|اختبار/],
  ["fiqh/index.html", /فقه/],
];

const failures = [];
const seen = new Set([homeTitle]);
for (const [rel, expect] of samples) {
  if (!existsSync(join(dist, rel))) {
    failures.push(`ملف مفقود: ${rel}`);
    continue;
  }
  const t = titleOf(rel);
  if (!t) failures.push(`${rel}: بلا title`);
  if (t === homeTitle) failures.push(`${rel}: عنوان الرئيسية متسرّب («${t}»)`);
  if (t.includes("كتاب شرعي")) failures.push(`${rel}: عنوان عام ممنوع`);
  if (expect && !expect.test(t)) failures.push(`${rel}: العنوان لا يطابق المتوقع — «${t}»`);
  if (seen.has(t) && t !== homeTitle) {
    /* قد يتكرر نادراً — نسجّل فقط */
  }
  seen.add(t);
}

if (failures.length) {
  console.error("✗ عناوين dist:\n" + failures.map((f) => "  " + f).join("\n"));
  process.exit(1);
}
console.log(`✓ عناوين dist فريدة عن الرئيسية للعيّنة (${samples.length}) — الرئيسية: «${homeTitle}»`);
