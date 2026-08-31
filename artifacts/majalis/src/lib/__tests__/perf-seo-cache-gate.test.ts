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
const CANON = "https://www.ssunnah.com";

assert.match(
  vercel,
  /"source"\s*:\s*"\/"[\s\S]{0,280}"Cache-Control"[\s\S]{0,120}public,\s*max-age=0,\s*s-maxage=\d+/,
  "الرئيسية: CDN cache مع s-maxage بلا no-store",
);
assert.match(
  vercel,
  /"source"\s*:\s*"\/"[\s\S]{0,400}"Content-Type"[\s\S]{0,80}text\/html;\s*charset=utf-8/,
  "الرئيسية ترجع text/html; charset=utf-8",
);
assert.match(vercel, /charset=utf-8/, "ترويسة charset لمسارات SPA");
assert.equal(
  /"source"\s*:\s*"\/"[\s\S]{0,220}no-store/.test(vercel),
  false,
  "ممنوع no-store على /",
);
assert.match(robots, /Disallow:\s*\/search/);
assert.match(robots, /Disallow:\s*\/admin/);
assert.equal(sitemap.includes(`<loc>${CANON}/search</loc>`), false);
assert.match(sitemap, new RegExp(`<loc>${CANON.replace(/\./g, "\\.")}/hadith/sahih</loc>`));
assert.match(sitemap, new RegExp(`<loc>${CANON.replace(/\./g, "\\.")}/hadith/daif</loc>`));
assert.match(sitemap, new RegExp(`<loc>${CANON.replace(/\./g, "\\.")}/hadith/books-and-rulings</loc>`));
assert.match(sitemap, new RegExp(`<loc>${CANON.replace(/\./g, "\\.")}/hadith/mawdu</loc>`));
assert.match(appSearch, /export async function runAppSearch/);

console.log("perf-seo-cache-gate.test.ts: ok");
