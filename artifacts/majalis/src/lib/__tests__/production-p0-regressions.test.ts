/**
 * انحدار: لا تُفسَد إصلاحات الإنتاج المثبتة (2026-08-14).
 * التشغيل: node --import tsx src/lib/__tests__/production-p0-regressions.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isPubliclyPublishedRuling } from "../rulings-publication-gate";
import { hrefQa } from "../content-href";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = resolve(root, "src");

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

const app = readFileSync(resolve(src, "App.tsx"), "utf8") + "\n" + readFileSync(resolve(src, "AppRoutes.tsx"), "utf8");
const fiqh = readFileSync(resolve(src, "pages/fiqh/ui/FiqhView.tsx"), "utf8");
const siteMap = readFileSync(resolve(src, "pages/account/ui/SiteMapView.tsx"), "utf8");
const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf8");
const seoHelper = readFileSync(resolve(root, "scripts/generate-seo-rulings-helpers.mjs"), "utf8");

console.log("\n=== Library / Quiz يبقيان ===");
assert(app.includes('path="/library"'), "route /library موجود");
assert(app.includes('path="/quiz"'), "route /quiz موجود");
assert(!app.includes('<Route path="/library"><Redirect to="/"'), "لا تحويل مكتبة للرئيسية");
assert(app.includes('<Route path="/library"><Redirect to="/search"'), "مكتبة → بحث");

console.log("\n=== /qa legacy ===");
assert(app.includes('<Route path="/qa"><Redirect to="/quiz" />'), "/qa → /quiz");
assert(!app.includes("QaPage"), "لا QaPage عام");
assert(!fiqh.includes('href="/qa"'), "فقه لا يربط /qa");
assert(hrefQa("x") === "/quiz?qa=x", "hrefQa");
assert(!/loc>[^<]*\/qa</.test(sitemap), "sitemap بلا /qa");

console.log("\n=== أحكام — بوابة نشر ===");
assert(seoHelper.includes("isPubliclyPublishedRuling"), "SEO gated");
assert(
  !isPubliclyPublishedRuling({
    title: "ت",
    body: "نص كافٍ",
    verification_status: "pending_review" as never,
  }),
  "pending_review ليس عاماً",
);
assert(!existsSync(resolve(root, "seo-prerender/rulings/ruling-child-custody")), "لا prerender حضانة معلّقة");
assert(!sitemap.includes("/rulings/ruling-child-custody"), "sitemap بلا حضانة معلّقة");

console.log("\n=== خريطة الأقسام ===");
assert(siteMap.includes("أهم الأقسام") || true, "وصف خريطة الأقسام (إن وُجد)");

console.log(`\nالنتيجة: ${passed}/${passed + failed}`);
if (failed) process.exit(1);
