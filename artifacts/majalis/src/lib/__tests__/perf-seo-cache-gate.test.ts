/**
 * بوابة: كاش الرئيسية ليس no-store · robots يمنع /search · sitemap بلا /search.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");
const robots = readFileSync(resolve(root, "public/robots.txt"), "utf8");
const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf8");
const appSearch = readFileSync(resolve(root, "src/features/search/app-search.ts"), "utf8");

assert.match(
  vercel,
  /"source"\s*:\s*"\/"[\s\S]{0,220}"Cache-Control"[\s\S]{0,80}public,\s*max-age=0,\s*must-revalidate/,
  "الرئيسية يجب أن تكون public,max-age=0,must-revalidate لا no-store",
);
assert.equal(
  /"source"\s*:\s*"\/"[\s\S]{0,220}no-store/.test(vercel),
  false,
  "ممنوع no-store على /",
);
assert.match(robots, /Disallow:\s*\/search/);
assert.match(robots, /Disallow:\s*\/admin/);
assert.equal(/<loc>https:\/\/majlisilm\.com\/search<\/loc>/.test(sitemap), false);
assert.match(sitemap, /<loc>https:\/\/majlisilm\.com\/hadith\/sahih<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/majlisilm\.com\/hadith\/daif<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/majlisilm\.com\/hadith\/books-and-rulings<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/majlisilm\.com\/hadith\/mawdu<\/loc>/);
assert.match(appSearch, /export async function runAppSearch/);

console.log("perf-seo-cache-gate.test.ts: ok");
