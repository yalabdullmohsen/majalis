#!/usr/bin/env node
/**
 * يدقق أن صفحات /rulings المصيَّرة ليست بصمة الرئيسية، وأنها تحمل نص الحكم.
 * التشغيل بعد generate:seo: node scripts/audit-rulings-prerender.mjs
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const prerender = join(root, "seo-prerender");
const homePath = join(prerender, "index.html");

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name === "index.html") acc.push(p);
  }
  return acc;
}

function fingerprint(html) {
  return createHash("sha256").update(html).digest("hex");
}

function assertRulingPage(file, homeFp) {
  const html = readFileSync(file, "utf8");
  const fp = fingerprint(html);
  if (fp === homeFp) {
    throw new Error(`بصمة مطابقة للرئيسية: ${file}`);
  }
  if (/سُنّة — منصة الدروس الشرعية/.test(html) && !/\/rulings\//.test(file)) {
    /* ignore */
  }
  if (!/<h1[^>]*>/.test(html)) throw new Error(`بلا H1: ${file}`);
  if (/حكم شرعي موثّق من الموسوعة الفقهية/.test(html) && !/<h2>الحكم<\/h2>/.test(html)) {
    throw new Error(`وصف عام بلا نص الحكم: ${file}`);
  }
  if (!/<h2>الحكم<\/h2>/.test(html) && !/تصوير المسألة/.test(html)) {
    throw new Error(`محتوى حكم ناقص: ${file}`);
  }
  if (/qa-ruling|النبي الذي كلمه الله/.test(html) && /seo-prerender\/rulings\//.test(file)) {
    throw new Error(`سؤال مسابقة تحت rulings: ${file}`);
  }
}

if (!existsSync(homePath)) {
  console.error("seo-prerender/index.html مفقود — شغّل generate:seo أولاً");
  process.exit(1);
}

const homeFp = fingerprint(readFileSync(homePath, "utf8"));
const rulingPages = walk(join(prerender, "rulings")).filter(
  (f) => !f.endsWith(`${join("rulings", "index.html")}`) && !f.includes(`${join("rulings", "index.html")}`),
);
// استبعد صفحة فهرس /rulings نفسها — ليست صفحة حكم مفردة
const rulingDetailPages = rulingPages.filter((f) => /rulings[/\\][^/\\]+[/\\]index\.html$/.test(f));
if (rulingDetailPages.length < 1) {
  console.error("لا صفحات prerender تحت seo-prerender/rulings/:id");
  process.exit(1);
}

let failed = 0;
for (const file of rulingDetailPages) {
  try {
    assertRulingPage(file, homeFp);
  } catch (err) {
    failed += 1;
    console.error("✖", err.message);
  }
}

console.log(`Rulings prerender audit: ${rulingDetailPages.length - failed}/${rulingDetailPages.length} ok`);
if (failed) process.exit(1);
