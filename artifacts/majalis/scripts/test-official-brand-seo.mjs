#!/usr/bin/env node
/**
 * يحمي مصدر الصور الرسمي من الرجوع لشعارات/OG قديمة.
 * تشغيل: node scripts/test-official-brand-seo.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const site = JSON.parse(read("site.config.json"));
const seo = JSON.parse(read("src/lib/seo-routes.json"));
const siteUrl = site.siteUrl;

assert.equal(siteUrl, "https://majlisilm.com", "canonical بلا www");
assert.ok(String(site.defaultImage).startsWith("/brand/official-og.png"));
assert.ok(String(site.logoImage).startsWith("/brand/official.png"));
assert.equal(seo.defaultImage, site.defaultImage);
assert.equal(seo.siteUrl, siteUrl);

const required = [
  "public/brand/official.png",
  "public/brand/official-og.png",
  "public/favicon.ico",
  "public/apple-touch-icon.png",
  "public/icon-192.png",
  "public/icon-512.png",
];
for (const f of required) {
  assert.ok(existsSync(resolve(root, f)), `مفقود: ${f}`);
}
assert.equal(existsSync(resolve(root, "public/majlisilm-og-2026.jpg")), false, "الملف القديم majlisilm-og-2026 يجب ألا يبقى");

const indexHtml = read("index.html");
const og = indexHtml.match(/property="og:image"\s+content="([^"]+)"/)?.[1] || "";
const tw = indexHtml.match(/name="twitter:image"\s+content="([^"]+)"/)?.[1] || "";
assert.ok(/^https:\/\/majlisilm\.com\//.test(og), `og:image يجب absolute — وجد ${og}`);
assert.ok(/^https:\/\/majlisilm\.com\//.test(tw), `twitter:image يجب absolute — وجد ${tw}`);
assert.ok(og.includes("/brand/official-og.png"), "og:image = official-og");
assert.ok(tw.includes("/brand/official-og.png"), "twitter:image = official-og");
assert.match(indexHtml, /twitter:card" content="summary_large_image"/);
assert.match(indexHtml, /og:image:width" content="1200"/);
assert.match(indexHtml, /og:image:height" content="630"/);
assert.match(indexHtml, /canonical" href="https:\/\/majlisilm\.com\/"/);
assert.doesNotMatch(indexHtml, /majlisilm-og-2026/);

for (const man of ["public/manifest.webmanifest", "public/manifest.json", "public/site.webmanifest"]) {
  const m = JSON.parse(read(man));
  assert.equal(m.name, "سُنّة");
  assert.equal(m.short_name, "سُنّة");
  const srcs = (m.icons || []).map((i) => i.src).join("\n");
  assert.doesNotMatch(srcs, /majlisilm-og-2026|favicon\.svg/);
  assert.match(srcs, /icon-512\.png/);
  assert.match(srcs, /official\.png|apple-touch-icon|icon-192/);
}

const structured = read("src/lib/seo-structured-data.ts");
assert.match(structured, /official\.png/);
assert.doesNotMatch(structured, /logo\.png"\)/);
assert.match(structured, /image:\s*absoluteUrl\(DEFAULT_IMAGE\)/);

const robots = read("public/robots.txt");
assert.match(robots, /Allow:\s*\/brand\//);
assert.match(robots, /Allow:\s*\/favicon\.ico/);
assert.match(robots, /Allow:\s*\/manifest\.webmanifest/);

const seoTs = read("src/lib/seo.ts");
assert.doesNotMatch(seoTs, /majlisilm-og-2026/);

console.log("✓ test-official-brand-seo: مصدر رسمي واحد + روابط مطلقة + بلا أصول قديمة");
