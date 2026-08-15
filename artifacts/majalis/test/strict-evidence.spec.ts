/**
 * اختبار منع رجوع — STRICT_EVIDENCE على dist بعد البناء.
 * تشغيل: node --import tsx test/strict-evidence.spec.ts
 * يتطلب وجود dist (بعد pnpm run build).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

assert.ok(fs.existsSync(dist), "dist مفقود — شغّل build أولاً");

function walk(dir: string, out: string[] = []): string[] {
  for (const n of fs.readdirSync(dir)) {
    if (n === "node_modules") continue;
    const p = path.join(dir, n);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(html|js|css|json|xml)$/.test(n)) out.push(p);
  }
  return out;
}

const BANNED = [
  ["info", "@", "majlisilm", ".", "com"].join(""),
  ["yalabdullmohsen1", "@", "gmail", ".", "com"].join(""),
  "رابط القراءة",
  "المصدر: رابط القراءة",
  "جميع العلاقات المعروضة موثقة",
  "فيلسوف الإسلام الأكبر",
  "فقيه المذهب غير المنازع",
];

for (const file of walk(dist)) {
  const text = fs.readFileSync(file, "utf8");
  for (const b of BANNED) {
    assert.equal(text.includes(b), false, `${path.relative(root, file)}: ${b}`);
  }
}

function findPage(slug: string): string {
  const p = path.join(dist, slug, "index.html");
  assert.ok(fs.existsSync(p), `missing ${slug}`);
  return fs.readFileSync(p, "utf8");
}

function robots(html: string) {
  return html.match(/name=["']robots["'][^>]*content=["']([^"']*)/i)?.[1] || "";
}

const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");

{
  const html = findPage("knowledge-graph");
  assert.match(robots(html), /noindex/i);
  assert.match(html, /قيد الإعداد/);
  assert.equal(html.includes("جميع العلاقات المعروضة موثقة"), false);
  assert.equal(sitemap.includes("/knowledge-graph<"), false);
}

{
  const html = findPage("library/book-qurtubi");
  assert.equal(html.includes("رابط القراءة"), false);
  assert.match(html, /فتح المصدر|quran\.ksu\.edu/);
}

{
  const html = findPage("library/book-seerah-ibn-hisham");
  assert.match(robots(html), /noindex/i);
  assert.match(html, /قيد الإضافة/);
  assert.equal(sitemap.includes("/library/book-seerah-ibn-hisham<"), false);
}

console.log("strict-evidence.spec OK");
