/**
 * بوابة: مسارات حسّاسة/ناقصة خارج sitemap + noindex.
 * node --import tsx src/lib/__tests__/seo-sensitive-noindex-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const sitemap = read("public/sitemap.xml");
const robots = read("public/robots.txt");
const routes = JSON.parse(read("src/lib/seo-routes.json")) as {
  routes: Array<{ path: string; sitemap?: boolean; robots?: string }>;
};
const vercel = read("vercel.json");
const trust = read("src/lib/fiqh-council-trust.ts");

const MUST_NOT_SITEMAP = [
  "/admin",
  "/dashboard",
  "/login",
  "/register",
  "/auth",
  "/search",
  "/quran/recitation-test-ai",
  "/fiqh-council/research-assistant",
  "/academic-research",
  "/fiqh-council/research",
  "/fiqh-council/issues/genetic-testing-ancestry-ruling",
];

for (const path of MUST_NOT_SITEMAP) {
  assert.doesNotMatch(
    sitemap,
    new RegExp(`<loc>https://majlisilm\\.com${path.replace(/\//g, "\\/")}</loc>`),
    `sitemap بلا ${path}`,
  );
}

for (const path of [
  "/academic-research",
  "/fiqh-council/research",
  "/quran/recitation-test-ai",
  "/fiqh-council/research-assistant",
  "/fiqh-council/issues/genetic-testing-ancestry-ruling",
]) {
  assert.match(robots, new RegExp(`Disallow:\\s*${path.replace(/\//g, "\\/")}`));
}

for (const path of ["/academic-research", "/fiqh-council/research", "/register", "/quran/recitation-test-ai", "/search", "/login", "/dashboard"]) {
  const row = routes.routes.find((r) => r.path === path);
  assert.ok(row, `seo-routes: ${path}`);
  assert.equal(row!.sitemap, false, `${path} خارج sitemap`);
  assert.match(String(row!.robots || ""), /noindex/i, `${path} noindex`);
}

for (const path of ["/search", "/login", "/register", "/dashboard"]) {
  const row = routes.routes.find((r) => r.path === path)!;
  assert.match(String(row.robots || ""), /nofollow/i, `${path} nofollow`);
}

assert.match(trust, /genetic-testing-ancestry-ruling/);
assert.match(trust, /SENSITIVE_NOINDEX_ISSUE_SLUGS/);
const oldBrand = ["المجلس", "العلمي"].join(" ");
assert.match(robots, /Disallow:\s*\/auth/);
assert.doesNotMatch(JSON.stringify(routes), new RegExp(`${oldBrand}|منصة المجل`));
assert.doesNotMatch(JSON.stringify(routes), new RegExp(["info", "@", "majlisilm", ".", "com"].join("")));
assert.match(vercel, /academic-research[\s\S]*?noindex, nofollow/);
assert.match(vercel, /genetic-testing-ancestry-ruling[\s\S]*?noindex, nofollow/);

console.log("seo-sensitive-noindex-gate.test.ts: ok");
