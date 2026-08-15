/**
 * اختبارات Evidence-Gated — تمنع رجوع أخطاء مثبتة سابقاً.
 * تشغيل: node --import tsx test/site-data-evidence.spec.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function findHtml(slugPath: string): string {
  for (const base of ["seo-prerender", "dist"]) {
    const p = path.join(root, base, slugPath, "index.html");
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  }
  throw new Error(`missing ${slugPath}`);
}

function article(html: string) {
  return html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] || "";
}

function desc(html: string) {
  return html.match(/name=["']description["'][^>]*content=["']([^"']*)/i)?.[1] || "";
}

function robots(html: string) {
  return html.match(/name=["']robots["'][^>]*content=["']([^"']*)/i)?.[1] || "";
}

// 1) لا واجهة داخل article/meta للأنبياء
for (const slug of ["yahya", "idris", "muhammad", "sulayman"]) {
  const html = findHtml(`prophets/${slug}`);
  const art = article(html);
  const d = desc(html);
  for (const ph of ["Esc للقائمة", "اختصارات:", "نسخ النص", "سناب شات"]) {
    assert.equal(art.includes(ph), false, `${slug} article: ${ph}`);
    assert.equal(d.includes(ph), false, `${slug} meta: ${ph}`);
  }
  assert.match(html, /<dl[\s\S]*<dt>الحقبة:/);
}

// 2) لا التصاق حرفي
for (const slug of ["yahya", "idris"]) {
  const tight = article(findHtml(`prophets/${slug}`)).replace(/<[^>]+>/g, "").replace(/\s+/g, "");
  assert.equal(tight.includes("الحقبةابن"), false);
  assert.equal(tight.includes("القوم/البلدبيت"), false);
  assert.match(tight, /الحقبة:/);
}

// 3) لا إيميلات قديمة في src (خارج سكربتات الفحص)
function walk(dir: string, out: string[] = []) {
  for (const n of fs.readdirSync(dir)) {
    if (n === "node_modules" || n === "dist") continue;
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|json|html|mjs)$/.test(n) && !/audit-/.test(p)) out.push(p);
  }
  return out;
}
for (const f of walk(path.join(root, "src"))) {
  const t = fs.readFileSync(f, "utf8");
  assert.equal(/info@majlisilm\.com/i.test(t), false, f);
  assert.equal(/yalabdullmohsen1@gmail\.com/i.test(t), false, f);
}

// 4) knowledge-graph ناقص → noindex
{
  const html = findHtml("knowledge-graph");
  assert.match(robots(html), /noindex/i);
  assert.match(html, /قيد الإعداد/);
}

// 5) لا حشو أنبياء
{
  const data = read("src/lib/prophets-data.ts");
  for (const ph of ["تُربط سيرته", "يُستحضر المآل", "الصبر على مقتضاه"]) {
    assert.equal(data.includes(ph), false, ph);
  }
}

// 6) Home fallback: عنوان فرعي ≠ عنوان الرئيسية
{
  const home = findHtml(".");
  // index at seo-prerender/index.html
  const homeHtml = fs.existsSync(path.join(root, "seo-prerender/index.html"))
    ? read("seo-prerender/index.html")
    : findHtml("");
  const homeTitle = homeHtml.match(/<title>([^<]*)/)?.[1] || "";
  const yahyaTitle = findHtml("prophets/yahya").match(/<title>([^<]*)/)?.[1] || "";
  assert.notEqual(yahyaTitle, homeTitle);
  assert.ok(yahyaTitle.includes("يحيى"));
}

// 7) مسارات ممثلة موجودة في prerender (وليست homepage)
for (const route of ["topics", "rulings", "fiqh-council", "library", "scholars", "prophets/yahya"]) {
  const html = findHtml(route);
  const title = html.match(/<title>([^<]*)/)?.[1] || "";
  assert.ok(title.length > 5, route);
  assert.ok(!/undefined|null|TODO|placeholder/i.test(desc(html)), route);
}

console.log("site-data-evidence.spec OK");
