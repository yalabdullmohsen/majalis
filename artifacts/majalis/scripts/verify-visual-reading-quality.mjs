#!/usr/bin/env node
/**
 * بوابة جودة القراءة البصرية + فقه تفاعلي.
 * تشغيل: node scripts/verify-visual-reading-quality.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fails = [];

function read(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) {
    fails.push(`ملف مفقود: ${rel}`);
    return "";
  }
  return readFileSync(p, "utf8");
}

const theme = read("src/app/styles/theme.css");
if (!theme.includes("#F7F3EB")) fails.push("theme.css يجب أن يحتوي #F7F3EB");
if (!theme.includes("#0F5C45")) fails.push("theme.css يجب أن يحتوي #0F5C45");

const chapterView = read("src/pages/fiqh/ui/FiqhChapterView.tsx");
if (!/ve-accordion|details/.test(chapterView)) {
  fails.push("FiqhChapterView يجب أن يستخدم ve-accordion أو details");
}
if (!chapterView.includes("adjacentFiqhChapters")) {
  fails.push("FiqhChapterView يجب أن يستورد/يستدعي adjacentFiqhChapters");
}
if (/whatsapp|WhatsApp|wa\.me/i.test(chapterView)) {
  fails.push("FiqhChapterView لا يجوز أن يحتوي أزرار واتساب");
}

const editorial = read("src/lib/fiqh-editorial.ts");
if (!/export function stripLeadingTitle/.test(editorial)) {
  fails.push("fiqh-editorial يجب أن يصدّر stripLeadingTitle");
}

if (fails.length) {
  console.error("❌ verify-visual-reading-quality فشل:");
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("✓ verify-visual-reading-quality: ok");
