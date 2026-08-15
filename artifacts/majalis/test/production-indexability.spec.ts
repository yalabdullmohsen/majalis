/**
 * اختبارات منع رجوع أخطاء الفهرسة/الإنتاج المثبتة.
 * تشغيل: node --import tsx test/production-indexability.spec.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function findHtml(slugPath: string): string {
  for (const base of ["seo-prerender", "dist"]) {
    const p = path.join(root, base, slugPath === "." ? "index.html" : path.join(slugPath, "index.html"));
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  }
  throw new Error(`missing ${slugPath}`);
}

function robots(html: string) {
  return html.match(/name=["']robots["'][^>]*content=["']([^"']*)/i)?.[1] || "";
}

function desc(html: string) {
  return html.match(/name=["']description["'][^>]*content=["']([^"']*)/i)?.[1] || "";
}

function article(html: string) {
  return html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] || "";
}

function sitemapHas(route: string): boolean {
  const xml = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
  return xml.includes(`https://majlisilm.com${route}<`) || xml.includes(`https://majlisilm.com${route}/<`);
}

const SAMPLE = [
  "library/book-qurtubi",
  "library/book-seerah-ibn-hisham",
  "library/book-qawaid-arbaa",
  "knowledge-graph",
  "scholars/ghazali",
  "scholars/ibn-rushd",
  "quran/surah-stories/75",
  "adhkar",
  "sins-and-rights/ghibah",
];

for (const route of SAMPLE) {
  const html = findHtml(route);
  assert.equal(/info@majlisilm\.com/i.test(html), false, `${route}: info@`);
  assert.equal(/yalabdullmohsen1@gmail\.com/i.test(html), false, `${route}: yalabdull`);
  assert.equal(html.includes("رابط القراءة"), false, `${route}: رابط القراءة`);
  assert.equal(html.includes("المصدر: رابط القراءة"), false, `${route}: المصدر: رابط القراءة`);
  for (const ph of ["Esc للقائمة", "اختصارات:", "نسخ النص"]) {
    assert.equal(article(html).includes(ph), false, `${route} article: ${ph}`);
    assert.equal(desc(html).includes(ph), false, `${route} meta: ${ph}`);
  }
}

// كتب بلا مصدر → noindex + خارج sitemap
for (const route of ["library/book-seerah-ibn-hisham", "library/book-qawaid-arbaa"]) {
  const html = findHtml(route);
  assert.match(robots(html), /noindex/i, route);
  assert.match(html, /قيد الإضافة/);
  assert.equal(sitemapHas(`/${route}`), false, `${route} must leave sitemap`);
}

// كتاب بمصدر حقيقي → لا «رابط القراءة»، ويفضّل فتح المصدر
{
  const html = findHtml("library/book-qurtubi");
  assert.equal(html.includes("رابط القراءة"), false);
  assert.match(html, /فتح المصدر|quran\.ksu\.edu/);
  assert.match(robots(html), /index/i);
}

// knowledge-graph قيد إعداد → noindex + خارج sitemap + بلا دعوى توثيق كامل
{
  const html = findHtml("knowledge-graph");
  assert.match(robots(html), /noindex/i);
  assert.match(html, /قيد الإعداد/);
  assert.equal(/جميع العلاقات موثقة/.test(html), false);
  assert.equal(sitemapHas("/knowledge-graph"), false);
}

// قيد المراجعة في صفحة مفهرسة (غير methodology) ممنوعة
for (const route of SAMPLE.filter((r) => r !== "knowledge-graph")) {
  const html = findHtml(route);
  const r = robots(html);
  if (/قيد المراجعة الشرعية/.test(html) && !/methodology/.test(route)) {
    assert.match(r, /noindex/i, `${route}: قيد مراجعة بلا noindex`);
  }
  if (/قيد الإعداد/.test(desc(html))) {
    assert.match(r, /noindex/i, `${route}: قيد إعداد في meta بلا noindex`);
  }
}

// علماء: لا تزكية مطلقة ممنوعة في الصفحة المبنية
for (const route of ["scholars/ghazali", "scholars/ibn-rushd"]) {
  const html = findHtml(route);
  assert.equal(html.includes("فيلسوف الإسلام الأكبر"), false, route);
  assert.equal(html.includes("فقيه المذهب غير المنازع"), false, route);
}

{
  const html = findHtml("scholars/ghazali");
  if (/حجة الإسلام/.test(html)) {
    assert.match(html, /اشتهر عند بعض|لقب «حجة الإسلام»|لقب «حجة/);
  }
}

console.log("production-indexability.spec OK");
