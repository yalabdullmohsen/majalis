/**
 * بوابة: صفحات admin/private مستثناة من P0 لطول الوصف، ومطلوب noindex وخارج sitemap.
 * تشغيل: node --import tsx src/lib/__tests__/seo-admin-privacy.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADMIN_DEFAULT_DESCRIPTION,
  ADMIN_DEFAULT_ROBOTS,
  isPrivateSeoPath,
  PUBLIC_DESC_MIN_P0,
} from "../../../scripts/seo-path-class.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const seo = JSON.parse(readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8"));
const testSeo = readFileSync(resolve(root, "scripts/test-seo.mjs"), "utf8");
const robotsTxt = readFileSync(resolve(root, "public/robots.txt"), "utf8");
const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf8");

assert.equal(isPrivateSeoPath("/admin"), true);
assert.equal(isPrivateSeoPath("/admin/fiqh-review"), true);
assert.equal(isPrivateSeoPath("/dashboard/x"), true);
assert.equal(isPrivateSeoPath("/internal/tools"), true);
assert.equal(isPrivateSeoPath("/prophets"), false);
assert.equal(isPrivateSeoPath("/"), false);

assert.match(testSeo, /isPrivateSeoPath/);
assert.match(testSeo, /privatePath/);
assert.match(testSeo, /PUBLIC_DESC_MIN_P0/);

const adminRoutes = seo.routes.filter((r) => isPrivateSeoPath(r.path));
assert.ok(adminRoutes.length >= 10, "يجب وجود مسارات admin في seo-routes");
for (const r of adminRoutes) {
  assert.ok(String(r.robots || "").includes("noindex"), `${r.path} يجب noindex`);
  assert.equal(r.sitemap, false, `${r.path} خارج sitemap`);
  assert.ok(
    String(r.description || "").length >= PUBLIC_DESC_MIN_P0,
    `${r.path} وصف admin قصير في الإعداد`,
  );
  assert.ok(
    String(r.description || "").includes("غير مخصصة للفهرسة") ||
      r.description === ADMIN_DEFAULT_DESCRIPTION,
    `${r.path} يجب أن يستخدم وصف admin الداخلي`,
  );
}

assert.match(robotsTxt, /Disallow:\s*\/admin/);
assert.match(robotsTxt, /Disallow:\s*\/dashboard/);
assert.match(robotsTxt, /Disallow:\s*\/internal/);

assert.doesNotMatch(sitemap, /https?:\/\/[^<]+\/admin(\/|"|<)/);
assert.equal(ADMIN_DEFAULT_ROBOTS.includes("noindex"), true);

const publicShort = seo.routes.filter(
  (r) =>
    !isPrivateSeoPath(r.path) &&
    String(r.description || "").trim().length > 0 &&
    String(r.description || "").trim().length < PUBLIC_DESC_MIN_P0,
);
assert.equal(
  publicShort.length,
  0,
  `صفحات عامة بوصف أقصر من ${PUBLIC_DESC_MIN_P0}: ${publicShort.map((r) => r.path).join(", ")}`,
);

console.log(
  `seo-admin-privacy: OK — ${adminRoutes.length} مسار admin/private، بلا وصف عام قصير تحت ${PUBLIC_DESC_MIN_P0}`,
);
