/**
 * اختبارات النص المعروض/المفهرس لقصص الأنبياء.
 * تشغيل: node --import tsx test/rendered-content.spec.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SLUGS = ["yahya", "sulayman", "idris", "muhammad"] as const;

const FORBIDDEN = [
  "Esc للقائمة",
  "اختصارات",
  "القوم / البلدبيت",
  "الذِّكر في القرآن7",
  "undefined",
  "null",
  "TODO",
  "placeholder",
];

const FIELD_STICK_RE =
  /(القوم \/ البلد|الحقبة|الذِّكر في القرآن|أبرز سورة|مواضع في القرآن|(?<![\u0600-\u06FF])المؤلف(?!ات)|(?<![\u0600-\u06FF])التصنيف(?!ات)|(?<![\u0600-\u06FF])المصدر)(?=[\u0621-\u064A0-9\u0660-\u0669])/u;

function findPage(slug: string): string {
  for (const base of ["seo-prerender", "dist"]) {
    const p = path.join(root, base, "prophets", slug, "index.html");
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  }
  throw new Error(`لا توجد صفحة مُصيَّرة لـ /prophets/${slug} — شغّل البناء أولاً`);
}

function stripTight(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, "");
}

function articleOf(html: string): string {
  return html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] || "";
}

function descriptionOf(html: string): string {
  return html.match(/name=["']description["'][^>]*content=["']([^"']*)/i)?.[1] || "";
}

let failed = 0;
for (const slug of SLUGS) {
  const html = findPage(slug);
  const article = articleOf(html);
  const desc = descriptionOf(html);
  const surfaces = [article, desc, html].join("\n");
  const tight = stripTight(article);
  const dlBlocks = [...article.matchAll(/<dl[\s\S]*?<\/dl>/gi)].map((m) => stripTight(m[0] || ""));

  for (const phrase of FORBIDDEN) {
    if (surfaces.includes(phrase)) {
      console.error(`FAIL /prophets/${slug}: وُجد «${phrase}»`);
      failed++;
    }
  }

  for (const block of [tight, ...dlBlocks]) {
    if (FIELD_STICK_RE.test(block)) {
      console.error(`FAIL /prophets/${slug}: التصاق حقول في «${block.slice(0, 80)}»`);
      failed++;
      break;
    }
  }

  if (/اختصارات|Esc للقائمة|← التالي|→ السابق/.test(article)) {
    console.error(`FAIL /prophets/${slug}: تنقل/اختصارات داخل <article>`);
    failed++;
  }

  assert.ok(desc.length > 20, `${slug}: description قصيرة جداً`);
  assert.ok(!/اختصارات|Esc|← التالي/.test(desc), `${slug}: description تحتوي واجهة`);
  console.log(`OK /prophets/${slug}`);
}

const src = fs.readFileSync(path.join(root, "src/views/ProphetStoriesPage.tsx"), "utf8");
assert.match(src, /aria-label=["']تنقل قصص الأنبياء["']/);
assert.match(src, /<dl className="prophet-facts-grid"/);
assert.doesNotMatch(src, /<article[\s\S]{0,8000}Esc للقائمة/);

if (failed) {
  console.error(`rendered-content.spec FAILED (${failed})`);
  process.exit(1);
}
console.log("rendered-content.spec OK");
