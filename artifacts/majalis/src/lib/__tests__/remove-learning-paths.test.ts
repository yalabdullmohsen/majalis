/**
 * بوابة: إلغاء مسارات التعلم نهائيًا من الواجهة العامة وsitemap.
 * تشغيل: node --import tsx src/lib/__tests__/remove-learning-paths.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

const FORBIDDEN_LABELS = [/مسارات التعلم/, /المسارات العلمية/];

const PUBLIC_SURFACES = [
  "src/components/home/HomeStartHereSection.tsx",
  "src/views/StartHerePage.tsx",
  "src/lib/services-center-nav.ts",
  "src/lib/site-footer-nav.ts",
  "src/lib/home-feature-catalog.ts",
  "src/lib/navigation.ts",
  "src/lib/explore-links.ts",
  "src/pages/lessons/ui/LessonsView.tsx",
  "src/pages/account/ui/SiteMapView.tsx",
  "src/pages/account/SectionsPage.tsx",
  "src/pages/account/MorePage.tsx",
  "src/features/more/moreSections.ts",
  "src/components/BottomNavBar.tsx",
  "src/components/MoreBottomSheet.tsx",
  "src/lib/ticker-content.ts",
];

for (const rel of PUBLIC_SURFACES) {
  const full = resolve(root, rel);
  if (!existsSync(full)) continue;
  const src = read(rel);
  for (const re of FORBIDDEN_LABELS) {
    assert.equal(re.test(src), false, `${rel} لا يجوز أن يعرض «${re.source}»`);
  }
  assert.equal(src.includes("/learning/paths"), false, `${rel} بلا رابط /learning/paths`);
}

const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
assert.match(app, /path="\/lessons"/, "/lessons يجب أن يبقى في الراوتر");
assert.equal(/path="\/lessons"[^>]*>\s*<Redirect\s+to=["']\/["']/.test(app), false, "/lessons لا يحوّل للرئيسية");
assert.match(
  app,
  /path="\/learning\/paths"[^>]*>\s*<Redirect\s+to="\/lessons"/,
  "/learning/paths → /lessons داخل التطبيق",
);
assert.match(
  app,
  /path="\/learning-paths"[^>]*>\s*<Redirect\s+to="\/lessons"/,
  "/learning-paths → /lessons داخل التطبيق",
);

const vercel = read("vercel.json");
for (const source of ["/learning/paths", "/learning-paths", "/lessons/paths", "/tracks", "/study-paths", "/pathways"]) {
  assert.match(
    vercel,
    new RegExp(
      `"source"\\s*:\\s*"${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]{0,180}"destination"\\s*:\\s*"/lessons"`,
    ),
    `vercel: ${source} → /lessons`,
  );
  assert.equal(
    new RegExp(
      `"source"\\s*:\\s*"${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]{0,180}"destination"\\s*:\\s*"/"`,
    ).test(vercel),
    false,
    `vercel: ${source} لا يحوّل إلى /`,
  );
}

const seoRoutes = read("src/lib/seo-routes.json");
assert.equal(seoRoutes.includes('"/learning/paths"'), false, "seo-routes بلا /learning/paths");
assert.equal(seoRoutes.includes('"/learning/paths/'), false, "seo-routes بلا تفاصيل مسارات");

const sitemap = read("public/sitemap.xml");
assert.equal(sitemap.includes("/learning/paths"), false, "sitemap بلا /learning/paths");
assert.equal(sitemap.includes("/lessons/paths"), false, "sitemap بلا /lessons/paths");
assert.match(sitemap, /https:\/\/majlisilm\.com\/lessons</, "sitemap يبقي /lessons");

console.log("remove-learning-paths.test.ts: ok");
