#!/usr/bin/env node
/**
 * يمنع ظهور بريد قديم أو شخصي في المصادر المعروضة.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FORBIDDEN = [/info@majlisilm\.com/i, /@gmail\.com/i];
const ALLOWED_GMAIL = /Majlisilm\.app@gmail\.com/i;

const SCAN_DIRS = ["src", "scripts", "public", "seo-prerender"];
const EXT = /\.(tsx?|jsx?|mjs|json|html|md|css)$/i;
/** ملفات توثيق المتاجر/النسخ الاحتياطية خارج نطاق واجهة الموقع */
const SKIP_PATH = /(?:^|\/)(?:\.backup|store|node_modules|dist)(?:\/|$)/;

let failed = 0;
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".backup" || name === "dist") continue;
    const p = join(dir, name);
    if (SKIP_PATH.test(p)) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => {
  const p = join(root, d);
  try {
    return walk(p);
  } catch {
    return [];
  }
});

const selfPath = fileURLToPath(import.meta.url);

for (const file of files) {
  if (file === selfPath) continue; // لا نفحص نص الأنماط داخل المدقق نفسه
  const text = readFileSync(file, "utf8");
  if (/info@majlisilm\.com/i.test(text)) {
    console.error("✖ info@majlisilm.com في", file);
    failed++;
  }
  // اسمح فقط بالبريد الرسمي إن وُجد gmail
  const gmails = text.match(/[A-Za-z0-9._%+-]+@gmail\.com/gi) || [];
  for (const g of gmails) {
    if (!ALLOWED_GMAIL.test(g)) {
      console.error("✖ بريد gmail غير مسموح:", g, "في", file);
      failed++;
    }
  }
}

const site = readFileSync(join(root, "site.config.json"), "utf8");
if (!ALLOWED_GMAIL.test(site)) {
  console.error("✖ site.config يجب أن يحتوي Majlisilm.app@gmail.com");
  failed++;
}

console.log(failed ? `Email audit failed (${failed})` : `Email audit ok (${files.length} files)`);
process.exit(failed ? 1 : 0);
