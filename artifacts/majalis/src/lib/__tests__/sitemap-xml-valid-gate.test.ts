/**
 * بوابة: sitemap.xml معايير schema 0.9 + استبعاد المسارات الخاصة.
 * تشغيل: node --import tsx src/lib/__tests__/sitemap-xml-valid-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSitemapXmlDocument,
  validateSitemapXml,
} from "../../../scripts/sitemap-xml.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const sitemapPath = resolve(root, "public/sitemap.xml");
const xslPath = resolve(root, "public/sitemap.xsl");
const genSeo = readFileSync(resolve(root, "scripts/generate-seo.mjs"), "utf8");
const builder = readFileSync(resolve(root, "lib/cms/sitemap-builder.mjs"), "utf8");

assert.ok(existsSync(sitemapPath), "public/sitemap.xml موجود");
assert.ok(existsSync(xslPath), "public/sitemap.xsl موجود");
assert.match(genSeo, /buildSitemapXmlDocument/, "generate-seo يستخدم المولّد الموحّد");
assert.match(builder, /buildSitemapXmlDocument/, "sitemap-builder يستخدم المولّد الموحّد");

const xml = readFileSync(sitemapPath, "utf8");
const result = validateSitemapXml(xml, { siteUrl: "https://www.ssunnah.com" });
assert.equal(result.ok, true, result.errors.join("; "));
assert.ok(result.urlCount >= 50, `عدد روابط كافٍ: ${result.urlCount}`);
assert.match(xml, /<\?xml-stylesheet[^>]+href="\/sitemap\.xsl"/);
assert.doesNotMatch(xml, /\/admin(\/|"|<)/);
assert.doesNotMatch(xml, /\/fiqh-council/);
assert.doesNotMatch(xml, /pending[_-]review/i);
assert.doesNotMatch(xml, /\/library(\/|"|<)/);

const sample = buildSitemapXmlDocument(
  [
    { loc: "/", priority: 1, changefreq: "daily" },
    { loc: "/admin", priority: 0.9 },
    { loc: "/lessons", priority: 0.9, changefreq: "daily" },
    { loc: "/fiqh-council", priority: 0.5 },
  ],
  { siteUrl: "https://www.ssunnah.com", lastmodFallback: "2026-09-18", stylesheetHref: null },
);
assert.match(sample, /<loc>https:\/\/www\.ssunnah\.com\/<\/loc>/);
assert.match(sample, /<loc>https:\/\/www\.ssunnah\.com\/lessons<\/loc>/);
assert.doesNotMatch(sample, /\/admin/);
assert.doesNotMatch(sample, /fiqh-council/);
assert.match(sample, /<priority>1\.0<\/priority>/);
assert.match(sample, /<lastmod>2026-09-18<\/lastmod>/);

console.log(`sitemap-xml-valid-gate: ok (${result.urlCount} urls)`);
